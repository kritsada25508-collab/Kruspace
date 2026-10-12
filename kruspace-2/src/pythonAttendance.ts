declare global {
  interface ImportMetaEnv {
    readonly VITE_PYTHON_API_BASE_URL?: string;
  }
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

export type AttendanceStatus = 'present' | 'late' | 'absent';

export type PythonAttendanceRecord = {
  student_id: string;
  status: string;
  comment?: string;
};

type PythonAttendanceResponse = {
  attendent_info: { date: number; comment: string };
  attendents: PythonAttendanceRecord[];
};

type PythonSaveResponse = {
  ok: boolean;
  date: number;
  updated: number;
  error?: string;
};

const DEFAULT_API_BASE = 'https://5000-itwhefoek28gsv38af6b7-8be07a81.sg2.manus.computer/api/v0';
export const PYTHON_API_BASE_URL = (import.meta.env.VITE_PYTHON_API_BASE_URL || DEFAULT_API_BASE).replace(/\/+$/, '');

const FROM_PYTHON: Record<string, AttendanceStatus> = {
  'มา': 'present',
  'สาย': 'late',
  'ขาด': 'absent',
  present: 'present',
  late: 'late',
  absent: 'absent',
};

export function attendanceStatusFromPython(value: string): AttendanceStatus | undefined {
  return FROM_PYTHON[value];
}

export async function fetchPythonAttendance(date: string): Promise<PythonAttendanceRecord[]> {
  const url = `${PYTHON_API_BASE_URL}/attendant?date=${encodeURIComponent(date)}`;
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Attendance API returned HTTP ${response.status}`);
  const result = (await response.json()) as PythonAttendanceResponse;
  return Array.isArray(result.attendents) ? result.attendents : [];
}

export async function savePythonAttendance(
  date: string,
  records: Array<{ student_id: string; status: AttendanceStatus }>,
): Promise<PythonSaveResponse> {
  const response = await fetch(`${PYTHON_API_BASE_URL}/attendant`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      date,
      attendents: records.map((record) => ({ student_id: record.student_id, status: record.status, comment: '' })),
    }),
  });
  const result = (await response.json()) as PythonSaveResponse;
  if (!response.ok || !result.ok) throw new Error(result.error || `Attendance API returned HTTP ${response.status}`);
  return result;
}
