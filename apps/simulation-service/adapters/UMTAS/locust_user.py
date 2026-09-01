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
    
PROFILES_PATH = os.environ.get('PROFILES_PATH')
PROFILES = []
if PROFILES_PATH and os.path.exists(PROFILES_PATH):
    with open(PROFILES_PATH, 'r', encoding='utf-8') as f:
        PROFILES = json.load(f)

PDF_DIR = os.environ.get('PDF_DIR', '/app/adapters/umtas/pdfs')
PDF_FILES = []
if os.path.exists(PDF_DIR):
    PDF_FILES = [os.path.join(PDF_DIR, f) for f in os.listdir(PDF_DIR) if f.endswith('.pdf')]
    
print(f"Loaded {len(PROFILES)} profiles from {PROFILES_PATH}")
print(f"Found {len(PDF_FILES)} PDF files in {PDF_DIR}")

MAX_ENROLLED_MODULES = 4
MAX_TIMETABLE_EVENTS = 20
HEURISTIC_KEYS = "module,activity,location"

names_of_days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]


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

        admin_token = os.environ.get('SIMULATION_API_KEY')
        if not admin_token:
            raise ValueError("SIMULATION_API_KEY environment variable is not set!")
        
        admin_headers = {'Authorization': f'Bearer {admin_token}'}

        worker_id = str(uuid.uuid4())[:6]
        base_email = self.profile.get("email", f"fallback_{random.randint(1,9999)}@simulation.com")
        
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
            "uniId": self.profile.get("uniId", "default_uni")
        }

        with self.client.post('/api/auth/admin/create-mock-user', json=payload, headers=admin_headers, catch_response=True) as response:
            if response.status_code in (200, 201):
                response.success()
                print(f"User {unique_email} created successfully.")
                creds = response.json()
                self.uni_id = creds.get("uniId")
                
                login_payload = {
                    "email": unique_email,
                    "password": password
                }
                
                self.client.headers.pop('Authorization', None)
                
                with self.client.post('/api/auth/sign-in/email', json=login_payload, catch_response=True) as login_res:
                    if login_res.status_code == 200:
                        login_res.success()
                        print(f"User {unique_email} logged in successfully.")
                        
                        response_data = login_res.json()
                        token = response_data.get('session', {}).get('token')
                        
                        if token:
                            self.client.headers.update({'Authorization': f'Bearer {token}'})
                            
                    else:
                        login_res.failure(f"Login failed [{login_res.status_code}]: {login_res.text}")
                        print(f"LOGIN ERROR: {login_res.status_code} - {login_res.text}")
                        raise StopUser()
            else:
                response.failure(f"Failed to create user [{response.status_code}]: {response.text}")
                raise StopUser()

    @task(5)
    def upload_timetable_pdf(self):
        if not PDF_FILES or not getattr(self, 'uni_id', None):
            return 
            
        if getattr(self, 'pdf_id', None):
            return

        random_pdf_path = random.choice(PDF_FILES)
        
        data = {
            "universityId": self.uni_id, 
            "adapterKey": "up"
        }

        with open(random_pdf_path, 'rb') as pdf_file:
            files = {'file': (os.path.basename(random_pdf_path), pdf_file, 'application/pdf')}
            
            with self.client.post('/api/pdf-parser/jobs/upload', data=data, files=files, catch_response=True) as response:
                if response.status_code == 202:
                    response.success()
                    print(f"PDF {random_pdf_path} uploaded successfully for universityId {self.uni_id}.")
                    self.pdf_id = response.json().get("jobId")
                    self.pdf_result_ready = False
                else:
                    response.failure(f"Upload rejected: {response.text}")
                    print(f"PDF UPLOAD ERROR: {response.status_code} - {response.text}")

    @task(3)
    def check_pdf_parser_status(self):
        if not getattr(self, 'pdf_id', None) or getattr(self, 'pdf_result_ready', False):
            return
        
        with self.client.get(f'/api/pdf-parser/jobs/{self.pdf_id}', catch_response=True) as response:
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
        if getattr(self, 'pdf_id', None) and getattr(self, 'pdf_result_ready', False):
            with self.client.get(f'/api/pdf-parser/jobs/{self.pdf_id}/result', catch_response=True) as response:
                if response.status_code == 200:
                    response.success()
                elif response.status_code == 404:
                    response.failure(f"Result 404 for ready job {self.pdf_id}")
                
                self.pdf_id = None
                self.pdf_result_ready = False

    @task(2)
    def view_enrolled_modules(self):
        self.client.get('/api/builder')

    @task(2)
    def view_timetables(self):
        self.client.get('/api/timetables')

    @task(2)
    def view_all_events(self):
        with self.client.get('/api/events', catch_response=True) as response:
            if response.status_code == 200:
                try:
                    data = response.json()
                    events_list = data.get('events', [])
                    
                    extracted_ids = [str(event.get('eventId')) for event in events_list if event.get('eventId')]
                    
                    if extracted_ids:
                        self.available_event_ids = extracted_ids
                        
                    response.success()
                except Exception as e:
                    response.failure(f"Failed to parse events JSON: {str(e)}")

    @task(1)
    def get_active_session(self):
        self.client.get('/api/auth/get-session')

    @task(1)
    def submit_solver_job(self):
        def is_valid_uuid(val):
            try:
                uuid.UUID(str(val))
                return True
            except ValueError:
                return False

        event_ids_to_use = []

        if hasattr(self, 'available_event_ids') and self.available_event_ids:
            num_events = min(3, len(self.available_event_ids))
            event_ids_to_use = random.sample(self.available_event_ids, num_events)
            
        if not event_ids_to_use:
            raw_profile_ids = self.profile.get("eventIds", [])
            event_ids_to_use = [eid for eid in raw_profile_ids if is_valid_uuid(eid)]

        if not event_ids_to_use:
            return 

        payload = {
            "eventIds": event_ids_to_use, 
            "solveMode": "feasibility",
            "engine": "auto",
            "preferences": {
                "heuristics": []
            }
        }
        
        with self.client.post('/api/solver/jobs', json=payload, catch_response=True) as response:
            if response.status_code == 202:
                response.success()
                self.solver_id = response.json().get("jobId")
            else:
                response.failure(f"Solver rejected [{response.status_code}]: {response.text}")

    @task(1)
    def check_solver_status(self):
        if self.solver_id:
            self.client.get(f'/api/solver/jobs/{self.solver_id}')