import os
import json
import uuid
import random
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


class DomainUser(HttpUser):
    wait_time = between(0.5, 1)

    def on_start(self):
        if PROFILES:
            self.profile = random.choice(PROFILES)
        else:
            self.profile = {}

        self.pdf_id = None
        self.solver_id = None

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
        if not PDF_FILES:
            return
        
        if not hasattr(self, 'uni_id') or not self.uni_id:
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
                else:
                    response.failure(f"Upload rejected: {response.text}")
                    print(f"PDF UPLOAD ERROR: {response.status_code} - {response.text}")

    @task(3)
    def check_pdf_parser_status(self):
        if not self.pdf_id:
            return
        
        with self.client.get(f'/api/pdf-parser/jobs/{self.pdf_id}', catch_response=True) as response:
            if response.status_code == 200:
                print(f"PDF parser job {self.pdf_id} is complete.")
                response.success()
            elif response.status_code == 404:
                self.pdf_id = None 

    @task(2)
    def get_pdf_parser_result(self):
        if self.pdf_id:
            self.client.get(f'/api/pdf-parser/jobs/{self.pdf_id}/result')

    @task(2)
    def view_enrolled_modules(self):
        self.client.get('/api/builder')

    @task(2)
    def view_timetables(self):
        self.client.get('/api/timetables')

    @task(2)
    def view_all_events(self):
        self.client.get('/api/events')

    @task(1)
    def get_active_session(self):
        self.client.get('/api/auth/get-session')

    @task(1)
    def submit_solver_job(self):
        payload = {
            "eventIds": self.profile.get("eventIds", []), 
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
                response.failure(f"Solver rejected: {response.text}")

    @task(1)
    def check_solver_status(self):
        if self.solver_id:
            self.client.get(f'/api/solver/jobs/{self.solver_id}')