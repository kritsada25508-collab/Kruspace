"""Small attendance UI and JSON API for the KruSpace demo backend."""

import os
import sqlite3
from datetime import date, datetime, timedelta, timezone

from flask import Blueprint, jsonify, redirect, render_template, request, url_for

attendance_bp = Blueprint("attendance", __name__)
DB_PATH = os.path.join(os.path.dirname(__file__), "database.db")

@attendance_bp.after_request
def allow_preview_cors(response):
    # Demo API is unauthenticated and stores fictional sample data only.
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    return response

CLASS_NAMES = ["All classes", "Math 101 · A", "Science · B", "English · C"]
ROSTER = [
    {"student_id": "67010101", "name": "Nicha Wattanakul", "class_name": "Math 101 · A", "color": "coral"},
    {"student_id": "67010102", "name": "Thanapat Chaiyo", "class_name": "Math 101 · A", "color": "blue"},
    {"student_id": "67010103", "name": "Ploy Saelim", "class_name": "Science · B", "color": "lilac"},
    {"student_id": "67010104", "name": "Kawin Rattanakorn", "class_name": "Math 101 · A", "color": "green"},
    {"student_id": "67010105", "name": "Pimlada Jindarat", "class_name": "Science · B", "color": "gold"},
    {"student_id": "67010106", "name": "Arthit Suksawat", "class_name": "Math 101 · A", "color": "mint"},
    {"student_id": "67010107", "name": "Mali Kittipong", "class_name": "English · C", "color": "rose"},
    {"student_id": "67010108", "name": "Teerapat Boonmee", "class_name": "Science · B", "color": "orange"},
    {"student_id": "67010109", "name": "Sirin Chantarangsu", "class_name": "English · C", "color": "blue"},
    {"student_id": "67010110", "name": "Nattaya Pongsiri", "class_name": "Math 101 · A", "color": "purple"},
    {"student_id": "67010111", "name": "Phurin Meesuk", "class_name": "English · C", "color": "coral"},
    {"student_id": "67010112", "name": "Kanya Preecha", "class_name": "Science · B", "color": "green"},
]
STATUS_CODES = {
    "present": "มา",
    "late": "สาย",
    "absent": "ขาด",
    "มา": "มา",
    "สาย": "สาย",
    "ขาด": "ขาด",
}
STATUS_LABELS = {"มา": "Here", "สาย": "Late", "ขาด": "Away"}


def normalize_date(raw_value=None):
    """Accept an ISO date or a Unix timestamp; default to today (UTC)."""
    if raw_value in (None, ""):
        return datetime.now(timezone.utc).date().isoformat()
    value = str(raw_value).strip()
    try:
        return date.fromisoformat(value).isoformat()
    except ValueError:
        try:
            return datetime.fromtimestamp(int(float(value)), tz=timezone.utc).date().isoformat()
        except (ValueError, OverflowError, OSError):
            raise ValueError("Use a YYYY-MM-DD date or a Unix timestamp.")


def date_timestamp(iso_date):
    return int(datetime.strptime(iso_date, "%Y-%m-%d").replace(tzinfo=timezone.utc).timestamp())


def records_for_date(iso_date):
    with sqlite3.connect(DB_PATH) as connection:
        rows = connection.execute(
            "SELECT student_id, status, comment FROM attendance_record WHERE attendance_date = ?",
            (date_timestamp(iso_date),),
        ).fetchall()
    return {student_id: {"status": status, "comment": comment} for student_id, status, comment in rows}


def roster_for_class(class_name):
    return [student for student in ROSTER if class_name == "All classes" or student["class_name"] == class_name]


def save_records(iso_date, entries):
    timestamp = date_timestamp(iso_date)
    with sqlite3.connect(DB_PATH) as connection:
        connection.executemany(
            """INSERT INTO attendance_record (attendance_date, student_id, status, comment)
               VALUES (?, ?, ?, ?)
               ON CONFLICT(attendance_date, student_id)
               DO UPDATE SET status = excluded.status, comment = excluded.comment""",
            [(timestamp, sid, status, comment) for sid, status, comment in entries],
        )


@attendance_bp.route("/attendance", methods=["GET", "POST"])
def attendance_page():
    if request.method == "POST":
        try:
            selected_date = normalize_date(request.form.get("date"))
        except ValueError as error:
            return redirect(url_for("attendance.attendance_page", error=str(error)))

        selected_class = request.form.get("class_name", "All classes")
        if selected_class not in CLASS_NAMES:
            selected_class = "All classes"
        visible_students = roster_for_class(selected_class)
        updates = []
        if request.form.get("action") == "mark_all_present":
            updates = [(student["student_id"], "มา", "") for student in visible_students]
        else:
            valid_ids = {student["student_id"] for student in visible_students}
            for student_id in valid_ids:
                raw_status = request.form.get("status_" + student_id, "")
                status = STATUS_CODES.get(raw_status)
                if status:
                    updates.append((student_id, status, ""))

        if not updates:
            return redirect(url_for("attendance.attendance_page", date=selected_date, class_name=selected_class, error="Choose a status for at least one learner before saving."))
        save_records(selected_date, updates)
        message = f"Saved {len(updates)} attendance mark{'s' if len(updates) != 1 else ''} for {selected_date}."
        return redirect(url_for("attendance.attendance_page", date=selected_date, class_name=selected_class, message=message))

    try:
        selected_date = normalize_date(request.args.get("date"))
    except ValueError as error:
        selected_date = normalize_date()
        notice = str(error)
    else:
        notice = request.args.get("message") or request.args.get("error") or ""
    notice_kind = "error" if request.args.get("error") else "success"

    selected_class = request.args.get("class_name", "All classes")
    if selected_class not in CLASS_NAMES:
        selected_class = "All classes"
    records = records_for_date(selected_date)
    visible_students = []
    for student in roster_for_class(selected_class):
        row = dict(student)
        row["initials"] = "".join(part[0] for part in student["name"].split()[:2]).upper()
        row["status_code"] = records.get(student["student_id"], {}).get("status", "")
        row["status_label"] = STATUS_LABELS.get(row["status_code"], "Not marked")
        visible_students.append(row)

    present = sum(1 for student in visible_students if records.get(student["student_id"], {}).get("status") == "มา")
    late = sum(1 for student in visible_students if records.get(student["student_id"], {}).get("status") == "สาย")
    absent = sum(1 for student in visible_students if records.get(student["student_id"], {}).get("status") == "ขาด")
    total = len(visible_students)
    marked = present + late + absent
    selected_day = date.fromisoformat(selected_date)

    return render_template(
        "attendance.html",
        students=visible_students,
        summary={
            "present": present,
            "late": late,
            "absent": absent,
            "unmarked": total - marked,
            "total": total,
            "percent": round(present / total * 100) if total else 0,
        },
        selected_date=selected_date,
        selected_label=selected_day.strftime("%A, %B %d, %Y").replace(" 0", " "),
        selected_class=selected_class,
        class_names=CLASS_NAMES,
        previous_date=(selected_day - timedelta(days=1)).isoformat(),
        next_date=(selected_day + timedelta(days=1)).isoformat(),
        today=normalize_date(),
        notice=notice,
        notice_kind=notice_kind,
    )


@attendance_bp.route("/api/v0/attendent", methods=["GET", "POST", "OPTIONS"])
@attendance_bp.route("/api/v0/attendant", methods=["GET", "POST", "OPTIONS"])
def attendance_api():
    """GET/POST both the old misspelling and the API-doc spelling."""
    if request.method == "OPTIONS":
        return "", 204
    if request.method == "GET":
        try:
            selected_date = normalize_date(request.args.get("date"))
        except ValueError as error:
            return jsonify({"error": str(error)}), 400
        records = records_for_date(selected_date)
        return jsonify({
            "attendent_info": {"date": date_timestamp(selected_date), "comment": ""},
            "attendents": [
                {"student_id": sid, "status": record["status"], "comment": record["comment"]}
                for sid, record in records.items()
            ],
        })

    payload = request.get_json(silent=True) or {}
    try:
        selected_date = normalize_date(payload.get("date"))
    except ValueError as error:
        return jsonify({"error": str(error)}), 400

    entries = payload.get("attendents")
    if entries is None:
        entries = [payload] if payload.get("student_id") else []
    if not isinstance(entries, list) or not entries:
        return jsonify({"error": "Send one attendance entry or an 'attendents' list."}), 400

    valid_ids = {student["student_id"] for student in ROSTER}
    updates = []
    for entry in entries:
        if not isinstance(entry, dict) or entry.get("student_id") not in valid_ids:
            return jsonify({"error": "Each entry needs a student_id from the sample roster."}), 400
        status = STATUS_CODES.get(str(entry.get("status", "")))
        if not status:
            return jsonify({"error": "Status must be present, late, absent, มา, สาย, or ขาด."}), 400
        updates.append((entry["student_id"], status, str(entry.get("comment", ""))))

    save_records(selected_date, updates)
    return jsonify({"ok": True, "date": date_timestamp(selected_date), "updated": len(updates)})
