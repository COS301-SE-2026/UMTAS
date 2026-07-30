# User Stories

!!! abstract "Section Brief"
    The User stories are grouped by System, corresponding to the Use Cases systems.
---

??? info "**Landing Page**"

    | **ID** | **User Story** | **Use Case** |
    |---|---|---|
    | US-1 | As a visitor, I want to view the landing page so that I can learn about the system before creating an account. | UC-LP-01 |
    | US-2 | As a visitor, I want to view adapter capabilities so that I can see which universities and timetable sources are supported. | UC-LP-02 |
    | US-3 | As a visitor, I want to view role capabilities so that I understand what actions each role (student, admin, etc.) can perform. | UC-LP-03 |

---
??? info "**Authentication**"

    | **ID** | **User Story** | **Use Case** |
    |---|---|---|
    | US-4 | As a user, I want to register an account so that I can access the system. | UC-AU-01 |
    | US-5 | As a user, I want to log in to my account so that I can access my personal workspace. | UC-AU-02 |
    | US-6 | As a user, I want to reset my password so that I can regain access if I forget it. | UC-AU-03 |
    | US-7 | As a user, I want to log out of my account so that my session ends securely on shared devices. | UC-AU-04 |
    | US-8 | As a user, I want to delete my account so that my data is removed when I no longer need the system. | UC-AU-05 |
    | US-9 | As a user, I want to verify my email address so that my account is confirmed as genuine. | UC-AU-06 |
    | US-10 | As a user, I want to sign in with an external OAuth provider so that I can register or log in without creating a new password. | UC-AU-07 |

---
??? info "**University Role Management**"

    | **ID** | **User Story** | **Use Case** |
    |---|---|---|
    | US-11 | As a user, I want to apply for a role at a university so that I can access that university's academic data. | UC-UNI-01 |
    | US-12 | As a university administrator, I want to manage role applications so that I can approve or reject users requesting access. | UC-UNI-02 |
    | US-13 | As a user, I want my access to be governed by role-based authorisation so that I can only perform actions permitted by my assigned role. | UC-UNI-03 |

---
??? info "**Course Management**"

    | **ID** | **User Story** | **Use Case** |
    |---|---|---|
    | US-14 | As a university administrator, I want to create a course so that it can be referenced by modules and events. | UC-CM-01 |
    | US-15 | As a university administrator, I want to delete a course so that outdated course records are removed. | UC-CM-02 |
    | US-16 | As a university administrator, I want to modify a course so that its details stay accurate. | UC-CM-03 |

---
??? info "**Module Management**"

    | **ID** | **User Story** | **Use Case** |
    |---|---|---|
    | US-17 | As a university administrator, I want to create a module so that it is available for students to add to their timetables. | UC-MM-01 |
    | US-18 | As a university administrator, I want to delete a module so that it no longer appears as an available academic record. | UC-MM-02 |
    | US-19 | As a university administrator, I want to modify a module so that its details stay accurate. | UC-MM-03 |

---
??? info "**Event Management**"

    | **ID** | **User Story** | **Use Case** |
    |---|---|---|
    | US-20 | As a university administrator, I want to create an event so that it can be scheduled as part of a module or course. | UC-EM-01 |
    | US-21 | As a university administrator, I want to delete an event so that cancelled or incorrect events are removed. | UC-EM-02 |
    | US-22 | As a university administrator, I want to modify an event so that its details stay accurate. | UC-EM-03 |

---
??? info "**Timetable Builder**"

    | **ID** | **User Story** | **Use Case** |
    |---|---|---|
    | US-23 | As a user, I want to create modules so that I can represent academic or personal commitments not already in the system. | UC-TC-01 |
    | US-24 | As a user, I want to create events so that my timetable reflects specific dated commitments. | UC-TC-02 |
    | US-25 | As a user, I want to create a timetable so that I can group modules and events into a single schedule. | UC-TC-03 |

---
??? info "**Timetable Management**"

    | **ID** | **User Story** | **Use Case** |
    |---|---|---|
    | US-26 | As a user, I want to view my timetable so that I can see my upcoming schedule at a glance. | UC-TM-01 |
    | US-27 | As a user, I want to edit my timetable so that I can keep it up to date. | UC-TM-02 |
    | US-28 | As a user, I want to delete a timetable so that I can remove schedules I no longer need. | UC-TM-03 |
    | US-29 | As a user, I want to customise my timetable so that it reflects my personal preferences and display needs. | UC-TM-04 |

---
??? info "**PDF Import**"

    | **ID** | **User Story** | **Use Case** |
    |---|---|---|
    | US-30 | As a user, I want to import a supported timetable PDF so that I do not have to manually re-enter my academic events. | UC-PDF-01 |
    | US-31 | As a user, I want to review imported timetable data so that I can correct any parsing errors before it is saved. | UC-PDF-02 |
    | US-32 | As a university administrator, I want to verify imported data so that unverified parser output becomes trusted academic data. | UC-PDF-02 |

---
??? info "**API Import**"

    | **ID** | **User Story** | **Use Case** |
    |---|---|---|
    | US-33 | As a user, I want to import my timetable from a university API so that my academic schedule stays synchronised automatically. | UC-API-01 |
    | US-34 | As a user, I want to review API-retrieved timetable data so that I can confirm it is correct before it is saved. | UC-API-02 |

---
??? info "**Calendar Export**"

    | **ID** | **User Story** | **Use Case** |
    |---|---|---|
    | US-35 | As a student, I want to export my timetable as an ICS file so that I can use it in other calendar applications. | UC-EX-01 |
    | US-36 | As a student, I want to sync my timetable with Google Calendar so that changes are reflected automatically without re-exporting. | UC-EX-02 |

---
??? info "**Solver System**"

    | **ID** | **User Story** | **Use Case** |
    |---|---|---|
    | US-37 | As a student, I want the system to solve my timetable using CP-SAT so that I receive a conflict-free schedule where one exists. | UC-SV-01 |
    | US-38 | As a student, I want the system to solve my timetable using a genetic algorithm so that I receive a clearly labelled best-effort schedule when no perfect solution is feasible. | UC-SV-02 |

---
??? info "**Analytics Dashboard**"

    | **ID** | **User Story** | **Use Case** |
    |---|---|---|
    | US-39 | As an admin or lecturer, I want to view an attendance analytics dashboard so that I can monitor engagement trends across events. | UC-AN-01 |
    | US-40 | As an admin or lecturer, I want to explore venue and booking analytics so that I can understand space utilisation. | UC-AN-02 |
    | US-41 | As an admin or lecturer, I want to view lecturer analytics so that I can assess lecturer workload and scheduling patterns. | UC-AN-03 |

---
??? info "**Attendance Recording**"

    | **ID** | **User Story** | **Use Case** |
    |---|---|---|
    | US-42 | As a student, I want to indicate my attendance intent for an event so that my participation is tracked by date. | UC-AR-01 |
    | US-43 | As a student, I want to unrecord my attendance for an event so that I can correct a mistaken entry. | UC-AR-02 |

---
??? info "**Lecturer Adjustment**"

    | **ID** | **User Story** | **Use Case** |
    |---|---|---|
    | US-44 | As a lecturer or admin, I want to manage event details so that scheduling stays accurate from the teaching side. | UC-LA-01 |
    | US-45 | As a lecturer or admin, I want to manage module details so that module information stays accurate from the teaching side. | UC-LA-01 |
    | US-46 | As a lecturer or admin, I want to assign lecturers to events and modules so that responsibility for teaching is clearly recorded. | UC-LA-02 |

---
??? info "**Alert System**"

    | **ID** | **User Story** | **Use Case** |
    |---|---|---|
    | US-47 | As a user, I want to receive an alert when an event changes so that I am aware of schedule changes affecting me. | UC-AL-01 |

---
??? info "**Tyto Simulation System**"

    | **ID** | **User Story** | **Use Case** |
    |---|---|---|
    | US-48 | As a Tyto administrator, I want to run a simulation batch so that I can test system behaviour under representative load. | UC-TY-01 |
    | US-49 | As a Tyto administrator, I want to view simulation analytics so that I can interpret the results of a simulation run. | UC-TY-02 |
    | US-50 | As a Tyto administrator, I want to display stress-test results so that I can assess system performance under peak conditions. | UC-TY-03 |