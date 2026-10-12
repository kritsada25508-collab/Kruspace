# KruSpace — Accepted Outcomes

- [x] **Teacher dashboard and workspace navigation:** Provide a teacher-workspace dashboard with at-a-glance summaries, upcoming items, recent activity, and quick navigation across the workspace areas.
- [x] **Student directory:** Provide searchable student records and local profile/detail views.
- [x] **Attendance workspace:** Let the teacher choose a class or date, mark attendance statuses, and review summaries; load any saved attendance marks for the selected date/class from the Python API.
- [x] **Python Flask API and SQLite:** Include a runnable Flask application in `backend/app.py`; expose GET/POST attendance routes, validate the website’s fictional sample student IDs and statuses, persist marks by date/student in SQLite using `backend/sql/30-attendance.sql`, and allow the KruSpace preview to make cross-origin API requests.
- [x] **Assignments and grades:** Let the teacher browse, create, edit, filter, and track sample assignments through local UI interactions; provide score/grading views to enter sample scores, calculate totals or percentages, and review class performance.
- [x] **Calendar and activities:** Provide navigable month or agenda calendar views and locally managed class events, deadlines, and activities; provide activity browsing.
- [x] **Shared files:** Provide sample folders and files, filtering, preview metadata, and simulated upload or organization interactions.
- [x] **Activities and global search:** Provide an activities experience and global search surfacing relevant sample students, assignments, events, and files.
- [x] **Teacher profile and preferences:** Provide editable local form states for the teacher profile and workspace preferences, with clear prototype and unfinished-authentication messaging.
- [x] **Prototype boundary:** Use fictional sample data; Attendance integrates with the Python demo API while other prototype areas use browser-local data. The API has no production authentication, so do not use real student records or imply production-ready sign-in.
