import os
import uuid
import random
from locust import HttpUser, task, constant

PDF_DIR = os.environ.get('PDF_DIR', '/app/adapters/umtas/pdfs')
PDF_FILES = [os.path.join(PDF_DIR, f) for f in os.listdir(PDF_DIR) if f.endswith('.pdf')] if os.path.exists(PDF_DIR) else []

class IngestionUser(HttpUser):
    wait_time = constant(1)

    def on_start(self):
        admin_token = os.environ.get('SIMULATION_API_KEY')
        
        email = f"loadtest_{uuid.uuid4().hex[:8]}@simserv.com"
        password = "wagwoord123"

        create_res = self.client.post(
            '/api/auth/admin/create-mock-user', 
            json={"email": email, "name": "Load Test", "password": password, "role": "STUDENT", "uniId": "up"},
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        
        if create_res.status_code in (200, 201):
            self.uni_id = create_res.json().get("uniId")
        else:
            print(f"Failed to create user: {create_res.text}")
            self.uni_id = None
            return  
        
        login_res = self.client.post('/api/auth/sign-in/email', json={"email": email, "password": password})
        
        if login_res.status_code == 200:
            token = login_res.json().get('session', {}).get('token')
            self.client.headers.update({'Authorization': f'Bearer {token}'})

    @task
    def upload_timetable_pdf(self):
        if not PDF_FILES or not getattr(self, 'uni_id', None):
            return 

        pdf_path = random.choice(PDF_FILES)
        
        with open(pdf_path, 'rb') as f:
            self.client.post(
                '/api/pdf-parser/jobs/upload', 
                data={"universityId": self.uni_id, "adapterKey": "up"}, 
                files={'file': (os.path.basename(pdf_path), f, 'application/pdf')},
                name="/api/pdf-parser/jobs/upload" 
            )