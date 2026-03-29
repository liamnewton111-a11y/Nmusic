// Jewish Calendar utilities using @hebcal/core for accurate dates
import { HDate, HebrewCalendar, months, flags } from '@hebcal/core';

// ===== Hebrew Date Conversion =====

export function gregorianToHebrew(gYear, gMonth, gDay) {
  const hd = new HDate(new Date(gYear, gMonth - 1, gDay));
  const monthName = hd.getMonthName();

  // Hebrew month name mapping
  const hebMonthNames = {
    'Tishrei': 'תשרי', 'Cheshvan': 'חשון', 'Kislev': 'כסלו',
    'Tevet': 'טבת', 'Sh\'vat': 'שבט', "Adar": 'אדר',
    'Adar I': 'אדר א׳', 'Adar II': 'אדר ב׳',
    'Nisan': 'ניסן', 'Iyyar': 'אייר', 'Sivan': 'סיון',
    'Tamuz': 'תמוז', 'Av': 'אב', 'Elul': 'אלול',
  };

  return {
    year: hd.getFullYear(),
    month: hd.getMonth(),
    day: hd.getDate(),
    monthName: monthName,
    monthNameHeb: hebMonthNames[monthName] || monthName,
    dayHeb: hd.renderGematriya().split(' ')[0],
  };
}

export function getHebrewDateString(date) {
  const hd = new HDate(date);
  return hd.renderGematriya();
}

export function getHebrewDateStringEng(date) {
  const hd = new HDate(date);
  return `${hd.getDate()} ${hd.getMonthName()} ${hd.getFullYear()}`;
}

// ===== Jewish Holidays =====
export function getJewishHolidays(gYear) {
  const holidays = [];

  // Get events for the year from hebcal
  const events = HebrewCalendar.calendar({
    year: gYear,
    isHebrewYear: false,
    candlelighting: false,
    sedrot: false,
    omer: false,
    noMinorFast: false,
    noModern: false,
    noRoshChodesh: true,
    noSpecialShabbat: true,
  });

  for (const ev of events) {
    const date = ev.getDate().greg();
    const dateStr = formatDate(date);
    const mask = ev.getFlags();

    // Determine if it's a no-work holiday
    const noWork = !!(mask & (flags.CHAG));

    // Skip minor/special shabbat events
    if (mask & flags.SPECIAL_SHABBAT) continue;
    if (mask & flags.SHABBAT_MEVARCHIM) continue;

    holidays.push({
      date: dateStr,
      name: ev.render('en'),
      type: 'jewish',
      noWork,
      hebrewDate: ev.getDate().renderGematriya(),
    });
  }

  return holidays;
}

// ===== American Holidays =====
export function getAmericanHolidays(year) {
  const holidays = [];

  // Fixed-date holidays
  holidays.push({ date: `${year}-01-01`, name: "New Year's Day", type: 'american', noWork: true });
  holidays.push({ date: `${year}-06-19`, name: 'Juneteenth', type: 'american', noWork: true });
  holidays.push({ date: `${year}-07-04`, name: 'Independence Day', type: 'american', noWork: true });
  holidays.push({ date: `${year}-11-11`, name: 'Veterans Day', type: 'american', noWork: false });
  holidays.push({ date: `${year}-12-25`, name: 'Christmas Day', type: 'american', noWork: true });

  // Floating holidays
  holidays.push({ date: nthWeekday(year, 1, 1, 3), name: 'Martin Luther King Jr. Day', type: 'american', noWork: true });
  holidays.push({ date: nthWeekday(year, 2, 1, 3), name: "Presidents' Day", type: 'american', noWork: true });
  holidays.push({ date: lastWeekday(year, 5, 1), name: 'Memorial Day', type: 'american', noWork: true });
  holidays.push({ date: nthWeekday(year, 9, 1, 1), name: 'Labor Day', type: 'american', noWork: true });
  holidays.push({ date: nthWeekday(year, 10, 1, 2), name: 'Columbus Day', type: 'american', noWork: false });
  holidays.push({ date: nthWeekday(year, 11, 4, 4), name: 'Thanksgiving', type: 'american', noWork: true });

  const tg = new Date(nthWeekday(year, 11, 4, 4));
  tg.setDate(tg.getDate() + 1);
  holidays.push({ date: formatDate(tg), name: 'Day after Thanksgiving', type: 'american', noWork: true });

  return holidays;
}

// Get nth weekday of a month (weekday: 0=Sun, 1=Mon, ..., 6=Sat)
function nthWeekday(year, month, weekday, n) {
  const first = new Date(year, month - 1, 1);
  let dayOfWeek = first.getDay();
  let day = 1 + ((weekday - dayOfWeek + 7) % 7) + (n - 1) * 7;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function lastWeekday(year, month, weekday) {
  const last = new Date(year, month, 0);
  let dayOfWeek = last.getDay();
  let diff = (dayOfWeek - weekday + 7) % 7;
  const day = last.getDate() - diff;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function formatDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ===== Shabbat Detection =====
export function isShabbat(date) {
  return date.getDay() === 6;
}

export function isFridayAfternoon(date) {
  return date.getDay() === 5;
}

// ===== Get all holidays for a date =====
export function getHolidaysForDate(dateStr, gYear) {
  const jewish = getJewishHolidays(gYear);
  const american = getAmericanHolidays(gYear);
  const all = [...jewish, ...american];
  return all.filter(h => h.date === dateStr);
}

// ===== Get all holidays for a month =====
export function getHolidaysForMonth(gYear, gMonth) {
  const jewish = getJewishHolidays(gYear);
  const american = getAmericanHolidays(gYear);
  const all = [...jewish, ...american];
  const monthStr = `${gYear}-${String(gMonth).padStart(2, '0')}`;
  return all.filter(h => h.date.startsWith(monthStr));
}

// ===== Check if school is closed on a date =====
export function isSchoolClosed(dateStr, closedDates = []) {
  const date = new Date(dateStr + 'T12:00:00');

  if (isShabbat(date)) return { closed: true, reason: 'Shabbat' };

  const customClosed = closedDates.find(d => d.date === dateStr);
  if (customClosed) return { closed: true, reason: customClosed.reason || 'Closed' };

  const year = date.getFullYear();
  const holidays = [...getJewishHolidays(year), ...getAmericanHolidays(year)];
  const holiday = holidays.find(h => h.date === dateStr && h.noWork);
  if (holiday) return { closed: true, reason: holiday.name };

  return { closed: false };
}

// ===== Get upcoming holidays =====
export function getUpcomingHolidays(count = 10) {
  const today = new Date();
  const todayStr = formatDate(today);
  const year = today.getFullYear();

  const thisYear = [...getJewishHolidays(year), ...getAmericanHolidays(year)];
  const nextYear = [...getJewishHolidays(year + 1), ...getAmericanHolidays(year + 1)];

  const all = [...thisYear, ...nextYear]
    .filter(h => h.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date));

  const seen = new Set();
  const unique = [];
  for (const h of all) {
    const key = h.date + h.name;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(h);
    }
  }

  return unique.slice(0, count);
}

// ===== Parsha of the week =====
export function getParsha(date) {
  try {
    const events = HebrewCalendar.calendar({
      start: date,
      end: date,
      sedrot: true,
      noHolidays: true,
    });
    const sedra = events.find(e => e.getFlags() & flags.PARSHA_HASHAVUA);
    if (sedra) return sedra.render('en');
  } catch (e) {
    // fallback
  }

  // If no parsha found for this date, find the next Shabbat's parsha
  const nextShabbat = new Date(date);
  nextShabbat.setDate(nextShabbat.getDate() + (6 - nextShabbat.getDay()));
  try {
    const events = HebrewCalendar.calendar({
      start: nextShabbat,
      end: nextShabbat,
      sedrot: true,
      noHolidays: true,
    });
    const sedra = events.find(e => e.getFlags() & flags.PARSHA_HASHAVUA);
    if (sedra) return sedra.render('en');
  } catch (e) {
    // fallback
  }

  return '';
}

// ===== Check if a lesson occurs on a specific date based on frequency =====
export function doesLessonOccurOnDate(lesson, dateStr) {
  const date = new Date(dateStr + 'T12:00:00');
  const dow = date.getDay();

  // Must match day of week
  if (lesson.dayOfWeek !== dow) return false;

  const frequency = lesson.frequency || 'weekly';

  if (frequency === 'weekly') return true;

  // Need a start date to calculate bi-weekly/monthly
  const startDate = lesson.startDate ? new Date(lesson.startDate + 'T12:00:00') : new Date(lesson.createdAt);

  if (frequency === 'biweekly') {
    const diffTime = date.getTime() - startDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    const diffWeeks = Math.round(diffDays / 7);
    return diffWeeks % 2 === 0;
  }

  if (frequency === 'monthly') {
    // Same week-of-month and same day-of-week
    const startWeekOfMonth = Math.ceil(startDate.getDate() / 7);
    const dateWeekOfMonth = Math.ceil(date.getDate() / 7);
    return startWeekOfMonth === dateWeekOfMonth;
  }

  return true;
}
