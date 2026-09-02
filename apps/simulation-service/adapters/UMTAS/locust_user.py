import datetime
import json
import os
import random
import threading
import time
import uuid
from collections import Counter
from locust import HttpUser, task, between
from locust.exception import StopUser

PROFILES_PATH = os.environ.get("PROFILES_PATH")
PROFILES = []
if PROFILES_PATH and os.path.exists(PROFILES_PATH):
    with open(PROFILES_PATH, "r", encoding="utf-8") as f:
        PROFILES = json.load(f)

PDF_DIR = os.environ.get("PDF_DIR", "/app/adapters/umtas/pdfs")
PDF_FILES = []
if os.path.exists(PDF_DIR):
    PDF_FILES = [
        os.path.join(PDF_DIR, f) for f in os.listdir(PDF_DIR) if f.endswith(".pdf")
    ]

print(f"Loaded {len(PROFILES)} profiles from {PROFILES_PATH}")
print(f"Found {len(PDF_FILES)} PDF files in {PDF_DIR}")

MAX_ENROLLED_MODULES = 4
MAX_TIMETABLE_EVENTS = 20
HEURISTIC_KEYS = "module,activity,location"

names_of_days = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
]


def is_valid_checker(val) -> bool:
    try:
        uuid.UUID(str(val))
        return True
    except (ValueError, TypeError):
        return False


def next_day_checker(day_of_week):
    today = datetime.date.today()
    try:
        target = names_of_days.index(day_of_week.lower())
    except (ValueError, AttributeError):
        return today.isoformat()
    delta = (target - today.weekday()) % 7
    return (today + datetime.timedelta(days=delta)).isoformat()


def event_date_checker(event: dict) -> str:
    criteria = event.get("eventCriteria") or {}
    if criteria.get("date"):
        return criteria["date"]
    if criteria.get("dayOfWeek"):
        return next_day_checker(criteria["dayOfWeek"])
    return datetime.date.today().isoformat()


class DomainUser(HttpUser):
    wait_time = between(0.5, 1)

    def on_start(self):
        self.profile = random.choice(PROFILES) if PROFILES else {}
        self.pdf_id = None
        self.pdf_result_ready = False
        self.browsed_module_ids = []
        self.enrolled_module_ids = set()
        self.known_events = {}
        self.timetable_id = None
        self.timetable_event_ids = set()
        self.solver_id = None
        self.solver_result_ready = False
        self.attendance_ids = []

        admin_token = os.environ.get("SIMULATION_API_KEY")
        if not admin_token:
            raise ValueError("SIMULATION_API_KEY environment variable is not set!")

        admin_headers = {"Authorization": f"Bearer {admin_token}"}

        worker_id = str(uuid.uuid4())[:6]
        base_email = self.profile.get(
            "email", f"fallback_{random.randint(1,9999)}@simulation.com"
        )

        if "@" in base_email:
            name, domain = base_email.split("@", 1)
            unique_email = f"{name}+{worker_id}@{domain}"
        else:
            unique_email = f"{base_email}_{worker_id}@simulation.com"

        password = self.profile.get("password", "password123!")

        payload = {
            "email": unique_email,
            "name": self.profile.get("name", "Test User"),
            "password": password,
            "role": "STUDENT",
            "uniId": self.profile.get("uniId", "default_uni"),
        }

        with self.client.post(
            "/api/auth/admin/create-mock-user",
            json=payload,
            headers=admin_headers,
            catch_response=True,
        ) as response:
            if response.status_code not in (200, 201):
                response.failure(
                    f"create-mock-user {response.status_code}: {response.text}"
                )
                raise StopUser()
            response.success()
            self.uni_id = response.json().get("uniId")

        login_payload = {"email": unique_email, "password": password}
        self.client.headers.pop("Authorization", None)
        with self.client.post(
            "/api/auth/sign-in/email", json=login_payload, catch_response=True
        ) as login_res:
            if login_res.status_code != 200:
                login_res.failure(f"login failed ({login_res.status_code})")
                raise StopUser()
            login_res.success()
            token = (login_res.json().get("session") or {}).get("token")
            if token:
                self.client.headers.update({"Authorization": f"Bearer {token}"})

        if not self.uni_id:
            return

        with self.client.post(
            "/api/auth/select-university",
            json={"uniId": self.uni_id},
            catch_response=True,
        ) as select_res:
            if select_res.status_code not in (200, 201):
                select_res.failure(
                    f"select-university {select_res.status_code}: {select_res.text}"
                )
                raise StopUser()
            select_res.success()
            select_data = select_res.json()
            self.uni_role = select_data.get("uniRole")
            select_token = (select_data.get("session") or {}).get("token")
            if select_token:
                self.client.headers.update({"Authorization": f"Bearer {select_token}"})

    @task(3)
    def browse_modules(self):
        if not getattr(self, "uni_id", None):
            return
        with self.client.get(
            f"/api/modules?universityId={self.uni_id}",
            name="/api/modules?universityId=[id]",
            catch_response=True,
        ) as response:
            if response.status_code == 200:
                response.success()
                modules = response.json().get("modules", [])
                self.browsed_module_ids = [
                    m["moduleID"] for m in modules if m.get("moduleID")
                ]
            elif response.status_code == 404:
                response.success()
            else:
                response.failure(f"unexpected status {response.status_code}")

    @task(2)
    def enroll_in_module(self):
        if len(self.enrolled_module_ids) >= MAX_ENROLLED_MODULES:
            return
        candidates = [
            m for m in self.browsed_module_ids if m not in self.enrolled_module_ids
        ]
        if not candidates:
            return
        module_id = random.choice(candidates)

        with self.client.get(
            f"/api/modules/enroll/{module_id}",
            name="/api/modules/enroll/[moduleId]",
            catch_response=True,
        ) as response:
            if response.status_code == 200:
                response.success()
                self.enrolled_module_ids.add(module_id)
            elif response.status_code == 201:
                response.success()
                self.enrolled_module_ids.discard(module_id)
            else:
                response.failure(f"enroll rejected [{response.status_code}]")

    @task(2)
    def upload_timetable_pdf(self):
        if not PDF_FILES or not getattr(self, "uni_id", None) or self.pdf_id:
            return

        random_pdf_path = random.choice(PDF_FILES)
        data = {"universityId": self.uni_id, "adapterKey": "up"}
        with open(random_pdf_path, "rb") as pdf_file:
            files = {
                "file": (os.path.basename(random_pdf_path), pdf_file, "application/pdf")
            }
            with self.client.post(
                "/api/pdf-parser/jobs/upload",
                data=data,
                files=files,
                catch_response=True,
            ) as response:
                if response.status_code == 202:
                    response.success()
                    self.pdf_id = response.json().get("jobId")
                    self.pdf_result_ready = False
                else:
                    response.failure(f"upload rejected [{response.status_code}]")

    @task(3)
    def view_events_for_enrolled_module(self):
        if not self.enrolled_module_ids:
            return
        module_id = random.choice(list(self.enrolled_module_ids))
        with self.client.get(
            f"/api/events?moduleId={module_id}",
            name="/api/events?moduleId=[id]",
            catch_response=True,
        ) as response:
            if response.status_code == 200:
                response.success()
                for ev in response.json().get("events", []):
                    if ev.get("eventId"):
                        self.known_events[ev["eventId"]] = ev
            elif response.status_code in (401, 403):
                response.failure(f"auth error viewing events: {response.status_code}")
            else:
                response.success()


    @task(1)
    def view_timetable_detail(self):
        if not self.timetable_id:
            return
        with self.client.get(
            f"/api/timetables/{self.timetable_id}",
            name="/api/timetables/[id]",
            catch_response=True,
        ) as response:
            if response.status_code == 200:
                response.success()
            elif response.status_code == 404:
                response.success()
                self.timetable_id = None
                self.timetable_event_ids = set()
            else:
                response.failure(
                    f"timetable detail fetch failed [{response.status_code}]"
                )

    @task(2)
    def build_or_grow_timetable(self):
        candidate_ids = [
            eid for eid in self.known_events if eid not in self.timetable_event_ids
        ]

        if self.timetable_id is None:
            if not candidate_ids:
                return
            picks = random.sample(candidate_ids, k=min(3, len(candidate_ids)))
            payload = {
                "timetableName": f"Sim Timetable {uuid.uuid4().hex[:6]}",
                "eventIds": picks,
            }
            with self.client.post(
                "/api/timetables", json=payload, catch_response=True
            ) as response:
                if response.status_code == 201:
                    response.success()
                    data = response.json()
                    self.timetable_id = data.get("UserTimetableID")
                    self.timetable_event_ids = set(data.get("eventIds", picks))
                else:
                    response.failure(
                        f"timetable create failed [{response.status_code}]: {response.text}"
                    )
            return

        if len(self.timetable_event_ids) >= MAX_TIMETABLE_EVENTS or not candidate_ids:
            return
        picks = random.sample(candidate_ids, k=min(2, len(candidate_ids)))
        with self.client.patch(
            f"/api/timetables/{self.timetable_id}",
            json={"addEventIds": picks},
            name="/api/timetables/[id]",
            catch_response=True,
        ) as response:
            if response.status_code == 200:
                response.success()
                self.timetable_event_ids.update(picks)
            elif response.status_code == 404:
                response.success()
                self.timetable_id = None
                self.timetable_event_ids = set()
            else:
                response.failure(f"timetable update failed [{response.status_code}]")

    @task(3)
    def check_pdf_parser_status(self):
        if not getattr(self, "pdf_id", None) or getattr(
            self, "pdf_result_ready", False
        ):
            return

        with self.client.get(
            f"/api/pdf-parser/jobs/{self.pdf_id}", catch_response=True
        ) as response:
            if response.status_code == 200:
                data = response.json()
                status = data.get("status", "").lower()

                if status in ["completed", "done", "success"]:
                    self.pdf_result_ready = True
                    response.success()

                elif status in ["failed", "error"]:
                    error_msg = data.get("error", {}).get("message", "Unknown error")
                    response.failure(f"Backend job failed: {error_msg}")
                    self.pdf_id = None
                    self.pdf_result_ready = False

                else:
                    response.success()

            elif response.status_code == 404:
                self.pdf_id = None
                self.pdf_result_ready = False

    @task(2)
    def get_pdf_parser_result(self):
        if getattr(self, "pdf_id", None) and getattr(self, "pdf_result_ready", False):
            with self.client.get(
                f"/api/pdf-parser/jobs/{self.pdf_id}/result", catch_response=True
            ) as response:
                if response.status_code == 200:
                    response.success()
                elif response.status_code == 404:
                    response.failure(f"Result 404 for ready job {self.pdf_id}")

                self.pdf_id = None
                self.pdf_result_ready = False

    @task(2)
    def view_enrolled_modules(self):
        self.client.get("/api/builder")

    @task(2)
    def view_timetables(self):
        self.client.get("/api/timetables")

    @task(1)
    def view_all_events(self):
        with self.client.get("/api/events", catch_response=True) as response:
            if response.status_code == 200:
                response.success()
                for ev in response.json().get("events", []):
                    if ev.get("eventId"):
                        self.known_events[ev["eventId"]] = ev
            else:
                response.failure(f"failed to list events [{response.status_code}]")

    @task(1)
    def get_active_session(self):
        self.client.get("/api/auth/get-session")
        
    @task(1)
    def fetch_and_apply_solver_result(self):
        if not (self.solver_id and self.solver_result_ready):
            return
        with self.client.get(
            f"/api/solver/jobs/{self.solver_id}/result", name="/api/solver/jobs/[id]/result", catch_response=True
        ) as response:
            if response.status_code != 200:
                response.failure(f"solver result fetch failed [{response.status_code}]")
                self.solver_id = None
                self.solver_result_ready = False
                return
            response.success()
            selected = response.json().get("timetableSolution", {}).get("selectedEventIds", [])

        if self.timetable_id and selected:
            to_add = [eid for eid in selected if eid not in self.timetable_event_ids]
            if to_add:
                with self.client.patch(
                    f"/api/timetables/{self.timetable_id}",
                    json={"addEventIds": to_add},
                    name="/api/timetables/[id]",
                    catch_response=True,
                ) as patch_response:
                    if patch_response.status_code == 200:
                        patch_response.success()
                        self.timetable_event_ids.update(to_add)
                    elif patch_response.status_code == 404:
                        patch_response.success()
                        self.timetable_id = None
                        self.timetable_event_ids = set()
                    else:
                        patch_response.failure(f"failed to apply solver result [{patch_response.status_code}]")

        self.solver_id = None
        self.solver_result_ready = False


    @task(1)
    def view_attendance(self):
        with self.client.get("/api/attendance", catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"view attendance failed [{response.status_code}]")
                
    @task(2)
    def submit_solver_job(self):
        if self.solver_id is not None:
            return

        event_ids = [eid for eid in self.timetable_event_ids if is_valid_checker(eid)]
        if not event_ids:
            event_ids = [eid for eid in self.known_events if is_valid_checker(eid)]
        if not event_ids:
            event_ids = [
                eid for eid in self.profile.get("eventIds", []) if is_valid_checker(eid)
            ]
        if not event_ids:
            return

        solve_mode = random.choices(["feasibility", "optimization"], weights=[7, 3])[0]
        engine = random.choices(["auto", "cp-sat", "ga"], weights=[6, 2, 2])[0]
        heuristics = []
        if solve_mode == "optimization":
            heuristics = [
                {"key": k, "weight": round(random.uniform(0.1, 1.0), 2)}
                for k in HEURISTIC_KEYS
            ]

        payload = {
            "eventIds": event_ids,
            "solveMode": solve_mode,
            "engine": engine,
            "preferences": {"heuristics": heuristics},
        }

        with self.client.post(
            "/api/solver/jobs", json=payload, catch_response=True
        ) as response:
            if response.status_code != 202:
                response.failure(f"solver rejected [{response.status_code}]")
                return
            response.success()
            data = response.json()
            self.solver_id = data.get("jobId")
            self.solver_result_ready = False
            if data.get("status") == "completed" and data.get("result"):
                self.solver_result_ready = True


    @task(2)
    def check_solver_status(self):
        if not self.solver_id or self.solver_result_ready:
            return
        with self.client.get(
            f"/api/solver/jobs/{self.solver_id}", name="/api/solver/jobs/[id]", catch_response=True
        ) as response:
            if response.status_code != 200:
                response.failure(f"solver status check failed [{response.status_code}]")
                return
            response.success()
            data = response.json()
            status = data.get("status")

            if status == "completed":
                self.solver_result_ready = True
            elif status == "failed":
                self.solver_id = None
                self.solver_result_ready = False
