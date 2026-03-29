// Local storage wrapper for persistent data

const STORAGE_KEYS = {
  SCHOOLS: 'mm_schools',
  LESSONS: 'mm_lessons',
  PAYMENTS: 'mm_payments',
  TEACHERS: 'mm_teachers',
  NOTES: 'mm_notes',
  SETTINGS: 'mm_settings',
  CLOSED_DATES: 'mm_closed_dates',
  LESSON_PAYMENTS: 'mm_lesson_payments',
};

export function getData(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function setData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Schools
export function getSchools() {
  return getData(STORAGE_KEYS.SCHOOLS) || [];
}

export function saveSchools(schools) {
  setData(STORAGE_KEYS.SCHOOLS, schools);
}

export function addSchool(school) {
  const schools = getSchools();
  school.id = crypto.randomUUID();
  school.createdAt = new Date().toISOString();
  schools.push(school);
  saveSchools(schools);
  return school;
}

export function updateSchool(id, updates) {
  const schools = getSchools();
  const idx = schools.findIndex(s => s.id === id);
  if (idx !== -1) {
    schools[idx] = { ...schools[idx], ...updates };
    saveSchools(schools);
  }
  return schools[idx];
}

export function deleteSchool(id) {
  const schools = getSchools().filter(s => s.id !== id);
  saveSchools(schools);
  // Also remove related lessons
  const lessons = getLessons().filter(l => l.schoolId !== id);
  saveLessons(lessons);
}

// Recurring Lessons
export function getLessons() {
  return getData(STORAGE_KEYS.LESSONS) || [];
}

export function saveLessons(lessons) {
  setData(STORAGE_KEYS.LESSONS, lessons);
}

export function addLesson(lesson) {
  const lessons = getLessons();
  lesson.id = crypto.randomUUID();
  lesson.createdAt = new Date().toISOString();
  lessons.push(lesson);
  saveLessons(lessons);
  return lesson;
}

export function updateLesson(id, updates) {
  const lessons = getLessons();
  const idx = lessons.findIndex(l => l.id === id);
  if (idx !== -1) {
    lessons[idx] = { ...lessons[idx], ...updates };
    saveLessons(lessons);
  }
  return lessons[idx];
}

export function deleteLesson(id) {
  const lessons = getLessons().filter(l => l.id !== id);
  saveLessons(lessons);
}

// Teachers
export function getTeachers() {
  return getData(STORAGE_KEYS.TEACHERS) || [];
}

export function saveTeachers(teachers) {
  setData(STORAGE_KEYS.TEACHERS, teachers);
}

export function addTeacher(teacher) {
  const teachers = getTeachers();
  teacher.id = crypto.randomUUID();
  teacher.createdAt = new Date().toISOString();
  teachers.push(teacher);
  saveTeachers(teachers);
  return teacher;
}

export function updateTeacher(id, updates) {
  const teachers = getTeachers();
  const idx = teachers.findIndex(t => t.id === id);
  if (idx !== -1) {
    teachers[idx] = { ...teachers[idx], ...updates };
    saveTeachers(teachers);
  }
  return teachers[idx];
}

export function deleteTeacher(id) {
  const teachers = getTeachers().filter(t => t.id !== id);
  saveTeachers(teachers);
}

// Payments
export function getPayments() {
  return getData(STORAGE_KEYS.PAYMENTS) || [];
}

export function savePayments(payments) {
  setData(STORAGE_KEYS.PAYMENTS, payments);
}

export function addPayment(payment) {
  const payments = getPayments();
  payment.id = crypto.randomUUID();
  payment.createdAt = new Date().toISOString();
  payments.push(payment);
  savePayments(payments);
  return payment;
}

export function updatePayment(id, updates) {
  const payments = getPayments();
  const idx = payments.findIndex(p => p.id === id);
  if (idx !== -1) {
    payments[idx] = { ...payments[idx], ...updates };
    savePayments(payments);
  }
  return payments[idx];
}

export function deletePayment(id) {
  const payments = getPayments().filter(p => p.id !== id);
  savePayments(payments);
}

// Notes
export function getNotes() {
  return getData(STORAGE_KEYS.NOTES) || [];
}

export function saveNotes(notes) {
  setData(STORAGE_KEYS.NOTES, notes);
}

export function addNote(note) {
  const notes = getNotes();
  note.id = crypto.randomUUID();
  note.createdAt = new Date().toISOString();
  notes.push(note);
  saveNotes(notes);
  return note;
}

export function deleteNote(id) {
  const notes = getNotes().filter(n => n.id !== id);
  saveNotes(notes);
}

// Settings
export function getSettings() {
  return getData(STORAGE_KEYS.SETTINGS) || {
    theme: 'dark',
    notificationsEnabled: true,
    notificationTime: '07:00',
    currency: 'USD',
    businessName: 'Music Teaching',
  };
}

export function saveSettings(settings) {
  setData(STORAGE_KEYS.SETTINGS, settings);
}

// Custom closed dates (manual school closings)
export function getClosedDates() {
  return getData(STORAGE_KEYS.CLOSED_DATES) || [];
}

export function saveClosedDates(dates) {
  setData(STORAGE_KEYS.CLOSED_DATES, dates);
}

export function addClosedDate(entry) {
  const dates = getClosedDates();
  entry.id = crypto.randomUUID();
  dates.push(entry);
  saveClosedDates(dates);
  return entry;
}

export function deleteClosedDate(id) {
  const dates = getClosedDates().filter(d => d.id !== id);
  saveClosedDates(dates);
}

// Lesson Payment Tracking (per-occurrence: lessonId + date = paid/unpaid)
export function getLessonPayments() {
  return getData(STORAGE_KEYS.LESSON_PAYMENTS) || {};
}

export function saveLessonPayments(payments) {
  setData(STORAGE_KEYS.LESSON_PAYMENTS, payments);
}

// key = lessonId:dateStr
export function markLessonPaid(lessonId, dateStr) {
  const payments = getLessonPayments();
  payments[`${lessonId}:${dateStr}`] = { paid: true, paidAt: new Date().toISOString() };
  saveLessonPayments(payments);
}

export function markLessonUnpaid(lessonId, dateStr) {
  const payments = getLessonPayments();
  delete payments[`${lessonId}:${dateStr}`];
  saveLessonPayments(payments);
}

export function isLessonPaid(lessonId, dateStr) {
  const payments = getLessonPayments();
  return !!payments[`${lessonId}:${dateStr}`]?.paid;
}
