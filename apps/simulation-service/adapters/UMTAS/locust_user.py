import os
import json
import random
from locust import HttpUser, task, between


class DomainUser(HttpUser):
    wait_time = between(1,20)

    def on_start(self):
        # we start by loading pre exisisting profiles
        profiless= os.environ.get('PROFILES_PATH')
        if profiless and getattr(self,"profiles",None) is None:
            if os.path.exists(profiless):
                with open(profiless,'r',encoding='utf-8') as f:
                    DomainUser.profiles =json.load(f)
            else:
                DomainUser.profiles =[]
            DomainUser.profile_index =0;
        # load all the pdfs we have found from the various students haha
        pdf_files = os.environ.get('PDF_DIR', '/app/adapters/umtas/pdfs')
        if getattr(self, "pdf_files", None) is None:
            if os.path.exists(pdf_files):
                DomainUser.pdf_files = [
                    os.path.join(pdf_files, f) for f in os.listdir(pdf_files) if f.endswith('.pdf')
                ]
            else:
                DomainUser.pdf_files = []

        # add pdfs to profile
        if not DomainUser.profiles:
            self.profile = {}
        else:
            self.profile = DomainUser.profiles[DomainUser.profile_index % len(DomainUser.profiles)]
            DomainUser.profile_index += 1

        self.pdf_id= None
        self.solver_id = None

        admin_token = os.environ.get('SIMULATION_SERVICE_API_TOKEN', '')
        admin_headers = {'Authorization': f'Bearer {admin_token}'}

        payload = {
            "email": self.profile.get("email"),
            "name": self.profile.get("name"),
            "password": self.profile.get("password"),
            "role": "STUDENT", 
            "uniId": self.profile.get("uniId")
        }

        with self.client.post('/api/auth/admin/create-mock-user', json=payload, headers=admin_headers, catch_response=True) as response:
            if response.status_code in (200, 201):
                response.success()
                response_data = response.json()
                user_token = response_data.get("session", {}).get("token")
                self.client.headers.update({'Authorization': f'Bearer {user_token}'})
            else:
                response.failure(f"Failure to create mock user {response.text}")
                self.environment.runner.quit()

    @task(5)
    def upload_timetable_pdf(self):
        if not self.pdf_files:
            return

        random_pdf_path = random.choice(self.pdf_files)
        data = {
            "universityId": self.profile.get("uniId"),
            "adapterKey": "up"
        }

        with open(random_pdf_path, 'rb') as pdf_file:
            files = {'file': (os.path.basename(random_pdf_path), pdf_file, 'application/pdf')}
            
            with self.client.post('/api/pdf-parser/jobs/upload', data=data, files=files, catch_response=True) as response:
                if response.status_code == 202:
                    response.success()
                    res_json = response.json()
                    self.pdf_job_id = res_json.get("jobId")
                else:
                    response.failure(f"Upload rejected: {response.text}")

    @task(3)
    def check_pdf_parser_status(self):
        if not self.pdf_job_id:
            return
        
        with self.client.get(f'/api/pdf-parser/jobs/{self.pdf_job_id}', catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            elif response.status_code == 404:
                self.pdf_job_id = None 

    @task(2)
    def get_pdf_parser_result(self):
        if not self.pdf_job_id:
            return
            
        self.client.get(f'/api/pdf-parser/jobs/{self.pdf_job_id}/result')

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
                res_json = response.json()
                self.solver_job_id = res_json.get("jobId")
            else:
                response.failure(f"Solver rejected: {response.text}")

    @task(1)
    def check_solver_status(self):
        if not self.solver_job_id:
            return
            
        self.client.get(f'/api/solver/jobs/{self.solver_job_id}')  
    

# PLEASE NOTE
# down below is the auto generated script from the bootstrap spec 

# as a POC this is great, but for UMTAS we opted for a manually coded locust file to ensure we produce enough traffic for stats 
# Down below works for an onboarding stress test 





# class DomainUser(HttpUser):
#     wait_time = between(1, 3)

#     def on_start(self):
#         profiles_path = os.environ.get('PROFILES_PATH')
#         if profiles_path and os.path.exists(profiles_path):
#             with open(profiles_path, 'r', encoding='utf-8') as f:
#                 self.profiles = json.load(f)
#         else:
#             self.profiles = []
#         self.profile_index = 0

#     def get_next_profile(self):
#         if not self.profiles:
#             return {}
#         p = self.profiles[self.profile_index % len(self.profiles)]
#         self.profile_index += 1
#         return p

#     @task
#     def AppController_getHello(self):
#         profile = self.get_next_profile()
#         self.client.get('/api')

#     @task
#     def signUpEmail(self):
#         profile = self.get_next_profile()
#         # TODO: Improve payloads
#         payload = profile
#         self.client.post('/api/auth/sign-up/email', json=payload)

#     @task
#     def signInEmail(self):
#         profile = self.get_next_profile()
#         # TODO: Improve payloads
#         payload = profile
#         self.client.post('/api/auth/sign-in/email', json=payload)

#     @task
#     def signOut(self):
#         profile = self.get_next_profile()
#         # TODO: Improve payloads
#         payload = profile
#         self.client.post('/api/auth/sign-out', json=payload)

#     @task
#     def getSession(self):
#         profile = self.get_next_profile()
#         self.client.get('/api/auth/get-session')

#     @task
#     def listSessions(self):
#         profile = self.get_next_profile()
#         self.client.get('/api/auth/list-sessions')

#     @task
#     def revokeSession(self):
#         profile = self.get_next_profile()
#         # TODO: Improve payloads
#         payload = profile
#         self.client.post('/api/auth/revoke-session', json=payload)

#     @task
#     def sendVerificationEmail(self):
#         profile = self.get_next_profile()
#         # TODO: Improve payloads
#         payload = profile
#         self.client.post('/api/auth/send-verification-email', json=payload)

#     @task
#     def verifyEmail(self):
#         profile = self.get_next_profile()
#         # TODO: Improve payloads
#         payload = profile
#         self.client.post('/api/auth/verify-email', json=payload)

#     @task
#     def forgetPassword(self):
#         profile = self.get_next_profile()
#         # TODO: Improve payloads
#         payload = profile
#         self.client.post('/api/auth/forget-password', json=payload)

#     @task
#     def resetPassword(self):
#         profile = self.get_next_profile()
#         # TODO: Improve payloads
#         payload = profile
#         self.client.post('/api/auth/reset-password', json=payload)

#     @task
#     def changePassword(self):
#         profile = self.get_next_profile()
#         # TODO: Improve payloads
#         payload = profile
#         self.client.post('/api/auth/change-password', json=payload)

#     @task
#     def googleOAuthCallback(self):
#         profile = self.get_next_profile()
#         self.client.get('/api/auth/callback/google')

#     @task
#     def linkGoogleAccount(self):
#         profile = self.get_next_profile()
#         # TODO: Improve payloads
#         payload = profile
#         self.client.post('/api/auth/link-account/google', json=payload)

#     @task
#     def adminCreateUser(self):
#         profile = self.get_next_profile()
#         # TODO: Improve payloads
#         payload = profile
#         self.client.post('/api/auth/admin/create-user', json=payload)

#     @task
#     def adminCreateMockUser(self):
#         profile = self.get_next_profile()
#         # TODO: Improve payloads
#         payload = profile
#         self.client.post('/api/auth/admin/create-mock-user', json=payload)

#     @task
#     def adminDeleteMockUsers(self):
#         profile = self.get_next_profile()
#         self.client.delete('/api/auth/admin/delete-mock-users')

#     @task
#     def adminImpersonateUser(self):
#         profile = self.get_next_profile()
#         # TODO: Improve payloads
#         payload = profile
#         self.client.post('/api/auth/admin/impersonate-user', json=payload)

#     @task
#     def adminBanUser(self):
#         profile = self.get_next_profile()
#         # TODO: Improve payloads
#         payload = profile
#         self.client.post('/api/auth/admin/ban-user', json=payload)

#     @task
#     def adminUpdateUser(self):
#         profile = self.get_next_profile()
#         # TODO: Improve payloads
#         payload = profile
#         self.client.post('/api/auth/admin/update-user', json=payload)

#     @task
#     def AuthController_selectUniversity(self):
#         profile = self.get_next_profile()
#         # TODO: Improve payloads
#         payload = profile
#         self.client.post('/api/auth/select-university', json=payload)

#     @task
#     def HealthController_live(self):
#         profile = self.get_next_profile()
#         self.client.get('/api/health')

#     @task
#     def HealthController_check(self):
#         profile = self.get_next_profile()
#         self.client.get('/api/health/check')

#     @task
#     def ModuleController_createModule(self):
#         profile = self.get_next_profile()
#         # TODO: Improve payloads
#         payload = profile
#         self.client.post('/api/modules', json=payload)

#     @task
#     def ModuleController_getAll(self):
#         profile = self.get_next_profile()
#         self.client.get('/api/modules')

#     @task
#     def getModuleById(self):
#         profile = self.get_next_profile()
#         self.client.get('/api/modules/{moduleId}')

#     @task
#     def deleteModule(self):
#         profile = self.get_next_profile()
#         self.client.delete('/api/modules/{moduleId}')

#     @task
#     def enrolStudentToModule(self):
#         profile = self.get_next_profile()
#         self.client.get('/api/modules/enroll/{moduleId}')

#     @task
#     def addModulesToCourse(self):
#         profile = self.get_next_profile()
#         # TODO: Improve payloads
#         payload = profile
#         self.client.put('/api/modules/{CourseID}', json=payload)

#     @task
#     def updateStyling(self):
#         profile = self.get_next_profile()
#         # TODO: Improve payloads
#         payload = profile
#         self.client.post('/api/modules/styling/{moduleId}', json=payload)

#     @task
#     def createCourse(self):
#         profile = self.get_next_profile()
#         # TODO: Improve payloads
#         payload = profile
#         self.client.post('/api/Courses', json=payload)

#     @task
#     def getCourses(self):
#         profile = self.get_next_profile()
#         # TODO: Improve payloads
#         payload = profile
#         self.client.post('/api/Courses/getAll', json=payload)

#     @task
#     def getCourseById(self):
#         profile = self.get_next_profile()
#         self.client.get('/api/Courses/{CourseId}')

#     @task
#     def deleteCourse(self):
#         profile = self.get_next_profile()
#         self.client.delete('/api/Courses/{CourseId}')

#     @task
#     def UniversityController_create(self):
#         profile = self.get_next_profile()
#         # TODO: Improve payloads
#         payload = profile
#         self.client.post('/api/universities', json=payload)

#     @task
#     def getUniversities(self):
#         profile = self.get_next_profile()
#         self.client.get('/api/universities')

#     @task
#     def getUniversityById(self):
#         profile = self.get_next_profile()
#         self.client.get('/api/universities/{universityId}')

#     @task
#     def deleteUniversity(self):
#         profile = self.get_next_profile()
#         self.client.delete('/api/universities/{universityId}')

#     @task
#     def getUserRoleByUniID(self):
#         profile = self.get_next_profile()
#         self.client.get('/api/universities/role/{universityId}')

#     @task
#     def getAllApplications(self):
#         profile = self.get_next_profile()
#         # TODO: Improve payloads
#         payload = profile
#         self.client.post('/api/universities/applications/{universityID}', json=payload)

#     @task
#     def applyForUniverstiyRole(self):
#         profile = self.get_next_profile()
#         # TODO: Improve payloads
#         payload = profile
#         self.client.post('/api/universities/apply', json=payload)

#     @task
#     def approveUsersRole(self):
#         profile = self.get_next_profile()
#         # TODO: Improve payloads
#         payload = profile
#         self.client.post('/api/universities/approve', json=payload)

#     @task
#     def createEvent(self):
#         profile = self.get_next_profile()
#         # TODO: Improve payloads
#         payload = profile
#         self.client.post('/api/events', json=payload)

#     @task
#     def getAllEvents(self):
#         profile = self.get_next_profile()
#         self.client.get('/api/events')

#     @task
#     def getEventById(self):
#         profile = self.get_next_profile()
#         self.client.get('/api/events/{eventId}')

#     @task
#     def deleteEvent(self):
#         profile = self.get_next_profile()
#         self.client.delete('/api/events/{id}')

#     @task
#     def createTimetable(self):
#         profile = self.get_next_profile()
#         # TODO: Improve payloads
#         payload = profile
#         self.client.post('/api/timetables', json=payload)

#     @task
#     def getAllTimetables(self):
#         profile = self.get_next_profile()
#         self.client.get('/api/timetables')

#     @task
#     def getTimetableById(self):
#         profile = self.get_next_profile()
#         self.client.get('/api/timetables/{id}')

#     @task
#     def deleteTimetable(self):
#         profile = self.get_next_profile()
#         self.client.delete('/api/timetables/{id}')

#     @task
#     def BuilderController_createModule(self):
#         profile = self.get_next_profile()
#         # TODO: Improve payloads
#         payload = profile
#         self.client.post('/api/builder', json=payload)

#     @task
#     def BuilderController_getAll(self):
#         profile = self.get_next_profile()
#         self.client.get('/api/builder')

#     @task
#     def builder_getModuleById(self):
#         profile = self.get_next_profile()
#         self.client.get('/api/builder/{moduleId}')

#     @task
#     def builder_deleteModule(self):
#         profile = self.get_next_profile()
#         self.client.delete('/api/builder/{moduleId}')

#     @task
#     def PdfParserController_lookupDuplicate(self):
#         profile = self.get_next_profile()
#         # TODO: Improve payloads
#         payload = profile
#         self.client.post('/api/pdf-parser/jobs/lookup', json=payload)

#     @task
#     def PdfParserController_uploadAndEnqueue(self):
#         profile = self.get_next_profile()
#         # TODO: Improve payloads
#         payload = profile
#         self.client.post('/api/pdf-parser/jobs/upload', json=payload)

#     @task
#     def PdfParserController_getJob(self):
#         profile = self.get_next_profile()
#         self.client.get('/api/pdf-parser/jobs/{jobId}')

#     @task
#     def PdfParserController_getJobResult(self):
#         profile = self.get_next_profile()
#         self.client.get('/api/pdf-parser/jobs/{jobId}/result')

#     @task
#     def PdfParserController_receiveCallback(self):
#         profile = self.get_next_profile()
#         # TODO: Improve payloads
#         payload = profile
#         self.client.post('/api/pdf-parser/jobs/{jobId}/callback', json=payload)

#     @task
#     def SolverController_submitAndEnqueue(self):
#         profile = self.get_next_profile()
#         # TODO: Improve payloads
#         payload = profile
#         self.client.post('/api/solver/jobs', json=payload)

#     @task
#     def SolverController_getInput(self):
#         profile = self.get_next_profile()
#         self.client.get('/api/solver/jobs/{jobId}/input')

#     @task
#     def SolverController_getJob(self):
#         profile = self.get_next_profile()
#         self.client.get('/api/solver/jobs/{jobId}')

#     @task
#     def SolverController_getJobResult(self):
#         profile = self.get_next_profile()
#         self.client.get('/api/solver/jobs/{jobId}/result')

#     @task
#     def SolverController_receiveCallback(self):
#         profile = self.get_next_profile()
#         # TODO: Improve payloads
#         payload = profile
#         self.client.post('/api/solver/jobs/{jobId}/callback', json=payload)

#     @task
#     def createAttendance(self):
#         profile = self.get_next_profile()
#         # TODO: Improve payloads
#         payload = profile
#         self.client.post('/api/attendance', json=payload)

#     @task
#     def getAllAttendance(self):
#         profile = self.get_next_profile()
#         self.client.get('/api/attendance')

#     @task
#     def getAttendanceById(self):
#         profile = self.get_next_profile()
#         self.client.get('/api/attendance/{attendanceId}')

#     @task
#     def deleteAttendance(self):
#         profile = self.get_next_profile()
#         self.client.delete('/api/attendance/{attendanceId}')
