# Functional Requirements

# FR 1 
### R1.1 Landing Page Website

- **R1.1.1** The system shall provide a landing page for all users prior to login/register.
    - **R1.1.1.1** The system shall allow users to visit the main Umtas website through the landing page.
- **R1.1.2** The landing page shall present system functionalities to entice users.
    - **R1.1.2.1** The system shall explain the functionality of each of the 3 adaptors to the users
        - **R1.1.2.1.1** The system shall explain the functionality of the `Builder` adapter
        - **R1.1.2.1.2** The system shall explain the functionality of the `pdf upload` adapter
        - **R1.1.2.1.3** The system shall explain the functionality of the `University API` adapter
    - **R1.1.2.2** The system shall highlight each users ability through the system
        - **R1.1.2.2.1** The system shall explain the functionality extended to a Student.
        - **R1.1.2.2.2** The system shall explain the functionality extended to an Admin.
        - **R1.1.2.2.3** The system shall explain the functionality extended to a Lecturer.
        - **R1.1.2.2.4** The system shall explain the functionality extended to a Tyto simulation admin.

### R1.2 Login and Register System

- **R1.2.1** The system shall allow users to log in.
    - **R1.2.1.1** The system shall allow users to login using Oauth
    - **R1.2.1.2** The system shall allow users to login using "in house" system
- **R1.2.2** The system shall allow users to register.
    - **R1.2.2.1** The system shall allow users to register using Oauth
    - **R1.2.2.2** The system shall allow users to register using "in house" system
- **R1.2.3** The system shall manage user sessions.
- **R1.2.4** The system shall allow users manage their account and system state
    - **R1.2.4.1** The system shall allow users to sign out.
    - **R1.2.4.2** The system shall allow users to reset their password
    - **R1.2.4.3** The system shall allow users to delete their account

# FR 2 

### R2.1 Timetable Management
- **R2.1.1** The system shall allow students to view timetables.
	- **R2.1.1.1** The system shall allow students to view events and modules in a time table.
	- **R2.1.1.2** The system shall allow students to view the time table in a calendar format.
		- **R2.1.1.2.1** The system shall allow students to view the time table per week where relevant.
		- **R2.1.1.2.2** The system shall allow students to view time table details at a higher level such as related statistics.
	- **R2.1.1.3** The system shall allow students to select individual time tables from a list of stored timetables created by the user.
- **R2.1.2** The system shall allow students to update timetables.
	- **R2.1.2.1** The system shall allow students to update timetable modules for owned modules.
		- **R2.1.2.1.1** The system shall allow students to update timetable module names. 
		- **R2.1.2.1.1** The system shall allow students to update timetable module codes.
	- **R2.1.2.2** The system shall allow students to update timetable events listed details for owned events.
		- **R2.1.2.2.1** The system shall allow students to update timetable event venues.
		- **R2.1.2.2.2** The system shall allow students to update timetable event times.
		- **R2.1.2.2.3** The system shall allow students to update timetable event days 
- **R2.1.3** The system shall allow students to delete timetables which will not effect related events and modules.

### R2.2 Timetable Creation – Builder
- **R2.2.1** The system shall allow students to create new timetables.
	- **R2.2.1.1** The system shall allow students to create modules for timetables setting the related details of a module.
	- **R2.2.1.2** The system shall allow students to create events for timetables setting the related details of module events.
	- **R2.2.1.3** The system shall allow students to create a timetable from events and modules.
- **R2.2.2** The system shall allow timetable customisation.
	- **R2.2.2.1** The system shall allow timetable customisation of name
	- **R2.2.2.2** The system shall allow timetable customisation of colour

### R2.3 Timetable Creation – PDF System

- **R2.3.1** The system shall automate timetable creation using a PDF if provided by a university of all classes if supported.
	- **R2.3.1.1** The system will create modules based on the provided PDF if they do not exist within the system
	- **R2.3.1.2** The system will do a module lookup based on the provided PDF if they do exist within the system
	- **R2.3.1.3** The system will create events based on the provided PDF if they do not exist within the system
	- **R2.3.1.4** The system will do a event lookup based on the provided PDF if they do exist within the system
	-  **R2.3.1.5** The system will allow a user to create a timetable based on provided selection of events from the system
	-  **R2.3.1.5** The system will allow a user to modify colours and other individual user details related to the timetable
- **R2.3.2** The system shall allow user modification of PDF‑generated timetables.
	- **R2.3.2.1** The system shall allow users to modify individual related details of a timetable
	- **R2.3.2.2** The system shall allow users to modify selected events from module list

### R2.4 Timetable Creation – API System

- **R2.4.1** The system shall automate timetable creation using a university‑provided API (if applicable).
    - **R2.4.1.1** The system will create modules based on the provided API if they do not exist within the system.
    - **R2.4.1.2** The system will do a module lookup based on the provided API if they do exist within the system.
    - **R2.4.1.3** The system will create events based on the provided API if they do not exist within the system.
    - **R2.4.1.4** The system will do an event lookup based on the provided API if they do exist within the system.
    - **R2.4.1.5** The system will allow a user to create a timetable based on provided selection of events from the system.
    - **R2.4.1.6** The system will allow a user to modify colours and other individual user details related to the timetable.
- **R2.4.2** The system shall allow user customisation of API‑generated timetables. 
    - **R2.4.2.1** The system shall allow users to modify individual related details of a timetable.
    - **R2.4.2.2** The system shall allow users to modify selected events from the module list.

### R2.5 Calendar Exporting
- **R2.5.1** The system shall allow export of timetables as `.ics` files for calendar import.
	- **R2.5.1.1** The system shall allow for details of the `.ics` file to be altered by a user such as its summary / name.
	- **R2.5.1.2** The system shall allow users to modify the event description within the `.ics` file.
	- **R2.5.1.3** The system shall allow users to update the event location stored in the `.ics` file. 
	- **R2.5.1.4** The system shall allow users to change the event start and end times in the `.ics` file.
	- **R2.5.1.5** The system shall allow users to adjust the event status such as confirmed or cancelled.
	- **R2.5.1.6** The system shall make use of a uuid such that duplicate events are accounted for.
- **R2.5.2** The system shall allow direct sync with Google Calendar.
	    - **R2.5.2.1** The system shall support creating a Google Calendar instance.

# FR 3

### R3.1 Analytics System

- **R3.1.1** The system will provide statistical analysis tools for admins and lecturers of supported universities.
    - **R3.1.1.1** The system shall provide statistical analysis tools centred around attendance.
        - **R3.1.1.1.1** The system shall allow university admins and lecturers to view submitted students for a module time slot.
        - **R3.1.1.1.2** The system shall allow university admins and lecturers to view actual attendance for a module time slot.
        - **R3.1.1.1.3** The system shall allow university admins and lecturers to view projected attendance.
    - **R3.1.1.2** The system shall provide statistical analysis tools centred around visualisation.
        - **R3.1.1.2.1** The system shall provide statistical heat‑map tools based on venues in the university of logged modules.
        - **R3.1.1.2.2** The system shall provide statistical graphing tools based on attendance of events for projected, actual, and submitted attendance types.
        - **R3.1.1.2.3** The system shall provide statistical graphing tools based on bookings of events by date.

### R3.2 Lecturer Adjustment System
- **R3.2.1** The system will allow lecturers to alter details about their events.  
    - **R3.2.1.1** The system shall allow lecturers to alter venue location for an event(s).  
    - **R3.2.1.2** The system shall allow lecturers to alter times for an event(s).  
    - **R3.2.1.3** The system shall allow lecturers to cancel an event(s).  
    - **R3.2.1.4** The system shall allow lecturers to add lecturers to events/modules.  

### R3.3 Alert System
- **R3.3.1** The system will send alerts out based on event changes.  
    - **R3.3.1.1** The system shall send out alerts if venues have changed for an event.  
    - **R3.3.1.2** The system shall send out alerts if times have changed for an event.  
    - **R3.3.1.3** The system shall send out alerts if event status has changed, such as a cancellation of the event on a day.  

# FR 4 Administation system

### FR 4.1 Course management for university admins
- **R4.1.1** The system shall provide tools to create courses for universities 
- **R4.1.2** The system shall provide tools to delete courses from universities
- **R4.1.3** The system shall provide tools to modify courses for universities
  - **4.1.3.1** The system will shall allow updates to a courses name
  - **4.1.3.1** The system will shall allow updates to a courses degree
  - **4.1.3.3** The system will shall allow modules to be added to courses

### FR 4.2 Module management for university admins
- **R4.2.1** The system shall provide tools to create modules for universities using the API system or PDF system
- **R4.2.2** The system shall provide tools to delete modules from universities
- **R4.2.3** The system shall provide tools to modify modules for universities
  - **4.2.3.1** The system will shall allow updates to a module name
  - **4.2.3.1** The system will shall allow updates to a module Code
  - **4.2.3.3** The system will shall allow events to be added to modules

### FR 4.3 Event management for university admins
- **R4.3.1** The system shall provide tools to create events for universities using the API system or PDF system or directly using the interface
- **R4.3.2** The system shall provide tools to delete events from universities
- **R4.3.3** The system shall provide tools to modify events for universities
  - **4.3.3.1** The system will shall allow updates to a Event name
  - **4.3.3.1** The system will shall allow updates to a Event Code
  - **4.3.3.1** The system will shall allow updates to a Event times
  - **4.3.3.1** The system will shall allow updates to a Event type
  - **4.3.3.1** The system will shall allow updates to a Event date
  - **4.3.3.1** The system will shall allow updates to a Event day of week

### FR 4.4 Role management for admins and role applications
- **R4.4.1** The system shall allow for users to apply for a particular role, defaulted to students
- **R4.4.2** The system shall allow for university admins to approve roles for a univeristy
- **R4.4.3** The system shall allow for university admins to revoke privileges of users