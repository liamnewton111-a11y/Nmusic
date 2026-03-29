// Notification system for daily morning alerts

export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('Notifications not supported');
    return false;
  }

  if (Notification.permission === 'granted') return true;

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

export function scheduleNotification(title, body, tag = 'daily-schedule') {
  if (Notification.permission !== 'granted') return;

  new Notification(title, {
    body,
    icon: '/favicon.svg',
    tag,
    badge: '/favicon.svg',
  });
}

// Check and send morning notification
export function checkMorningNotification(lessons, schools, settings) {
  if (!settings.notificationsEnabled) return;

  const now = new Date();
  const [targetHour, targetMin] = (settings.notificationTime || '07:00').split(':').map(Number);

  // Check if we should send (within 1 minute of target time)
  if (now.getHours() !== targetHour || now.getMinutes() !== targetMin) return;

  // Check if already sent today
  const lastSent = localStorage.getItem('mm_last_notification');
  const todayStr = now.toDateString();
  if (lastSent === todayStr) return;

  // Get today's lessons (respecting frequency)
  const dayOfWeek = now.getDay();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // Import doesLessonOccurOnDate logic inline to avoid circular deps
  const todayLessons = lessons
    .filter(l => {
      if (l.dayOfWeek !== dayOfWeek) return false;
      const freq = l.frequency || 'weekly';
      if (freq === 'weekly') return true;
      const startDate = l.startDate ? new Date(l.startDate + 'T12:00:00') : new Date(l.createdAt);
      if (freq === 'biweekly') {
        const diffTime = now.getTime() - startDate.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        return Math.round(diffDays / 7) % 2 === 0;
      }
      if (freq === 'monthly') {
        return Math.ceil(startDate.getDate() / 7) === Math.ceil(now.getDate() / 7);
      }
      return true;
    })
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  if (todayLessons.length === 0) {
    scheduleNotification(
      '🎵 Good Morning!',
      `No lessons scheduled for ${dayNames[dayOfWeek]}. Enjoy your day off!`
    );
  } else {
    const schoolNames = todayLessons.map(l => {
      const school = schools.find(s => s.id === l.schoolId);
      return school ? `${school.name} at ${l.startTime}` : `Lesson at ${l.startTime}`;
    });

    scheduleNotification(
      `🎵 Good Morning! ${todayLessons.length} lesson${todayLessons.length > 1 ? 's' : ''} today`,
      schoolNames.join('\n')
    );
  }

  localStorage.setItem('mm_last_notification', todayStr);
}

// Start the notification checker (runs every minute)
export function startNotificationChecker(getLessons, getSchools, getSettings) {
  // Initial check
  setTimeout(() => {
    const lessons = getLessons();
    const schools = getSchools();
    const settings = getSettings();
    checkMorningNotification(lessons, schools, settings);
  }, 1000);

  // Check every minute
  return setInterval(() => {
    const lessons = getLessons();
    const schools = getSchools();
    const settings = getSettings();
    checkMorningNotification(lessons, schools, settings);
  }, 60000);
}

// Send a test notification
export function sendTestNotification(lessons, schools) {
  const dayOfWeek = new Date().getDay();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const todayLessons = lessons
    .filter(l => l.dayOfWeek === dayOfWeek)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  if (todayLessons.length === 0) {
    scheduleNotification(
      '🎵 Test: Good Morning!',
      `No lessons scheduled for ${dayNames[dayOfWeek]}.`,
      'test'
    );
  } else {
    const schoolNames = todayLessons.map(l => {
      const school = schools.find(s => s.id === l.schoolId);
      return school ? `${school.name} at ${l.startTime}` : `Lesson at ${l.startTime}`;
    });

    scheduleNotification(
      `🎵 Test: ${todayLessons.length} lesson${todayLessons.length > 1 ? 's' : ''} today`,
      schoolNames.join(', '),
      'test'
    );
  }
}
