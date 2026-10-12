import React, { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import {
  Activity, AlertCircle, ArrowDownRight, ArrowRight, ArrowUpRight, Bell, BookMarked,
  BookOpen, CalendarDays, CalendarPlus, ChartColumnIncreasing, Check, CheckCircle2,
  ChevronDown, ChevronLeft, ChevronRight, ClipboardCheck, Clock3, Download, ExternalLink,
  FileImage, FileSpreadsheet, FileText, Filter, FolderOpen, GraduationCap, Home,
  LayoutDashboard, ListFilter, Mail, Menu, MoreHorizontal, NotebookPen, Pencil, Plus,
  Search, Settings, Sparkles, Upload, UserRound, UsersRound, X,
} from 'lucide-react';
import {
  classes, initialActivities, initialAssignments, initialEvents, initialFiles, initialStudents,
  type ActivityItem, type Assignment, type CalendarEvent, type FileItem, type Student,
} from './data';
import WorkspacePreferences from './WorkspacePreferences';
import PythonAttendanceBridge from './PythonAttendanceBridge';

type Page = 'overview' | 'students' | 'attendance' | 'assignments' | 'grades' | 'calendar' | 'files' | 'activities' | 'settings';
type AttendanceStatus = 'present' | 'late' | 'absent';
type ModalState = { kind: 'student' | 'assignment' | 'event' | 'activity' | 'file'; item?: Student | Assignment | CalendarEvent | ActivityItem | FileItem } | null;
type SavedProfile = { name: string; role: string; email: string; school: string };

const PAGE_INFO: Record<Page, { title: string; eyebrow: string; icon: typeof Home }> = {
  overview: { title: 'Your space', eyebrow: 'Overview', icon: Home },
  students: { title: 'Your learners', eyebrow: 'Classroom', icon: UsersRound },
  attendance: { title: 'Show up, shine on', eyebrow: 'Classroom', icon: ClipboardCheck },
  assignments: { title: 'Little steps, big ideas', eyebrow: 'Classroom', icon: NotebookPen },
  grades: { title: 'A fuller picture', eyebrow: 'Classroom', icon: ChartColumnIncreasing },
  calendar: { title: 'Make room for what matters', eyebrow: 'Plan ahead', icon: CalendarDays },
  files: { title: 'Your teaching shelf', eyebrow: 'Resources', icon: FolderOpen },
  activities: { title: 'The little things add up', eyebrow: 'Your space', icon: Activity },
  settings: { title: 'Made for the way you teach', eyebrow: 'Your space', icon: Settings },
};

const sampleAttendance: Record<string, AttendanceStatus> = Object.fromEntries(
  initialStudents.map((student, index) => [student.id, index === 3 ? 'late' : index === 7 ? 'absent' : 'present']),
);
const defaultProfile: SavedProfile = {
  name: 'Kru Nicha', role: 'Classroom teacher', email: 'nicha.teacher@example.edu', school: 'Little Oak Learning School',
};
const TODAY = '2026-10-12';

function readSaved<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(`kruspace-${key}`);
    return saved ? (JSON.parse(saved) as T) : fallback;
  } catch {
    return fallback;
  }
}
function dateLabel(date: string, options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }) {
  return new Intl.DateTimeFormat('en', { ...options, timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`));
}
function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}
function titleFor(page: Page) { return PAGE_INFO[page].title; }

function Avatar({ name, color = 'mint', size = 'md' }: { name: string; color?: string; size?: 'sm' | 'md' | 'lg' }) {
  return <span className={`avatar avatar-${color} avatar-${size}`} aria-label={name}>{initials(name)}</span>;
}
function StatusTag({ children, tone = 'neutral' }: { children: ReactNode; tone?: string }) {
  return <span className={`status-tag tone-${tone}`}>{children}</span>;
}
function ProgressBar({ value, tone = 'green' }: { value: number; tone?: string }) {
  return <div className={`progress-track progress-${tone}`}><span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>;
}
function PageHeading({ eyebrow, title, subtitle, action }: { eyebrow: string; title: string; subtitle: string; action?: ReactNode }) {
  return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{subtitle}</p></div>{action && <div className="heading-action">{action}</div>}</div>;
}
function SectionTitle({ title, detail, action }: { title: string; detail?: string; action?: ReactNode }) {
  return <div className="section-title"><div><h2>{title}</h2>{detail && <span>{detail}</span>}</div>{action}</div>;
}
function SmallIcon({ kind }: { kind: ActivityItem['kind'] }) {
  const Icon = kind === 'assignment' ? NotebookPen : kind === 'student' ? UsersRound : kind === 'event' ? CalendarDays : kind === 'file' ? FileText : ClipboardCheck;
  return <span className={`activity-icon activity-${kind}`}><Icon size={16} /></span>;
}
function EmptyState({ icon: Icon = Search, title, message }: { icon?: typeof Search; title: string; message: string }) {
  return <div className="empty-state"><span className="empty-icon"><Icon size={21} /></span><strong>{title}</strong><p>{message}</p></div>;
}

export default function App() {
  const [page, setPage] = useState<Page>('overview');
  const [students, setStudents] = useState<Student[]>(() => readSaved('students', initialStudents));
  const [assignments, setAssignments] = useState<Assignment[]>(() => readSaved('assignments', initialAssignments));
  const [events, setEvents] = useState<CalendarEvent[]>(() => readSaved('events', initialEvents));
  const [files, setFiles] = useState<FileItem[]>(() => readSaved('files', initialFiles));
  const [activities, setActivities] = useState<ActivityItem[]>(() => readSaved('activities', initialActivities));
  const [attendanceByDate, setAttendanceByDate] = useState<Record<string, Record<string, AttendanceStatus>>>(() => readSaved('attendance', { [TODAY]: sampleAttendance }));
  const [grades, setGrades] = useState<Record<string, Record<string, number>>>(() => readSaved('grades', {}));
  const [profile, setProfile] = useState<SavedProfile>(() => readSaved('profile', defaultProfile));
  const [preferences, setPreferences] = useState(() => readSaved('preferences', { warmTheme: false, weeklyDigest: true, dueReminders: true, attendanceNudge: true }));
  const [settingsSection, setSettingsSection] = useState<'profile' | 'appearance' | 'notifications'>('profile');
  const [modal, setModal] = useState<ModalState>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentClass, setStudentClass] = useState('All classes');
  const [assignmentFilter, setAssignmentFilter] = useState('All');
  const [attendanceClass, setAttendanceClass] = useState('Math 101 · A');
  const [attendanceDate, setAttendanceDate] = useState(TODAY);
  const [attendanceSaved, setAttendanceSaved] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date(2026, 9, 1));
  const [selectedDate, setSelectedDate] = useState(TODAY);
  const [fileFilter, setFileFilter] = useState('All files');
  const [fileSearch, setFileSearch] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => { localStorage.setItem('kruspace-students', JSON.stringify(students)); }, [students]);
  useEffect(() => { localStorage.setItem('kruspace-assignments', JSON.stringify(assignments)); }, [assignments]);
  useEffect(() => { localStorage.setItem('kruspace-events', JSON.stringify(events)); }, [events]);
  useEffect(() => { localStorage.setItem('kruspace-files', JSON.stringify(files)); }, [files]);
  useEffect(() => { localStorage.setItem('kruspace-activities', JSON.stringify(activities)); }, [activities]);
  useEffect(() => { localStorage.setItem('kruspace-attendance', JSON.stringify(attendanceByDate)); }, [attendanceByDate]);
  useEffect(() => { localStorage.setItem('kruspace-grades', JSON.stringify(grades)); }, [grades]);
  useEffect(() => { localStorage.setItem('kruspace-profile', JSON.stringify(profile)); }, [profile]);
  useEffect(() => { localStorage.setItem('kruspace-preferences', JSON.stringify(preferences)); }, [preferences]);
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setSearchOpen(true); }
      if (event.key === 'Escape') { setSearchOpen(false); setModal(null); setNoticeOpen(false); }
    };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const pushActivity = (title: string, detail: string, kind: ActivityItem['kind']) => {
    setActivities((current) => [{ id: `act-${Date.now()}`, title, detail, time: 'Just now', kind }, ...current]);
  };
  const navigate = (next: Page) => { setPage(next); setMobileNavOpen(false); setNoticeOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const setAttendance = (studentId: string, status: AttendanceStatus) => {
    setAttendanceByDate((current) => ({ ...current, [attendanceDate]: { ...(current[attendanceDate] ?? sampleAttendance), [studentId]: status } }));
    setAttendanceSaved(false);
  };

  const filteredStudents = useMemo(() => students.filter((student) => {
    const matchText = `${student.name} ${student.id} ${student.className}`.toLowerCase().includes(studentSearch.toLowerCase());
    return matchText && (studentClass === 'All classes' || student.className === studentClass);
  }), [students, studentSearch, studentClass]);
  const filteredAssignments = useMemo(() => assignments.filter((item) => assignmentFilter === 'All' || item.status === assignmentFilter), [assignments, assignmentFilter]);
  const currentAttendance = attendanceByDate[attendanceDate] ?? sampleAttendance;
  const selectedEvents = events.filter((item) => item.date === selectedDate).sort((a, b) => a.time.localeCompare(b.time));
  const fileCategories = ['All files', ...Array.from(new Set(files.map((item) => item.category)))];
  const visibleFiles = files.filter((item) => (fileFilter === 'All files' || item.category === fileFilter) && `${item.name} ${item.category} ${item.type}`.toLowerCase().includes(fileSearch.toLowerCase()));

  const searchResults = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return [];
    return [
      ...students.filter((item) => `${item.name} ${item.id} ${item.className}`.toLowerCase().includes(term)).slice(0, 4).map((item) => ({ title: item.name, detail: `${item.id} · ${item.className}`, kind: 'Student', page: 'students' as Page, item })),
      ...assignments.filter((item) => `${item.title} ${item.className}`.toLowerCase().includes(term)).slice(0, 4).map((item) => ({ title: item.title, detail: `${item.className} · due ${dateLabel(item.due)}`, kind: 'Assignment', page: 'assignments' as Page, item })),
      ...events.filter((item) => `${item.title} ${item.detail}`.toLowerCase().includes(term)).slice(0, 4).map((item) => ({ title: item.title, detail: `${dateLabel(item.date)} · ${item.detail}`, kind: 'Event', page: 'calendar' as Page, item })),
      ...files.filter((item) => `${item.name} ${item.category}`.toLowerCase().includes(term)).slice(0, 4).map((item) => ({ title: item.name, detail: `${item.category} · ${item.type}`, kind: 'File', page: 'files' as Page, item })),
    ].slice(0, 10);
  }, [query, students, assignments, events, files]);

  const openPageModal = (kind: NonNullable<ModalState>['kind']) => setModal({ kind });
  const saveAssignment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const editing = modal?.item as Assignment | undefined;
    const next: Assignment = {
      id: editing?.id ?? `a-${Date.now()}`,
      title: String(form.get('title') || 'New classwork'),
      className: String(form.get('className') || classes[1]),
      due: String(form.get('due') || TODAY),
      submitted: editing?.submitted ?? 0,
      total: Number(form.get('total') || 28),
      status: (String(form.get('status') || 'Open') as Assignment['status']),
      points: Number(form.get('points') || 20),
      subject: String(form.get('subject') || 'Classwork'),
    };
    setAssignments((current) => editing ? current.map((row) => row.id === editing.id ? next : row) : [next, ...current]);
    pushActivity(editing ? 'Assignment updated' : 'New assignment created', `${next.title} · ${next.className}`, 'assignment');
    setModal(null); setToast(editing ? 'Assignment updated' : 'A new assignment is ready');
  };
  const saveEvent = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const editing = modal?.item as CalendarEvent | undefined;
    const next: CalendarEvent = {
      id: editing?.id ?? `e-${Date.now()}`,
      title: String(form.get('title') || 'Class event'),
      date: String(form.get('date') || selectedDate),
      time: String(form.get('time') || '10:00'),
      kind: String(form.get('kind') || 'Activity') as CalendarEvent['kind'],
      detail: String(form.get('detail') || 'A little something for the class'),
    };
    setEvents((current) => editing ? current.map((row) => row.id === editing.id ? next : row) : [...current, next]);
    pushActivity(editing ? 'Event updated' : 'Something added to the calendar', `${next.title} · ${dateLabel(next.date)}`, 'event');
    setSelectedDate(next.date); setModal(null); setToast(editing ? 'Calendar event updated' : 'Added to your calendar');
  };
  const saveStudent = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const editing = modal?.item as Student | undefined;
    const next: Student = {
      id: String(form.get('id') || `67010${String(Date.now()).slice(-3)}`),
      name: String(form.get('name') || 'New learner'),
      className: String(form.get('className') || classes[1]),
      email: String(form.get('email') || 'learner@example.edu'),
      attendance: editing?.attendance ?? 100,
      average: editing?.average ?? 0,
      status: editing?.status ?? 'On track',
      color: editing?.color ?? 'mint',
    };
    setStudents((current) => editing ? current.map((row) => row.id === editing.id ? next : row) : [next, ...current]);
    pushActivity(editing ? 'Learner details updated' : 'A new learner joined the class', `${next.name} · ${next.className}`, 'student');
    setModal(null); setToast(editing ? 'Learner details saved' : 'Learner added to your class');
  };
  const saveProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setProfile({ name: String(form.get('name') || profile.name), role: String(form.get('role') || profile.role), email: String(form.get('email') || profile.email), school: String(form.get('school') || profile.school) });
    setToast('Your details are saved on this device');
  };
  const addUploadedFile = (file?: File) => {
    if (!file) return;
    const size = file.size >= 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(file.size / 1024))} KB`;
    const type = file.name.split('.').pop()?.toUpperCase() || 'FILE';
    const next: FileItem = { id: `f-${Date.now()}`, name: file.name, category: 'Resources', type, size, updated: 'Just now' };
    setFiles((current) => [next, ...current]);
    pushActivity('A file was added to your shelf', file.name, 'file');
    setToast('File added to your local sample shelf');
  };

  const navGroups = [
    { label: 'Your classroom', items: [
      { id: 'overview' as Page, label: 'Overview', icon: LayoutDashboard },
      { id: 'students' as Page, label: 'Students', icon: UsersRound, count: students.length },
      { id: 'attendance' as Page, label: 'Attendance', icon: ClipboardCheck },
      { id: 'assignments' as Page, label: 'Assignments', icon: NotebookPen, count: assignments.filter((item) => item.status !== 'Completed').length },
      { id: 'grades' as Page, label: 'Grades', icon: ChartColumnIncreasing },
    ] },
    { label: 'Beyond the classroom', items: [
      { id: 'calendar' as Page, label: 'Calendar', icon: CalendarDays },
      { id: 'files' as Page, label: 'Shared files', icon: FolderOpen },
      { id: 'activities' as Page, label: 'Activity', icon: Activity },
    ] },
  ];

  return (
   <div className={`app-shell ${preferences.warmTheme ? 'theme-warm' : ''}`}>
    <aside className={`sidebar ${mobileNavOpen ? 'sidebar-open' : ''}`}>
      <div className="brand-row"><div className="brand-symbol"><span /><span /><span /></div><div className="brand-name">kru<span>space</span><small>TEACHER WORKSPACE</small></div><button className="icon-button mobile-close" aria-label="Close menu" onClick={() => setMobileNavOpen(false)}><X size={18} /></button></div>
      <div className="workspace-pill"><div className="school-mark"><BookOpen size={16} /></div><div><strong>{profile.school}</strong><span>Teacher workspace</span></div><ChevronDown size={15} /></div>
      <button className="sidebar-search" onClick={() => setSearchOpen(true)}><Search size={16} /><span>Search anything</span><kbd>⌘ K</kbd></button>
      <nav className="side-nav" aria-label="Main navigation">
        {navGroups.map((group) => <div className="nav-group" key={group.label}><div className="nav-label">{group.label}</div>{group.items.map(({ id, label, icon: Icon, count }) => <button key={id} className={`nav-item ${page === id ? 'nav-active' : ''}`} onClick={() => navigate(id)}><Icon size={18} strokeWidth={1.85} /><span>{label}</span>{count !== undefined && <small>{count}</small>}</button>)}</div>)}
      </nav>
      <div className="sidebar-bottom"><div className="side-tip"><Sparkles size={16} /><div><strong>A small thought</strong><p>Progress looks different for every learner. Keep noticing.</p></div></div><button className={`nav-item ${page === 'settings' ? 'nav-active' : ''}`} onClick={() => navigate('settings')}><Settings size={18} /><span>Preferences</span></button><button className="teacher-mini" onClick={() => navigate('settings')}><Avatar name={profile.name} color="coral" /><span><strong>{profile.name}</strong><small>{profile.role}</small></span><MoreHorizontal size={18} /></button></div>
    </aside>
    {mobileNavOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} />}

    <main className="main-area">
      <header className="topbar"><div className="topbar-left"><button className="icon-button mobile-menu" aria-label="Open menu" onClick={() => setMobileNavOpen(true)}><Menu size={20} /></button><div className="breadcrumb"><span>{PAGE_INFO[page].eyebrow}</span><ChevronRight size={14} /><strong>{page === 'overview' ? 'Home' : titleFor(page)}</strong></div></div><div className="topbar-actions"><span className="prototype-badge"><i />Prototype · sample data</span><button className="top-search" onClick={() => setSearchOpen(true)}><Search size={16} /><span>Search your space...</span><kbd>⌘ K</kbd></button><div className="notice-wrap"><button className={`icon-button notification-button ${noticeOpen ? 'icon-selected' : ''}`} aria-label="Notifications" onClick={() => setNoticeOpen((open: any) => !open)}><Bell size={19} /><i /></button>{noticeOpen && <div className="notification-popover"><div className="popover-head"><strong>A few things to know</strong><button className="text-button" onClick={() => setNoticeOpen(false)}>Done</button></div><button onClick={() => { navigate('assignments'); setNoticeOpen(false); }}><span className="notification-dot dot-peach" /><span><strong>6 submissions to review</strong><small>Patterns in nature · Science · B</small></span><ChevronRight size={15} /></button><button onClick={() => { navigate('calendar'); setNoticeOpen(false); }}><span className="notification-dot dot-blue" /><span><strong>Two things coming up</strong><small>Your next few days at a glance</small></span><ChevronRight size={15} /></button></div>}</div><button className="top-avatar" aria-label="Open teacher preferences" onClick={() => navigate('settings')}><Avatar name={profile.name} color="coral" size="sm" /></button></div></header>

      <div className="content-area">
        {page === 'overview' && <>
          <div className="welcome-strip"><div className="welcome-copy"><div className="welcome-kicker"><Sparkles size={15} /> MONDAY, 12 OCTOBER 2026</div><h1>A good week starts<br /><em>with a little breathing room.</em></h1><p>Here’s what’s taking shape in your classroom.</p><button className="button button-dark" onClick={() => navigate('calendar')}>Look at my week <ArrowRight size={16} /></button></div><div className="welcome-art"><div className="art-sun" /><div className="art-book book-one" /><div className="art-book book-two" /><div className="art-plant"><span /><span /><span /><i /></div><div className="art-note">small steps<br />count, too</div><div className="art-stamp">✳</div></div><div className="welcome-side-note"><span>WEEK 07</span><strong>Little by little,<br />a lot gets done.</strong><i>— Aesop</i></div></div>
          <div className="stats-row"><button className="stat-card" onClick={() => navigate('students')}><span className="stat-icon icon-green"><UsersRound size={18} /></span><span className="stat-label">Learners in your care</span><strong>{students.length + 116}</strong><span className="stat-foot"><i className="mini-positive"><ArrowUpRight size={12} /></i> across 4 lovely classes</span></button><button className="stat-card" onClick={() => navigate('assignments')}><span className="stat-icon icon-peach"><NotebookPen size={18} /></span><span className="stat-label">Ready for your eyes</span><strong>{assignments.filter((a) => a.status === 'Grading').reduce((sum, a) => sum + Math.max(0, a.submitted - 12), 0) + 6}</strong><span className="stat-foot">submissions to review</span></button><button className="stat-card" onClick={() => navigate('calendar')}><span className="stat-icon icon-blue"><CalendarDays size={18} /></span><span className="stat-label">Happening this week</span><strong>{events.filter((e) => e.date >= TODAY && e.date <= '2026-10-18').length + 2}</strong><span className="stat-foot">a few good things ahead</span></button><button className="stat-card stat-average" onClick={() => navigate('grades')}><span className="stat-icon icon-lilac"><ChartColumnIncreasing size={18} /></span><span className="stat-label">Classroom pulse</span><strong>82<span className="stat-suffix">%</span></strong><span className="stat-foot"><span className="sparkline"><i /><i /><i /><i /><i /><i /><i /></span> looking steady</span></button></div>
          <div className="dashboard-grid"><section className="panel-week"><SectionTitle title="A peek at your week" detail="12–18 October" action={<button className="arrow-link" onClick={() => navigate('calendar')}>Full calendar <ArrowRight size={15} /></button>} /><div className="week-list">{events.filter((event) => event.date >= TODAY && event.date <= '2026-10-18').slice(0, 4).map((event) => <button className="week-row" key={event.id} onClick={() => { setSelectedDate(event.date); navigate('calendar'); }}><div className="week-date"><strong>{dateLabel(event.date, { day: '2-digit' })}</strong><span>{dateLabel(event.date, { weekday: 'short' })}</span></div><span className={`week-mark mark-${event.kind.toLowerCase()}`} /><div className="week-copy"><strong>{event.title}</strong><span>{event.kind} · {event.detail}</span></div><time>{event.time === '23:59' ? 'Due tonight' : event.time}</time></button>)}</div><button className="week-add" onClick={() => openPageModal('event')}><span><Plus size={15} /></span>Add a little something to your week</button></section>
          <section className="panel-tasks"><SectionTitle title="On your plate" detail="Your next gentle nudge" action={<button className="dots-button" aria-label="More assignments" onClick={() => navigate('assignments')}><MoreHorizontal size={19} /></button>} /><div className="task-highlight"><span className="task-overline">A GOOD PLACE TO START</span><strong>Patterns in<br />nature</strong><span className="task-class">Science · B <i /> Due 14 Oct</span><div className="task-progress"><ProgressBar value={75} tone="peach" /><span>18 of 24 handed in</span></div><button className="button button-white" onClick={() => navigate('assignments')}>Take a look <ArrowRight size={15} /></button><div className="task-spark">✳</div></div><button className="task-secondary" onClick={() => navigate('attendance')}><span className="secondary-icon"><ClipboardCheck size={17} /></span><span><strong>Attendance, all caught up?</strong><small>Two classes still need a check-in</small></span><ArrowRight size={15} /></button></section>
          </div>
          <section className="recent-panel"><SectionTitle title="Little things, lately" detail="A few moments from your classroom" action={<button className="arrow-link" onClick={() => navigate('activities')}>See everything <ArrowRight size={15} /></button>} /><div className="activity-list">{activities.slice(0, 3).map((item) => <div className="activity-row" key={item.id}><SmallIcon kind={item.kind} /><span><strong>{item.title}</strong><small>{item.detail}</small></span><time>{item.time}</time></div>)}</div></section>
        </>}

        {page === 'students' && <>
          <PageHeading eyebrow="CLASSROOM · YOUR LEARNERS" title="Every learner has a story." subtitle="A gentle overview of the people in your classroom." action={<button className="button button-primary" onClick={() => openPageModal('student')}><Plus size={16} /> Add learner</button>} />
          <div className="student-summary"><div><span className="stat-label">Your classroom</span><strong>{students.length + 116} <small>learners</small></strong></div><div><span className="summary-dot summary-good" /><span>Doing beautifully</span><b>42</b></div><div><span className="summary-dot summary-steady" /><span>Finding their pace</span><b>68</b></div><div><span className="summary-dot summary-care" /><span>Could use a check-in</span><b>18</b></div><div className="summary-note"><Sparkles size={14} /> Little progress is still progress.</div></div>
          <section className="panel table-panel"><div className="table-tools"><div className="search-field"><Search size={16} /><input value={studentSearch} onChange={(event) => setStudentSearch(event.target.value)} placeholder="Find a learner by name or ID" /><kbd>⌘ F</kbd></div><div className="select-wrap"><Filter size={15} /><select value={studentClass} onChange={(event) => setStudentClass(event.target.value)}>{classes.map((option) => <option key={option}>{option}</option>)}</select><ChevronDown size={15} /></div><span className="showing-count">Showing {filteredStudents.length} of {students.length} learners</span></div><div className="table-scroll"><table><thead><tr><th>LEARNER</th><th>CLASS</th><th>ATTENDANCE</th><th>AVERAGE</th><th>CLASSROOM PULSE</th><th /></tr></thead><tbody>{filteredStudents.map((student) => <tr key={student.id} onClick={() => setModal({ kind: 'student', item: student })}><td><div className="student-cell"><Avatar name={student.name} color={student.color} /><span><strong>{student.name}</strong><small>ID {student.id}</small></span></div></td><td>{student.className}</td><td><div className="grade-cell"><span>{student.attendance}%</span><ProgressBar value={student.attendance} tone="blue" /></div></td><td><strong className="table-score">{student.average}%</strong></td><td><StatusTag tone={student.status === 'Excellent' ? 'green' : student.status === 'Needs support' ? 'peach' : 'blue'}>{student.status}</StatusTag></td><td><button className="row-more" aria-label={`View ${student.name}`} onClick={(event) => { event.stopPropagation(); setModal({ kind: 'student', item: student }); }}><ArrowRight size={16} /></button></td></tr>)}</tbody></table>{filteredStudents.length === 0 && <EmptyState title="No learners found" message="Try another name or clear your class filter." />}</div></section>
          <div className="prototype-footnote"><AlertCircle size={15} /> These are fictional sample records. Any changes stay in this browser.</div>
        </>}

        {page === 'attendance' && <>
          <PageHeading eyebrow="CLASSROOM · ATTENDANCE" title="Being here is a big deal." subtitle="A quick, kind check-in for the humans in your room." action={<button className={`button ${attendanceSaved ? 'button-saved' : 'button-primary'}`} onClick={() => { setAttendanceSaved(true); setToast('Attendance saved on this device'); }}><Check size={16} /> {attendanceSaved ? 'Saved just now' : 'Save check-in'}</button>} />
          <div className="toolbar-card"><div className="attendance-date"><button className="icon-button calendar-nav" aria-label="Previous day" onClick={() => setAttendanceDate((value) => { const d = new Date(`${value}T12:00:00Z`); d.setUTCDate(d.getUTCDate() - 1); return d.toISOString().slice(0, 10); })}><ChevronLeft size={17} /></button><div><span>CHECK-IN FOR</span><strong>{dateLabel(attendanceDate, { weekday: 'long', month: 'long', day: 'numeric' })}</strong></div><button className="icon-button calendar-nav" aria-label="Next day" onClick={() => setAttendanceDate((value) => { const d = new Date(`${value}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10); })}><ChevronRight size={17} /></button></div><div className="select-wrap attendance-class"><UsersRound size={15} /><select value={attendanceClass} onChange={(event) => setAttendanceClass(event.target.value)}>{classes.filter((option) => option !== 'All classes').map((option) => <option key={option}>{option}</option>)}</select><ChevronDown size={15} /></div><button className="soft-button" onClick={() => { setAttendanceByDate((current) => ({ ...current, [attendanceDate]: Object.fromEntries(students.filter((s) => s.className === attendanceClass).map((s) => [s.id, 'present'])) as Record<string, AttendanceStatus> })); setAttendanceSaved(false); }}><CheckCheckIcon /> Mark everyone here</button></div>
          <div className="attendance-summary"><div className="attendance-summary-copy"><span className="eyebrow">TODAY, TOGETHER</span><strong>{students.filter((s) => s.className === attendanceClass).filter((s) => (currentAttendance[s.id] ?? 'present') === 'present').length}<small> of {students.filter((s) => s.className === attendanceClass).length} present</small></strong><p>Every check-in helps us notice who might need us.</p></div><div className="attendance-counts"><div><i className="presence-dot present-dot" /><span>Here</span><strong>{students.filter((s) => s.className === attendanceClass).filter((s) => (currentAttendance[s.id] ?? 'present') === 'present').length}</strong></div><div><i className="presence-dot late-dot" /><span>A little late</span><strong>{students.filter((s) => s.className === attendanceClass).filter((s) => currentAttendance[s.id] === 'late').length}</strong></div><div><i className="presence-dot absent-dot" /><span>Not today</span><strong>{students.filter((s) => s.className === attendanceClass).filter((s) => currentAttendance[s.id] === 'absent').length}</strong></div></div><div className="attendance-ring"><div className="ring-center"><strong>{Math.round(students.filter((s) => s.className === attendanceClass).filter((s) => (currentAttendance[s.id] ?? 'present') === 'present').length / Math.max(1, students.filter((s) => s.className === attendanceClass).length) * 100)}%</strong><span>in the room</span></div></div></div>
          <section className="panel attendance-panel"><SectionTitle title={attendanceClass} detail="Choose how today went for each learner" action={<span className="status-legend"><i className="present-dot" /> Here <i className="late-dot" /> Late <i className="absent-dot" /> Away</span>} /><div className="attendance-roster">{students.filter((s) => s.className === attendanceClass).map((student) => <div className="attendance-row" key={student.id}><Avatar name={student.name} color={student.color} /><div className="attendance-student"><strong>{student.name}</strong><span>#{student.id}</span></div><div className="attendance-pills">{(['present', 'late', 'absent'] as AttendanceStatus[]).map((status) => <button key={status} className={`attendance-pill ${currentAttendance[student.id] === status ? `pill-${status}` : ''}`} onClick={() => setAttendance(student.id, status)}>{status === 'present' ? <Check size={14} /> : status === 'late' ? <Clock3 size={14} /> : <span className="away-mark">–</span>}{status === 'present' ? 'Here' : status === 'late' ? 'Late' : 'Away'}</button>)}</div></div>)}</div>{students.filter((s) => s.className === attendanceClass).length === 0 && <EmptyState icon={UsersRound} title="No sample learners here yet" message="Add learners in the student directory to take attendance." />}</section>
          <PythonAttendanceBridge
            date={attendanceDate}
            className={attendanceClass}
            students={students.filter((student) => student.className === attendanceClass)}
            attendance={currentAttendance}
            onLoaded={(records) => setAttendanceByDate((current) => ({
              ...current,
              [attendanceDate]: { ...(current[attendanceDate] ?? sampleAttendance), ...records },
            }))}
          />
        </>}

        {page === 'assignments' && <>
          <PageHeading eyebrow="CLASSROOM · ASSIGNMENTS" title="Make room for good ideas." subtitle="A home for the work, the questions, and what comes next." action={<button className="button button-primary" onClick={() => openPageModal('assignment')}><Plus size={16} /> New assignment</button>} />
          <div className="assignment-overview"><div><span className="stat-label">In the mix</span><strong>{assignments.length} <small>assignments</small></strong><span className="overview-sub">A little progress in every class.</span></div><div className="overview-divider" /><div><span className="stat-label">Ready for a look</span><strong>{assignments.filter((a) => a.status === 'Grading').reduce((sum, item) => sum + item.submitted, 0) + 6} <small>pieces of work</small></strong><button className="inline-link" onClick={() => setAssignmentFilter('Grading')}>See what’s waiting <ArrowRight size={14} /></button></div><div className="overview-doodle"><span>✳</span><strong>Feedback is a<br />conversation.</strong><small>Make it a kind one.</small></div></div>
          <div className="assignment-toolbar"><div className="filter-tabs" role="tablist" aria-label="Filter assignments">{['All', 'Open', 'Grading', 'Completed'].map((filter) => <button key={filter} className={assignmentFilter === filter ? 'tab-active' : ''} onClick={() => setAssignmentFilter(filter)}>{filter}<span>{filter === 'All' ? assignments.length : assignments.filter((a) => a.status === filter).length}</span></button>)}</div><button className="soft-button" onClick={() => setAssignmentFilter('All')}><ListFilter size={15} /> Sort by due date</button></div>
          <div className="assignment-list">{filteredAssignments.map((item, index) => <article className="assignment-card" key={item.id}><div className={`assignment-art assignment-art-${index % 4}`}><span>{item.subject === 'Mathematics' ? '1 / 2' : item.subject === 'Science' ? '✳' : 'Aa'}</span></div><div className="assignment-card-main"><div className="assignment-meta"><StatusTag tone={item.status === 'Completed' ? 'green' : item.status === 'Grading' ? 'peach' : 'blue'}>{item.status}</StatusTag><span>{item.subject}</span></div><h3>{item.title}</h3><div className="assignment-subline"><span>{item.className}</span><i />{item.points} points<i /><span>Due {dateLabel(item.due, { month: 'short', day: 'numeric' })}</span></div><div className="assignment-progress-line"><ProgressBar value={item.total ? item.submitted / item.total * 100 : 0} tone={item.status === 'Completed' ? 'green' : 'blue'} /><span>{item.submitted} of {item.total} submitted</span></div></div><div className="assignment-card-side"><div className="submission-count"><strong>{Math.max(0, item.total - item.submitted)}</strong><span>to go</span></div><button className="icon-button" aria-label={`Edit ${item.title}`} onClick={() => setModal({ kind: 'assignment', item })}><Pencil size={16} /></button><button className="button button-outline" onClick={() => { navigate('grades'); setAssignmentFilter('All'); }}>View work <ArrowRight size={15} /></button></div></article>)}{filteredAssignments.length === 0 && <EmptyState icon={NotebookPen} title="Nothing in this little pile" message="Try another filter or create an assignment for your class." />}</div>
        </>}

        {page === 'grades' && <>
          <PageHeading eyebrow="CLASSROOM · SCORES & GRADING" title="A fuller picture of learning." subtitle="Scores tell one story. The rest is in the moments between." action={<button className="button button-outline" onClick={() => setToast('Sample grade summary is ready in this preview')}><Download size={16} /> Export overview</button>} />
          <div className="grade-topline"><div className="grade-highlight"><span className="stat-label">CLASSROOM AVERAGE</span><strong>82<span>%</span></strong><div className="grade-trend"><ArrowUpRight size={15} /> Up 4 points from last check-in</div><div className="grade-bars">{[38, 53, 46, 68, 57, 77, 69, 84, 74, 92, 80, 100].map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}</div></div><div className="grade-distribution"><SectionTitle title="Different paces, one classroom" detail="An at-a-glance view" /><div className="distribution-row"><span className="distribution-name"><i className="dist-dot dist-high" /> Finding their stride (90–100%)</span><strong>28</strong><div className="distribution-track"><i style={{ width: '23%' }} /></div></div><div className="distribution-row"><span className="distribution-name"><i className="dist-dot dist-mid" /> Growing steadily (70–89%)</span><strong>74</strong><div className="distribution-track"><i style={{ width: '62%' }} /></div></div><div className="distribution-row"><span className="distribution-name"><i className="dist-dot dist-low" /> Could use a hand (&lt;70%)</span><strong>26</strong><div className="distribution-track"><i style={{ width: '22%' }} /></div></div><div className="grade-note"><Sparkles size={16} /><span>One score never tells the whole story. Use it as a starting point.</span></div></div></div>
          <section className="panel table-panel grade-table-panel"><SectionTitle title="A closer look" detail="Sample scores across your learners" action={<div className="select-wrap"><Filter size={15} /><select aria-label="Select class">{classes.filter((option) => option !== 'All classes').map((option) => <option key={option}>{option}</option>)}</select><ChevronDown size={15} /></div>} /><div className="table-scroll"><table><thead><tr><th>LEARNER</th><th>CLASSWORK · 20</th><th>FIELD NOTES · 15</th><th>JOURNAL · 25</th><th>OVERALL</th><th>NOTE</th></tr></thead><tbody>{students.slice(0, 9).map((student, index) => { const scoreA = grades[student.id]?.a ?? [18, 16, 13, 12, 20, 15, 19, 11, 17][index]; const scoreB = grades[student.id]?.b ?? [14, 12, 11, 9, 15, 10, 13, 8, 12][index]; const scoreC = grades[student.id]?.c ?? [21, 20, 18, 15, 24, 19, 22, 14, 20][index]; const total = scoreA + scoreB + scoreC; const pct = Math.round(total / 60 * 100); return <tr key={student.id}><td><div className="student-cell"><Avatar name={student.name} color={student.color} size="sm" /><span><strong>{student.name}</strong><small>{student.className}</small></span></div></td>{(['a', 'b', 'c'] as const).map((key, itemIndex) => <td className="score-input-cell" key={key}><label><input aria-label={`${student.name} score ${itemIndex + 1}`} type="number" min="0" max={[20, 15, 25][itemIndex]} value={[scoreA, scoreB, scoreC][itemIndex]} onChange={(event) => setGrades((current) => ({ ...current, [student.id]: { ...(current[student.id] ?? { a: scoreA, b: scoreB, c: scoreC }), [key]: Math.max(0, Math.min([20, 15, 25][itemIndex], Number(event.target.value))) } }))} /><span>/ {[20, 15, 25][itemIndex]}</span></label></td>)}<td><strong className={`overall-score ${pct < 70 ? 'overall-low' : ''}`}>{pct}%</strong></td><td><StatusTag tone={student.status === 'Needs support' ? 'peach' : student.status === 'Excellent' ? 'green' : 'blue'}>{student.status === 'Excellent' ? 'Lovely work' : student.status === 'Needs support' ? 'Check in' : 'On track'}</StatusTag></td></tr>; })}</tbody></table></div><div className="grade-table-foot"><span><i className="grade-edit-dot" /> You can edit these sample scores right here. Totals update as you go.</span><button className="text-button" onClick={() => setToast('Score changes are saved on this device')}>Save scores <ArrowRight size={14} /></button></div></section>
        </>}

        {page === 'calendar' && <>
          <PageHeading eyebrow="PLAN AHEAD · CALENDAR" title="A little rhythm for the week." subtitle="Classes, deadlines, and the moments worth making space for." action={<button className="button button-primary" onClick={() => openPageModal('event')}><CalendarPlus size={16} /> Add an event</button>} />
          <div className="calendar-toolbar"><div className="month-title"><strong>{new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(calendarMonth)}</strong><button className="today-link" onClick={() => { setCalendarMonth(new Date(2026, 9, 1)); setSelectedDate(TODAY); }}>Today</button><button className="icon-button" aria-label="Previous month" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}><ChevronLeft size={18} /></button><button className="icon-button" aria-label="Next month" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}><ChevronRight size={18} /></button></div><div className="calendar-view-toggle"><button className="toggle-active">Month</button><button onClick={() => setToast('Agenda view is coming to this local prototype soon')}>Agenda</button></div></div>
          <div className="calendar-layout"><section className="panel month-panel"><div className="calendar-weekdays">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <span key={day}>{day}</span>)}</div><div className="calendar-grid">{getCalendarDays(calendarMonth).map((date) => { const key = isoDate(date); const isCurrentMonth = date.getMonth() === calendarMonth.getMonth(); const hasEvents = events.filter((event) => event.date === key); return <button key={key} className={`calendar-day ${isCurrentMonth ? '' : 'day-muted'} ${key === selectedDate ? 'day-selected' : ''} ${key === TODAY ? 'day-today' : ''}`} onClick={() => setSelectedDate(key)}><span className="day-number">{date.getDate()}</span><span className="day-event-dots">{hasEvents.slice(0, 3).map((event) => <i key={event.id} className={`event-dot event-${event.kind.toLowerCase()}`} />)}</span>{hasEvents.slice(0, 1).map((event) => <span key={event.id} className={`day-event-chip chip-${event.kind.toLowerCase()}`}>{event.title}</span>)}</button>; })}</div><div className="calendar-legend"><span><i className="event-dot event-class" /> Class</span><span><i className="event-dot event-deadline" /> Deadline</span><span><i className="event-dot event-activity" /> Activity</span><span><i className="event-dot event-meeting" /> Meeting</span></div></section><aside className="agenda-card"><div className="agenda-date-head"><span>{dateLabel(selectedDate, { weekday: 'long', month: 'long' })}</span><strong>{dateLabel(selectedDate, { day: '2-digit' })}</strong><small>{dateLabel(selectedDate, { year: 'numeric' })}</small></div><SectionTitle title="On this day" detail={`${selectedEvents.length} ${selectedEvents.length === 1 ? 'moment' : 'moments'}`} /><div className="agenda-list">{selectedEvents.length ? selectedEvents.map((event) => <div className="agenda-event" key={event.id}><i className={`agenda-marker marker-${event.kind.toLowerCase()}`} /><div><time>{event.time === '23:59' ? 'End of day' : event.time}</time><strong>{event.title}</strong><span>{event.detail}</span><button className="text-button" onClick={() => setModal({ kind: 'event', item: event })}><Pencil size={13} /> Edit event</button></div></div>) : <EmptyState icon={CalendarDays} title="A little space to breathe" message="Nothing on this day yet. Leave it open, or add something lovely." />}<button className="agenda-add" onClick={() => openPageModal('event')}><Plus size={16} /> Add to this day</button></div></aside></div>
        </>}

        {page === 'files' && <>
          <PageHeading eyebrow="RESOURCES · SHARED FILES" title="A shelf for the good stuff." subtitle="Keep the little things you use every day close at hand." action={<label className="button button-primary upload-label"><Upload size={16} /> Add a file<input type="file" onChange={(event) => addUploadedFile(event.target.files?.[0])} /></label>} />
          <div className="files-intro"><div className="folder-illustration"><FolderOpen size={30} /><span>✳</span></div><div><strong>Everything in its place.</strong><p>Your files and folders are sample records. Uploads appear on this device only.</p></div><span className="file-count">{files.length} items <i /> 4 shelves</span></div>
          <div className="file-toolbar"><div className="filter-tabs file-tabs">{fileCategories.map((category) => <button key={category} className={fileFilter === category ? 'tab-active' : ''} onClick={() => setFileFilter(category)}>{category}</button>)}</div><div className="search-field file-search"><Search size={15} /><input value={fileSearch} onChange={(event) => setFileSearch(event.target.value)} placeholder="Find a file" /></div></div>
          <div className="file-folder-row">{['Lesson plans', 'Assignments', 'Resources', 'Class notes'].map((category, index) => <button className="folder-tile" key={category} onClick={() => setFileFilter(category)}><span className={`folder-glyph folder-color-${index}`}><FolderOpen size={19} /></span><span><strong>{category}</strong><small>{files.filter((file) => file.category === category).length} things to explore</small></span><ChevronRight size={15} /></button>)}</div>
          <section className="panel table-panel files-table"><div className="section-title"><div><h2>All the good stuff</h2><span>A little easier to find, next time.</span></div><button className="dots-button" aria-label="File options" onClick={() => setToast('All file changes stay in this browser')}><MoreHorizontal size={19} /></button></div><div className="table-scroll"><table><thead><tr><th>FILE</th><th>SHELF</th><th>TYPE</th><th>SIZE</th><th>LAST TENDED</th><th /></tr></thead><tbody>{visibleFiles.map((file) => <tr key={file.id}><td><div className="file-name-cell"><span className={`file-type-icon file-type-${file.type.toLowerCase()}`}>{file.type === 'Image' ? <FileImage size={17} /> : file.type === 'Sheet' ? <FileSpreadsheet size={17} /> : <FileText size={17} />}</span><strong>{file.name}</strong></div></td><td>{file.category}</td><td><StatusTag tone="neutral">{file.type}</StatusTag></td><td>{file.size}</td><td>{file.updated}</td><td><button className="row-more" aria-label={`Preview ${file.name}`} onClick={() => setModal({ kind: 'file', item: file })}><ExternalLink size={15} /></button></td></tr>)}</tbody></table>{visibleFiles.length === 0 && <EmptyState icon={FolderOpen} title="Your shelf is quiet here" message="Try another shelf or search for a different file." />}</div></section>
        </>}

        {page === 'activities' && <>
          <PageHeading eyebrow="YOUR SPACE · ACTIVITY" title="The little things add up." subtitle="A soft timeline of all the good work happening in your classroom." action={<button className="button button-outline" onClick={() => setToast('You are all caught up on this device')}><Check size={16} /> All caught up</button>} />
          <div className="activity-summary"><span className="summary-star">✳</span><div><span className="stat-label">A small reminder</span><strong>There’s more good going on<br />than you can see at once.</strong><small>Here are a few pieces of it.</small></div><div className="activity-summary-stamp">WEEK<br /><b>07</b></div></div>
          <section className="panel activity-timeline"><SectionTitle title="Around your classroom" detail="A recent little timeline" action={<button className="soft-button" onClick={() => setToast('Showing your recent classroom moments')}><Filter size={15} /> Recent</button>} /><div className="timeline-list">{activities.map((item, index) => <div className="timeline-item" key={item.id}><div className="timeline-rail"><SmallIcon kind={item.kind} />{index < activities.length - 1 && <i />}</div><div className="timeline-content"><div className="timeline-top"><strong>{item.title}</strong><time>{item.time}</time></div><p>{item.detail}</p><span className="timeline-kind">{item.kind === 'assignment' ? 'WORK & FEEDBACK' : item.kind === 'student' ? 'YOUR LEARNERS' : item.kind === 'event' ? 'PLAN AHEAD' : item.kind === 'file' ? 'RESOURCES' : 'CLASSROOM RHYTHM'}</span></div><button className="row-more" aria-label="View related section" onClick={() => navigate(item.kind === 'assignment' ? 'assignments' : item.kind === 'student' ? 'students' : item.kind === 'event' ? 'calendar' : item.kind === 'file' ? 'files' : 'attendance')}><ArrowRight size={15} /></button></div>)}{activities.length === 0 && <EmptyState icon={Activity} title="A fresh start" message="Your next classroom moment will show up here." />}</div></section>
        </>}

        {page === 'settings' && <>
          <PageHeading eyebrow="YOUR SPACE · PREFERENCES" title="Made for the way you teach." subtitle="A few details that make this space feel like yours." />
          <div className="settings-layout"><div className="settings-nav panel"><span className="settings-nav-label">YOUR SPACE</span><button className={settingsSection === 'profile' ? 'settings-nav-active' : ''} onClick={() => { setSettingsSection('profile'); document.getElementById('teacher-profile')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }}><UserRound size={16} /> Teacher profile</button><button className={settingsSection === 'appearance' ? 'settings-nav-active' : ''} onClick={() => { setSettingsSection('appearance'); document.getElementById('settings-appearance')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }}><Sparkles size={16} /> Appearance</button><button className={settingsSection === 'notifications' ? 'settings-nav-active' : ''} onClick={() => { setSettingsSection('notifications'); document.getElementById('settings-notifications')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }}><Bell size={16} /> Notifications</button><div className="settings-prototype-callout"><AlertCircle size={16} /><div><strong>A note about this preview</strong><p>Sign-in and live school connections are not set up. These profile changes stay in this browser.</p></div></div></div><form id="teacher-profile" className="panel profile-form" onSubmit={saveProfile}><div className="profile-form-head"><Avatar name={profile.name} color="coral" size="lg" /><div><strong>Your teacher profile</strong><span>A friendly face for your own little corner.</span></div><button className="text-button" type="button" onClick={() => setToast('This sample profile has no profile photo to upload')}>Change photo</button></div><div className="form-grid"><label>What should we call you?<input name="name" defaultValue={profile.name} required /></label><label>Your role<input name="role" defaultValue={profile.role} /></label><label>Email address<input name="email" type="email" defaultValue={profile.email} /></label><label>Your school or space<input name="school" defaultValue={profile.school} /></label></div><WorkspacePreferences preferences={preferences} setPreferences={setPreferences} /><div className="profile-save-row"><span><CheckCircle2 size={15} /> Changes are saved on this device only.</span><button className="button button-primary" type="submit"><Check size={16} /> Save my details</button></div><div className="auth-boundary"><div className="auth-boundary-icon"><AlertCircle size={18} /></div><div><strong>About sign-in & school connections</strong><p>This interface is a prototype with sample data. The linked KruSpace backend still has unfinished authentication and placeholder API routes, so no account sign-in or live school data is connected.</p></div></div></form></div>
        </>}

        <footer className="page-footer"><span>Made for the moments that make a classroom.</span><span className="footer-status"><i /> Your changes stay on this device <span>·</span> <button onClick={() => setToast('KruSpace prototype · Sample records only')}>About this preview</button></span></footer>
      </div>
    </main>

    {searchOpen && <div className="search-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setSearchOpen(false); }}><div className="search-modal"><div className="search-modal-input"><Search size={19} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search learners, work, events, files..." /><kbd>ESC</kbd><button className="icon-button" aria-label="Close search" onClick={() => setSearchOpen(false)}><X size={17} /></button></div>{query.trim() ? <div className="search-results">{searchResults.length ? searchResults.map((result) => <button className="search-result" key={`${result.kind}-${result.title}`} onClick={() => { navigate(result.page); setSearchOpen(false); if (result.kind === 'Student') setModal({ kind: 'student', item: result.item as Student }); if (result.kind === 'Assignment') setModal({ kind: 'assignment', item: result.item as Assignment }); if (result.kind === 'Event') setModal({ kind: 'event', item: result.item as CalendarEvent }); if (result.kind === 'File') setModal({ kind: 'file', item: result.item as FileItem }); }}><span className="result-type">{result.kind === 'Student' ? <UsersRound size={16} /> : result.kind === 'Assignment' ? <NotebookPen size={16} /> : result.kind === 'Event' ? <CalendarDays size={16} /> : <FileText size={16} />}</span><span><strong>{result.title}</strong><small>{result.detail}</small></span><ArrowRight size={15} /></button>) : <EmptyState title="Nothing found just yet" message="Try a different word. There are plenty of little details to discover." />}</div> : <div className="search-shortcuts"><span>YOU CAN LOOK FOR...</span><button onClick={() => { setQuery('Science'); }}><UsersRound size={15} /> A learner or class</button><button onClick={() => { setQuery('patterns'); }}><NotebookPen size={15} /> An assignment</button><button onClick={() => { setQuery('reading'); }}><CalendarDays size={15} /> An event or deadline</button><button onClick={() => { setQuery('journal'); }}><FolderOpen size={15} /> A shared file</button></div>}<div className="search-hint"><span><kbd>↑</kbd> <kbd>↓</kbd> to wander</span><span><kbd>↵</kbd> to open</span><span className="search-local-note">Searches sample records in this browser</span></div></div></div>}

    {modal && <Modal modal={modal} close={() => setModal(null)} saveAssignment={saveAssignment} saveEvent={saveEvent} saveStudent={saveStudent} setStudents={setStudents} setEvents={setEvents} setFiles={setFiles} pushActivity={pushActivity} setToast={setToast} />}
           {toast && <div className="toast-message">...</div>}
     </div>
     )

function CheckCheckIcon() { return <CheckCircle2 size={16} />; }
function getCalendarDays(month: Date) {
  const year = month.getFullYear(); const monthIndex = month.getMonth();
  const offset = new Date(year, monthIndex, 1).getDay();
  const count = Math.ceil((offset + new Date(year, monthIndex + 1, 0).getDate()) / 7) * 7;
  return Array.from({ length: count }, (_, index) => new Date(year, monthIndex, index - offset + 1));
}
function isoDate(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }

function Modal({ modal, close, saveAssignment, saveEvent, saveStudent, setStudents, setEvents, setFiles, pushActivity, setToast }: {
  modal: NonNullable<ModalState>;
  close: () => void;
  saveAssignment: (event: FormEvent<HTMLFormElement>) => void;
  saveEvent: (event: FormEvent<HTMLFormElement>) => void;
  saveStudent: (event: FormEvent<HTMLFormElement>) => void;
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  setEvents: React.Dispatch<React.SetStateAction<CalendarEvent[]>>;
  setFiles: React.Dispatch<React.SetStateAction<FileItem[]>>;
  pushActivity: (title: string, detail: string, kind: ActivityItem['kind']) => void;
  setToast: (message: string) => void;
}) {
  const [category, setCategory] = useState((modal.item as FileItem | undefined)?.category ?? 'Resources');
  const [studentTab, setStudentTab] = useState('A little about them');
  const [studentEdit, setStudentEdit] = useState(false);
  const title = modal.kind === 'assignment' ? modal.item ? 'A little edit' : 'Make something new' : modal.kind === 'event' ? modal.item ? 'Tend to this date' : 'Add a moment' : modal.kind === 'student' ? (modal.item as Student | undefined)?.name ?? 'A new learner' : modal.kind === 'file' ? (modal.item as FileItem).name : 'Your classroom activity';
  const subtitle = modal.kind === 'assignment' ? 'Work that makes space for curious minds.' : modal.kind === 'event' ? 'Leave a little marker for something that matters.' : modal.kind === 'student' ? 'A small profile, just for this local preview.' : modal.kind === 'file' ? 'A few useful details from your teaching shelf.' : 'A recent sample classroom moment.';
  const student = modal.kind === 'student' ? modal.item as Student | undefined : undefined;
  const assignment = modal.kind === 'assignment' ? modal.item as Assignment | undefined : undefined;
  const calendarEvent = modal.kind === 'event' ? modal.item as CalendarEvent | undefined : undefined;
  const file = modal.kind === 'file' ? modal.item as FileItem : undefined;
  const removeEvent = () => {
    if (calendarEvent) {
      setEvents((current) => current.filter((item) => item.id !== calendarEvent.id));
      pushActivity('A calendar moment was removed', calendarEvent.title, 'event');
      setToast('Event removed from your local calendar');
      close();
    }
  };
  return (
  <div className="modal-scrim" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
    <div className={`modal-card ${modal.kind === 'student' ? 'modal-student' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
    <div className="modal-head"><div>
      <span className="eyebrow">A NOTE FROM KRUSPACE</span>
      <h2>{title}</h2><p>{subtitle}
        </p>
    </div>
        <button className="icon-button" aria-label="Close" onClick={close}><X size={18} /></button>
     </div>
    {modal.kind === 'assignment' && <form onSubmit={saveAssignment} className="modal-form"><label>What are they working on?<input name="title" defaultValue={assignment?.title} placeholder="e.g. A tiny world, up close" required /></label><div className="form-grid"><label>Class<select name="className" defaultValue={assignment?.className ?? classes[1]}>{classes.filter((option) => option !== 'All classes').map((item) => <option key={item}>{item}</option>)}</select></label><label>Subject<input name="subject" defaultValue={assignment?.subject ?? 'Mathematics'} /></label><label>When is it due?<input type="date" name="due" defaultValue={assignment?.due ?? TODAY} required /></label><label>Points<input type="number" name="points" min="1" defaultValue={assignment?.points ?? 20} /></label><label>Class size<input type="number" name="total" min="1" defaultValue={assignment?.total ?? 28} /></label><label>Where is it now?<select name="status" defaultValue={assignment?.status ?? 'Open'}><option>Open</option><option>Grading</option><option>Completed</option></select></label></div><div className="modal-foot"><span>Saved to this browser only.</span><button type="button" className="button button-outline" onClick={close}>Let it be</button><button type="submit" className="button button-primary"><Check size={15} /> {assignment ? 'Save my edits' : 'Create assignment'}</button></div></form>}
    {modal.kind === 'event' && <form onSubmit={saveEvent} className="modal-form"><label>What’s happening?<input name="title" defaultValue={calendarEvent?.title} placeholder="e.g. A reading circle" required /></label><div className="form-grid"><label>When?<input type="date" name="date" defaultValue={calendarEvent?.date ?? TODAY} required /></label><label>What kind of moment?<select name="kind" defaultValue={calendarEvent?.kind ?? 'Activity'}><option>Class</option><option>Deadline</option><option>Activity</option><option>Meeting</option></select></label><label>What time?<input type="time" name="time" defaultValue={calendarEvent?.time ?? '10:00'} /></label><label>Where or why?<input name="detail" defaultValue={calendarEvent?.detail} placeholder="A little note for future you" /></label></div><div className="modal-foot"><span>Saved on this device only.</span>{calendarEvent && <button type="button" className="text-button danger-text" onClick={removeEvent}>Remove event</button>}<button type="button" className="button button-outline" onClick={close}>Cancel</button><button type="submit" className="button button-primary"><Check size={15} /> {calendarEvent ? 'Save changes' : 'Add to calendar'}</button></div></form>}
    {modal.kind === 'student' && (studentEdit || !student ? <form onSubmit={saveStudent} className="modal-form"><div className="form-grid"><label>Learner name<input name="name" defaultValue={student?.name} required /></label><label>Student ID<input name="id" defaultValue={student?.id} required /></label><label>Class<select name="className" defaultValue={student?.className ?? classes[1]}>{classes.filter((option) => option !== 'All classes').map((item) => <option key={item}>{item}</option>)}</select></label><label>Email address<input type="email" name="email" defaultValue={student?.email} /></label></div><div className="modal-foot"><span>Details remain in this browser.</span><button type="button" className="button button-outline" onClick={() => student ? setStudentEdit(false) : close()}>Cancel</button><button type="submit" className="button button-primary"><Check size={15} /> Save learner</button></div></form> : <><div className="student-detail-banner"><Avatar name={student.name} color={student.color} size="lg" /><div><StatusTag tone={student.status === 'Excellent' ? 'green' : student.status === 'Needs support' ? 'peach' : 'blue'}>{student.status}</StatusTag><strong>{student.className}</strong><small>Student ID {student.id}</small></div><button className="button button-outline" onClick={() => setStudentEdit(true)}><Pencil size={14} /> Edit details</button></div><div className="student-modal-tabs">{['A little about them', 'Learning notes'].map((tab) => <button key={tab} className={studentTab === tab ? 'tab-active' : ''} onClick={() => setStudentTab(tab)}>{tab}</button>)}</div>{studentTab === 'A little about them' ? <div className="student-detail-grid"><div><span>ATTENDANCE</span><strong>{student.attendance}%</strong><ProgressBar value={student.attendance} tone="blue" /></div><div><span>CLASSROOM AVERAGE</span><strong>{student.average}%</strong><ProgressBar value={student.average} /></div><div><span>EMAIL</span><a href={`mailto:${student.email}`}><Mail size={14} /> {student.email}</a></div><div><span>CLASSROOM PULSE</span><strong className="student-note">{student.status === 'Excellent' ? 'Finding their stride' : student.status === 'Needs support' ? 'Could use a check-in' : 'Growing steadily'}</strong></div></div> : <div className="student-learning-note"><Sparkles size={17} /><div><strong>A blank page, with room for a note.</strong><p>Learning notes are sample-only in this prototype. The source backend does not provide a live learner-profile API yet.</p><textarea placeholder="A thoughtful observation for your future self..." onChange={() => undefined} /></div></div>}<div className="modal-foot"><span>Fictional sample record · Changes stay here.</span><button className="button button-outline" onClick={close}>Close profile</button></div></>) }
    {modal.kind === 'file' && file && <div className="file-preview"><div className="file-preview-art"><span className="file-type-icon"><FileText size={23} /></span><span className="file-preview-spark">✳</span></div><div className="file-preview-details"><div><span>SHELF</span><select value={category === 'Resources' ? file.category : category} onChange={(event) => setCategory(event.target.value)}><option>Assignments</option><option>Lesson plans</option><option>Resources</option><option>Class notes</option></select></div><div><span>TYPE</span><strong>{file.type}</strong></div><div><span>SIZE</span><strong>{file.size}</strong></div><div><span>LAST TENDED</span><strong>{file.updated}</strong></div><p>This preview describes a sample resource. Actual file contents aren’t stored or served by the local prototype.</p></div><div className="modal-foot"><span>Changes stay on this device.</span><button className="button button-outline" onClick={close}>Close</button><button className="button button-primary" onClick={() => { setFiles((current) => current.map((item) => item.id === file.id ? { ...item, category } : item)); setToast('File shelf updated'); close(); }}><FolderOpen size={15} /> Move to shelf</button></div></div>}
    {modal.kind === 'activity' && <div className="activity-modal"><SmallIcon kind={(modal.item as ActivityItem).kind} /><div><strong>{(modal.item as ActivityItem).title}</strong><p>{(modal.item as ActivityItem).detail}</p></div></div>}
     </div> 
     </div>
     );
}}
