"""Runnable Flask entry point for KruSpace's sample attendance backend."""

import os
import sqlite3
from pathlib import Path

from flask import Flask, render_template

from .attendance_ui import DB_PATH, attendance_bp

BACKEND_DIR = Path(__file__).resolve().parent
app = Flask(
    __name__,
    template_folder=str(BACKEND_DIR / "templates"),
    static_folder=str(BACKEND_DIR / "static"),
)
app.register_blueprint(attendance_bp)

with sqlite3.connect(DB_PATH) as connection:
    connection.executescript((BACKEND_DIR / "sql" / "30-attendance.sql").read_text(encoding="utf-8"))


@app.get("/")
def home():
    return render_template("api_home.html")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5000"))
    app.run(host="0.0.0.0", port=port)
