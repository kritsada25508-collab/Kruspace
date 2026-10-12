CREATE TABLE IF NOT EXISTS attendance_record (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    attendance_date INTEGER NOT NULL,
    student_id TEXT NOT NULL,
    status TEXT NOT NULL,
    comment TEXT NOT NULL DEFAULT '',
    UNIQUE(attendance_date, student_id)
);
