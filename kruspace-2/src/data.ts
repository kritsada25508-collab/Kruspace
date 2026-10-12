export type Student = {
  id: string;
  name: string;
  className: string;
  email: string;
  attendance: number;
  average: number;
  status: 'On track' | 'Needs support' | 'Excellent';
  color: string;
};

export type Assignment = {
  id: string;
  title: string;
  className: string;
  due: string;
  submitted: number;
  total: number;
  status: 'Open' | 'Grading' | 'Completed';
  points: number;
  subject: string;
};

export type CalendarEvent = {
  id: string;
  title: string;
  date: string;
  time: string;
  kind: 'Class' | 'Deadline' | 'Activity' | 'Meeting';
  detail: string;
};

export type FileItem = {
  id: string;
  name: string;
  category: string;
  type: string;
  size: string;
  updated: string;
};

export type ActivityItem = {
  id: string;
  title: string;
  detail: string;
  time: string;
  kind: 'assignment' | 'student' | 'event' | 'file' | 'attendance';
};

export const initialStudents: Student[] = [
  { id: '67010101', name: 'Nicha Wattanakul', className: 'Math 101 · A', email: 'nicha.w@example.edu', attendance: 98, average: 92, status: 'Excellent', color: 'coral' },
  { id: '67010102', name: 'Thanapat Chaiyo', className: 'Math 101 · A', email: 'thanapat.c@example.edu', attendance: 91, average: 84, status: 'On track', color: 'blue' },
  { id: '67010103', name: 'Ploy Saelim', className: 'Science · B', email: 'ploy.s@example.edu', attendance: 87, average: 78, status: 'On track', color: 'purple' },
  { id: '67010104', name: 'Kawin Rattanakorn', className: 'Math 101 · A', email: 'kawin.r@example.edu', attendance: 72, average: 64, status: 'Needs support', color: 'green' },
  { id: '67010105', name: 'Pimlada Jindarat', className: 'Science · B', email: 'pimlada.j@example.edu', attendance: 96, average: 89, status: 'Excellent', color: 'yellow' },
  { id: '67010106', name: 'Arthit Suksawat', className: 'Math 101 · A', email: 'arthit.s@example.edu', attendance: 81, average: 73, status: 'On track', color: 'mint' },
  { id: '67010107', name: 'Mali Kittipong', className: 'English · C', email: 'mali.k@example.edu', attendance: 94, average: 95, status: 'Excellent', color: 'rose' },
  { id: '67010108', name: 'Teerapat Boonmee', className: 'Science · B', email: 'teerapat.b@example.edu', attendance: 69, average: 58, status: 'Needs support', color: 'orange' },
  { id: '67010109', name: 'Sirin Chantarangsu', className: 'English · C', email: 'sirin.c@example.edu', attendance: 89, average: 87, status: 'On track', color: 'blue' },
  { id: '67010110', name: 'Nattaya Pongsiri', className: 'Math 101 · A', email: 'nattaya.p@example.edu', attendance: 100, average: 97, status: 'Excellent', color: 'purple' },
  { id: '67010111', name: 'Phurin Meesuk', className: 'English · C', email: 'phurin.m@example.edu', attendance: 77, average: 70, status: 'Needs support', color: 'coral' },
  { id: '67010112', name: 'Kanya Preecha', className: 'Science · B', email: 'kanya.p@example.edu', attendance: 92, average: 83, status: 'On track', color: 'green' },
];

export const initialAssignments: Assignment[] = [
  { id: 'a-101', title: 'Patterns in nature', className: 'Science · B', due: '2026-10-14', submitted: 18, total: 24, status: 'Grading', points: 20, subject: 'Science' },
  { id: 'a-102', title: 'Fractions, reimagined', className: 'Math 101 · A', due: '2026-10-16', submitted: 21, total: 28, status: 'Open', points: 25, subject: 'Mathematics' },
  { id: 'a-103', title: 'The story of a place', className: 'English · C', due: '2026-10-20', submitted: 26, total: 26, status: 'Completed', points: 30, subject: 'English' },
  { id: 'a-104', title: 'Field notes: tiny worlds', className: 'Science · B', due: '2026-10-23', submitted: 8, total: 24, status: 'Open', points: 15, subject: 'Science' },
  { id: 'a-105', title: 'Number sense journal', className: 'Math 101 · A', due: '2026-10-27', submitted: 0, total: 28, status: 'Open', points: 20, subject: 'Mathematics' },
];

export const initialEvents: CalendarEvent[] = [
  { id: 'e-1', title: 'Math 101 · A', date: '2026-10-12', time: '09:00', kind: 'Class', detail: 'Room 204 · Fractions and number sense' },
  { id: 'e-2', title: 'Science lab: leaf patterns', date: '2026-10-12', time: '11:30', kind: 'Class', detail: 'Lab 3 · Bring your field journal' },
  { id: 'e-3', title: 'Patterns in nature due', date: '2026-10-14', time: '23:59', kind: 'Deadline', detail: 'Science · B · 20 points' },
  { id: 'e-4', title: 'Reading circle', date: '2026-10-15', time: '13:00', kind: 'Activity', detail: 'Library · English · C' },
  { id: 'e-5', title: 'Fractions, reimagined due', date: '2026-10-16', time: '23:59', kind: 'Deadline', detail: 'Math 101 · A · 25 points' },
  { id: 'e-6', title: 'Family check-in', date: '2026-10-19', time: '15:30', kind: 'Meeting', detail: 'Student support · Room 104' },
  { id: 'e-7', title: 'Tiny worlds field walk', date: '2026-10-21', time: '10:00', kind: 'Activity', detail: 'East garden · Science · B' },
  { id: 'e-8', title: 'Staff planning', date: '2026-10-26', time: '14:00', kind: 'Meeting', detail: 'Faculty lounge' },
  { id: 'e-9', title: 'Number sense journal due', date: '2026-10-27', time: '23:59', kind: 'Deadline', detail: 'Math 101 · A · 20 points' },
];

export const initialFiles: FileItem[] = [
  { id: 'f-1', name: 'Patterns in nature — brief', category: 'Assignments', type: 'PDF', size: '1.8 MB', updated: 'Today' },
  { id: 'f-2', name: 'Week 7 · fraction cards', category: 'Lesson plans', type: 'Slides', size: '4.2 MB', updated: 'Yesterday' },
  { id: 'f-3', name: 'Field journal template', category: 'Resources', type: 'DOC', size: '680 KB', updated: 'Oct 8' },
  { id: 'f-4', name: 'Reading circle picks', category: 'Resources', type: 'PDF', size: '940 KB', updated: 'Oct 7' },
  { id: 'f-5', name: 'Class 101 · seating map', category: 'Class notes', type: 'Image', size: '2.1 MB', updated: 'Oct 5' },
  { id: 'f-6', name: 'Student progress · term 1', category: 'Class notes', type: 'Sheet', size: '320 KB', updated: 'Oct 2' },
];

export const initialActivities: ActivityItem[] = [
  { id: 'act-1', title: '18 learners submitted', detail: 'Patterns in nature · Science · B', time: '12 min ago', kind: 'assignment' },
  { id: 'act-2', title: 'Attendance marked', detail: 'Math 101 · A · 27 of 28 present', time: '45 min ago', kind: 'attendance' },
  { id: 'act-3', title: 'New learner added', detail: 'Kanya Preecha · Science · B', time: 'Yesterday', kind: 'student' },
  { id: 'act-4', title: 'Reading circle added', detail: 'English · C · Oct 15 at 1:00 PM', time: 'Yesterday', kind: 'event' },
  { id: 'act-5', title: 'A new resource was shared', detail: 'Field journal template · Resources', time: 'Oct 8', kind: 'file' },
];

export const classes = ['All classes', 'Math 101 · A', 'Science · B', 'English · C'];
