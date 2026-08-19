import os
import uuid
import random
from locust import HttpUser, task, constant

PDF_DIR = os.environ.get('PDF_DIR', '/app/adapters/umtas/pdfs')
PDF_FILES = [os.path.join(PDF_DIR, f) for f in os.listdir(PDF_DIR) if f.endswith('.pdf')] if os.path.exists(PDF_DIR) else []

class IngestionUser(HttpUser):
    wait_time = constant(1)

    def on_start(self):
        admin_token = os.environ.get('SIMULATION_API_KEY', 'fallback-key-if-needed')
        

        email = f"loadtest_{uuid.uuid4().hex[:8]}@simserv.com"
        password = "wagwoord123"
        self.uni_id = "up"  

        self.client.post(
            '/api/auth/admin/create-mock-user', 
            json={"email": email, "name": "Load Test", "password": password, "role": "STUDENT", "uniId": self.uni_id},
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        
        login_res = self.client.post('/api/auth/sign-in/email', json={"email": email, "password": password})
        
        if login_res.status_code == 200:
            token = login_res.json().get('session', {}).get('token')
            self.client.headers.update({'Authorization': f'Bearer {token}'})

    @task
    def upload_timetable_pdf(self):
        if not PDF_FILES:
            return 

        pdf_path = random.choice(PDF_FILES)
        
        with open(pdf_path, 'rb') as f:
            self.client.post(
                '/api/pdf-parser/jobs/upload', 
                data={"universityId": self.uni_id, "adapterKey": "up"}, 
                files={'file': (os.path.basename(pdf_path), f, 'application/pdf')},
                name="/api/pdf-parser/jobs/upload" 
            )