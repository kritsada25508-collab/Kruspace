import { useEffect, useRef, useState } from 'react';
import { AlertCircle, ArrowRight, CheckCircle2, LoaderCircle, RefreshCw, Server } from 'lucide-react';
import type { Student } from './data';
import {
  attendanceStatusFromPython,
  fetchPythonAttendance,
  PYTHON_API_BASE_URL,
  savePythonAttendance,
  type AttendanceStatus,
} from './pythonAttendance';

type Connection = 'checking' | 'connected' | 'offline';

type Props = {
  date: string;
  className: string;
  students: Student[];
  attendance: Record<string, AttendanceStatus>;
  onLoaded: (records: Record<string, AttendanceStatus>) => void;
};

export default function PythonAttendanceBridge({ date, className, students, attendance, onLoaded }: Props) {
  const [connection, setConnection] = useState<Connection>('checking');
  const [message, setMessage] = useState('Checking the Python attendance API…');
  const [busy, setBusy] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const studentIdsKey = students.map((student) => student.id).join('|');
  const onLoadedRef = useRef(onLoaded);
  onLoadedRef.current = onLoaded;

  useEffect(() => {
    let active = true;
    const allowedIds = new Set(studentIdsKey.split('|').filter(Boolean));
    setConnection('checking');
    setMessage('Checking the Python attendance API…');

    fetchPythonAttendance(date)
      .then((records) => {
        if (!active) return;
        const loaded: Record<string, AttendanceStatus> = {};
        records.forEach((record) => {
          const status = attendanceStatusFromPython(record.status);
          if (allowedIds.has(record.student_id) && status) loaded[record.student_id] = status;
        });
        setConnection('connected');
        if (Object.keys(loaded).length > 0) {
          onLoadedRef.current(loaded);
          setMessage(`Loaded ${Object.keys(loaded).length} saved mark${Object.keys(loaded).length === 1 ? '' : 's'} from Python for ${className}.`);
        } else {
          setMessage(`Connected to Flask. No saved marks for ${className} on this date yet.`);
        }
      })
      .catch((error: unknown) => {
        if (!active) return;
        setConnection('offline');
        setMessage(error instanceof Error ? error.message : 'Could not reach the Python API.');
      });

    return () => { active = false; };
  }, [date, className, studentIdsKey, reloadToken]);

  const syncToPython = async () => {
    const records = students.flatMap((student) => {
      const status = attendance[student.id];
      return status ? [{ student_id: student.id, status }] : [];
    });
    if (records.length === 0) {
      setMessage('Choose attendance statuses before syncing.');
      return;
    }
    setBusy(true);
    try {
      const result = await savePythonAttendance(date, records);
      setConnection('connected');
      setMessage(`Python saved ${result.updated} mark${result.updated === 1 ? '' : 's'} for ${className} in SQLite.`);
    } catch (error: unknown) {
      setConnection('offline');
      setMessage(error instanceof Error ? error.message : 'Could not save to Python.');
    } finally {
      setBusy(false);
    }
  };

  const statusText = connection === 'connected' ? 'FLASK CONNECTED' : connection === 'offline' ? 'API OFFLINE' : 'CHECKING API';
  const apiUrl = `${PYTHON_API_BASE_URL}/attendant?date=${encodeURIComponent(date)}`;

  return (
    <section className="python-bridge-card panel" aria-label="Python attendance integration">
      <div className="python-bridge-head">
        <span className="python-bridge-icon"><Server size={18} /></span>
        <div className="python-bridge-title"><span className="eyebrow">PYTHON · LIVE BACKEND</span><h2>Flask + SQLite attendance</h2><p>Read or save this class through the Python API.</p></div>
        <span className={`python-connection ${connection}`}><i />{statusText}</span>
      </div>
      <div className="python-bridge-bottom">
        <div className={`python-message ${connection}`} aria-live="polite">
          {connection === 'connected' ? <CheckCircle2 size={15} /> : connection === 'offline' ? <AlertCircle size={15} /> : <LoaderCircle className="python-spinner" size={15} />}
          <span>{message}</span>
        </div>
        <div className="python-bridge-actions">
          <button type="button" className="python-refresh" onClick={() => setReloadToken((value) => value + 1)} disabled={connection === 'checking' || busy} aria-label="Reload attendance from Python"><RefreshCw size={14} /> Reload</button>
          <button type="button" className="python-sync-button" onClick={syncToPython} disabled={connection !== 'connected' || busy}>
            {busy ? <LoaderCircle className="python-spinner" size={15} /> : <ArrowRight size={15} />}
            {busy ? 'Saving…' : 'Sync current class to Python'}
          </button>
        </div>
      </div>
      <div className="python-bridge-foot"><span>Python source: <code>attendance_ui.py</code> · SQLite table: <code>attendance_record</code></span><a href={apiUrl} target="_blank" rel="noreferrer">View API response <ArrowRight size={12} /></a></div>
    </section>
    
  );
}
