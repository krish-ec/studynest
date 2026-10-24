// ═══════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════
function navigate(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const pageEl = document.getElementById('page-' + page);
  const navBtn = document.getElementById('nav-' + page);
  if (!pageEl) return;
  pageEl.classList.add('active');
  if (navBtn) navBtn.classList.add('active');
  document.body.classList.toggle('focus-mode-active', page === 'focus');

  if (page === 'home') refreshHome();
  if (page === 'planner') renderPlanner();
  if (page === 'notes') renderNotes();
  if (page === 'analytics') renderAnalytics();
  if (page === 'goals') renderGoals();
  if (page === 'settings') renderSettings();
  if (page === 'focus') updateFocusTimer();
  if (page === 'timetable') renderTimetable();
  if (page === 'todo') renderTodos();
  if (page === 'timer') checkNotifPermission();
}

const STORAGE_NOTES = 'studynest_notes';
const STORAGE_GOALS = 'studynest_goals';
const STORAGE_THEME = 'studynest_theme';

// ═══════════════════════════════════
// PLANNER
// ═══════════════════════════════════
function renderPlanner() {
  const now = new Date();
  const todayISO = now.toISOString().split('T')[0];
  const dayStr = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][now.getDay()];
  const tasks = loadTasks().filter(t => !t.completed && (t.dueDate === todayISO || !t.dueDate));
  const classes = loadClasses().filter(c => c.day === dayStr).sort((a, b) => a.startTime.localeCompare(b.startTime));
  const goals = loadGoals();

  const tasksHtml = tasks.length ? tasks.slice(0, 5).map(t => `
    <div class="task-quick-item reveal reveal-left">
      <div class="task-quick-text">${t.title}</div>
    </div>`).join('') : `<div class="empty-state"><div class="empty-icon">✨</div><p>No tasks ready for today. Add one in To-Do.</p></div>`;

  const scheduleHtml = classes.length ? classes.map(c => `
    <div class="today-class-item reveal reveal-right">
      <div class="class-dot" style="background:${c.color}"></div>
      <div class="class-info">
        <div class="class-name">${c.subject}</div>
        <div class="class-time">${fmt12(c.startTime)} – ${fmt12(c.endTime)} ${c.location ? '· ' + c.location : ''}</div>
      </div>
    </div>`).join('') : `<div class="empty-state"><div class="empty-icon">🗓️</div><p>No classes scheduled for today.</p></div>`;

  const completedGoals = goals.filter(g => g.completed).length;
  const goalTotal = goals.length || 1;
  const goalWidth = Math.round((completedGoals / goalTotal) * 100);

  document.getElementById('planner-tasks-summary').innerHTML = tasksHtml;
  document.getElementById('planner-schedule-summary').innerHTML = scheduleHtml;
  document.getElementById('planner-goals-summary').innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px">
      <strong>${completedGoals}</strong>
      <span>of ${goals.length} goals complete</span>
    </div>
    <div class="progress-bar-wrap" style="margin-top:14px">
      <div class="progress-bar-fill" style="width:${goalWidth}%"></div>
    </div>
    ${goals.length === 0 ? '<p style="margin-top:14px;color:var(--muted)">Add a goal in the Goals page to start tracking progress.</p>' : ''}`;
}

// ═══════════════════════════════════
// NOTES
// ═══════════════════════════════════
function renderNotes() {
  const notes = loadNotes();
  const list = document.getElementById('notes-list');
  if (!notes.length) {
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">📝</div><p>No notes yet. Start by writing one above.</p></div>';
    return;
  }
  list.innerHTML = notes.map(note => `
    <div class="task-card reveal reveal-up" style="cursor:default">
      <div class="task-body">
        <div class="task-title">${note.title || 'Untitled note'}</div>
        <div class="task-meta" style="margin-top:6px;gap:6px;flex-wrap:wrap">
          <span class="tag tag-subject">${new Date(note.updatedAt).toLocaleDateString()}</span>
        </div>
        <p style="margin-top:12px;color:var(--muted);white-space:pre-wrap;">${note.body}</p>
      </div>
      <button class="task-delete" onclick="deleteNote('${note.id}')">✕</button>
    </div>`).join('');
}

function saveNote() {
  const title = document.getElementById('note-title').value.trim();
  const body = document.getElementById('note-body').value.trim();
  if (!title && !body) { showToast('Write a note before saving!', 'danger'); return; }
  const notes = loadNotes();
  notes.unshift({ id: uuid(), title, body, updatedAt: new Date().toISOString() });
  localStorage.setItem(STORAGE_NOTES, JSON.stringify(notes));
  document.getElementById('note-title').value = '';
  document.getElementById('note-body').value = '';
  renderNotes();
  showToast('Note saved!', 'success');
}

function deleteNote(id) {
  const notes = loadNotes().filter(note => note.id !== id);
  localStorage.setItem(STORAGE_NOTES, JSON.stringify(notes));
  renderNotes();
  showToast('Note removed.');
}

function clearAllNotes() {
  if (!confirm('Clear all notes?')) return;
  localStorage.removeItem(STORAGE_NOTES);
  renderNotes();
}

function loadNotes() {
  return JSON.parse(localStorage.getItem(STORAGE_NOTES) || '[]');
}

// ═══════════════════════════════════
// ANALYTICS
// ═══════════════════════════════════
function renderAnalytics() {
  updateAnalytics();
}

// ═══════════════════════════════════
// GOALS
// ═══════════════════════════════════
let goals = JSON.parse(localStorage.getItem('goals')) || [];

function saveGoalsList() {
  localStorage.setItem('goals', JSON.stringify(goals));
}

function addGoal() {
  const input = document.getElementById('goal-input');
  if (!input.value.trim()) { showToast('Please enter a goal!', 'danger'); return; }
  goals.unshift({ id: uuid(), text: input.value.trim(), done: false });
  input.value = '';
  saveGoalsList();
  renderGoals();
  showToast('Goal added!', 'success');
}

function toggleGoal(index) {
  goals[index].done = !goals[index].done;
  if (goals[index].done) {
    launchConfetti();
  }
  saveGoalsList();
  renderGoals();
}

function renderGoals() {
  const container = document.getElementById('goals-list');
  if (!container) return;

  if (!goals.length) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">🎯</div><p>No goals yet. Add one to get started.</p></div>';
  } else {
    container.innerHTML = goals.map((g, i) => `
      <div class="task-card">
        <div class="task-check ${g.done ? 'checked' : ''}" onclick="toggleGoal(${i})"></div>
        <div class="task-body">
          <div class="task-title ${g.done ? 'done' : ''}">${g.text}</div>
        </div>
      </div>
    `).join('');
  }
  updateAnalytics();
  updateGoalsSidebar();
}

function loadGoals() {
  return goals;
}

function updateGoalsSidebar() {
  const total = goals.length;
  const done = goals.filter(g => g.done).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
  setEl('goals-ring-pct', pct + '%');
  setEl('goals-total-count', total);
  setEl('goals-done-count', done);
  const bar = document.getElementById('goals-sidebar-bar');
  if (bar) bar.style.width = pct + '%';
}

// ═══════════════════════════════════
// SETTINGS
// ═══════════════════════════════════
function renderSettings() {
  const work = parseInt(document.getElementById('set-work')?.value || document.getElementById('set-work-settings')?.value || 25, 10);
  const short = parseInt(document.getElementById('set-short')?.value || document.getElementById('set-short-settings')?.value || 5, 10);
  const long = parseInt(document.getElementById('set-long')?.value || document.getElementById('set-long-settings')?.value || 15, 10);
  document.getElementById('set-work-settings').value = work;
  document.getElementById('set-short-settings').value = short;
  document.getElementById('set-long-settings').value = long;
  document.getElementById('dark-toggle').checked = localStorage.getItem(STORAGE_THEME) === 'dark';
}

function toggleDarkMode() {
  const enabled = document.getElementById('dark-toggle').checked;
  document.body.classList.toggle('dark-mode', enabled);
  localStorage.setItem(STORAGE_THEME, enabled ? 'dark' : 'light');
}

function resetAppData() {
  showConfirm('Reset all data?', 'This will clear tasks, classes, notes, goals and sessions.', () => {
    localStorage.removeItem('studynest_timetable');
    localStorage.removeItem('studynest_todos');
    localStorage.removeItem('studynest_sessions');
    localStorage.removeItem(STORAGE_NOTES);
    localStorage.removeItem('goals');
    localStorage.removeItem(STORAGE_THEME);
    location.reload();
  });
}

// ═══════════════════════════════════
// FOCUS TIMER SYNC
// ═══════════════════════════════════
function updateFocusTimer() {
  const remaining = Math.max(0, timerState.totalSecs - timerState.elapsed);
  const m = Math.floor(remaining / 60);
  const s = remaining % 60;
  const timeStr = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  const ring = document.getElementById('focus-timer-ring');
  if (ring) {
    const pct = timerState.totalSecs > 0 ? timerState.elapsed / timerState.totalSecs : 0;
    ring.style.strokeDashoffset = TIMER_CIRCUMFERENCE * (1 - pct);
  }
  const display = document.getElementById('focus-timer-display');
  if (display) display.textContent = timeStr;
  const label = document.getElementById('focus-mode-text');
  if (label) label.textContent = timerState.mode === 'work' ? 'Work Session' : timerState.mode === 'short' ? 'Short Break' : 'Long Break';
}

function loadSessions() {
  return JSON.parse(localStorage.getItem('studynest_sessions') || '[]');
}

// ═══════════════════════════════════
// HOME PAGE
// ═══════════════════════════════════
const QUOTES = [
  "The secret of getting ahead is getting started. — Mark Twain",
  "It always seems impossible until it's done. — Nelson Mandela",
  "Education is the most powerful weapon you can use to change the world. — Nelson Mandela",
  "Learning is not attained by chance; it must be sought with ardor and diligence. — Abigail Adams",
  "The more that you read, the more things you will know. — Dr. Seuss",
  "Success is the sum of small efforts repeated day in and day out. — Robert Collier",
  "Don't watch the clock; do what it does. Keep going. — Sam Levenson",
  "Strive for progress, not perfection.",
  "A little progress each day adds up to big results.",
  "Study hard, for the well is deep, and our brains are shallow. — Richard Baxter",
];

function refreshHome() {
  const now = new Date();
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  document.getElementById('hero-date').textContent = `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;

  const h = now.getHours();
  const greeting = h < 12 ? 'Good Morning! ☀️' : h < 17 ? 'Good Afternoon! 🌤️' : 'Good Evening! 🌙';
  document.getElementById('hero-greeting').textContent = greeting;

  const qIdx = now.getDate() % QUOTES.length;
  document.getElementById('hero-quote').textContent = '"' + QUOTES[qIdx] + '"';

  // Today's classes
  const dayStr = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][now.getDay()];
  const classes = loadClasses().filter(c => c.day === dayStr).sort((a,b) => a.startTime.localeCompare(b.startTime));
  const cl = document.getElementById('home-classes-list');
  if (classes.length === 0) {
    cl.innerHTML = '<div class="empty-state"><div class="empty-icon">🗓️</div><p>No classes today.<br>Add some in Timetable!</p></div>';
  } else {
    cl.innerHTML = classes.map(c => `
      <div class="today-class-item">
        <div class="class-dot" style="background:${c.color}"></div>
        <div class="class-info">
          <div class="class-name">${c.subject}</div>
          <div class="class-time">${fmt12(c.startTime)} – ${fmt12(c.endTime)} ${c.location ? '· ' + c.location : ''}</div>
        </div>
      </div>`).join('');
  }

  // Today's tasks
  const todayISO = now.toISOString().split('T')[0];
  const tasks = loadTasks().filter(t => !t.completed && (t.dueDate === todayISO || !t.dueDate)).slice(0,4);
  const tl = document.getElementById('home-tasks-list');
  if (tasks.length === 0) {
    tl.innerHTML = '<div class="empty-state"><div class="empty-icon">📝</div><p>All clear! Add tasks in To-Do.</p></div>';
  } else {
    tl.innerHTML = tasks.map(t => `
      <div class="task-quick-item">
        <div class="task-quick-check ${t.completed?'done':''}" onclick="quickToggleTask('${t.id}',this)"></div>
        <span class="task-quick-text ${t.completed?'done':''}">${t.title}</span>
      </div>`).join('');
  }

  // Sync home timer display with timer settings
  const ws = parseInt(document.getElementById('set-work')?.value || 25);
  document.getElementById('home-timer-preview').textContent = `${String(ws).padStart(2,'0')}:00`;
}

function quickToggleTask(id, el) {
  const tasks = loadTasks();
  const t = tasks.find(t => t.id === id);
  if (t) { t.completed = !t.completed; saveTasks(tasks); }
  el.classList.toggle('done');
  el.nextElementSibling.classList.toggle('done');
}

function fmt12(time24) {
  const [h, m] = time24.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${((h % 12) || 12)}:${String(m).padStart(2,'0')} ${ampm}`;
}

// ═══════════════════════════════════
// TIMETABLE
// ═══════════════════════════════════
const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const DAY_NAMES = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
let weekOffset = 0;
let editingClassId = null;
let selectedColor = '#1B3A6B';

function loadClasses() { return JSON.parse(localStorage.getItem('studynest_timetable') || '[]'); }
function saveClasses(d) { localStorage.setItem('studynest_timetable', JSON.stringify(d)); }

function getWeekDates(offset) {
  const now = new Date();
  const dow = now.getDay();
  const monOffset = (dow === 0) ? -6 : 1 - dow;
  const monday = new Date(now);
  monday.setDate(now.getDate() + monOffset + offset * 7);
  return DAYS.map((_, i) => { const d = new Date(monday); d.setDate(monday.getDate() + i); return d; });
}

function changeWeek(dir) { weekOffset += dir; renderTimetable(); }

function renderTimetable() {
  const dates = getWeekDates(weekOffset);
  const today = new Date();
  const todayISO = today.toISOString().split('T')[0];

  const hdr = document.getElementById('tt-header');
  hdr.innerHTML = '<div class="tt-header-cell"></div>' + dates.map((d, i) => {
    const isToday = d.toISOString().split('T')[0] === todayISO;
    return `<div class="tt-header-cell${isToday ? ' today-col' : ''}">
      <div class="day-name">${DAYS[i]}</div>
      <div class="day-num">${d.getDate()}</div>
    </div>`;
  }).join('');

  const fmt = d => `${d.getDate()}/${d.getMonth()+1}`;
  document.getElementById('week-label').textContent = `${fmt(dates[0])} – ${fmt(dates[6])}`;

  const grid = document.getElementById('tt-grid');
  grid.innerHTML = '';
  const START_H = 7, END_H = 22;
  const classes = loadClasses();

  for (let h = START_H; h < END_H; h++) {
    const tc = document.createElement('div');
    tc.className = 'tt-time-cell';
    tc.textContent = fmt12(`${String(h).padStart(2,'0')}:00`);
    grid.appendChild(tc);

    DAYS.forEach((day, di) => {
      const diso = dates[di].toISOString().split('T')[0];
      const isToday = diso === todayISO;
      const cell = document.createElement('div');
      cell.className = `tt-cell${isToday ? ' today-col' : ''}`;
      cell.setAttribute('data-day', day);
      cell.setAttribute('data-hour', h);

      const slotClasses = classes.filter(c => c.day === day && timeToMins(c.startTime) >= h * 60 && timeToMins(c.startTime) < (h + 1) * 60);
      slotClasses.forEach(cls => {
        const startMins = timeToMins(cls.startTime) - h * 60;
        const durMins = timeToMins(cls.endTime) - timeToMins(cls.startTime);
        const topPct = (startMins / 60) * 100;
        const heightPx = (durMins / 60) * 48;
        const block = document.createElement('div');
        block.className = 'class-block';
        block.style.cssText = `background:${cls.color};top:${topPct}%;height:${heightPx}px;color:#fff`;
        block.innerHTML = `<div class="cb-subject">${cls.subject}</div><div class="cb-time">${fmt12(cls.startTime)}</div>${cls.location ? `<div class="cb-location">📍 ${cls.location}</div>` : ''}`;
        block.onclick = () => openClassModal(cls.id);
        cell.appendChild(block);
      });

      grid.appendChild(cell);
    });
  }

  if (weekOffset === 0) {
    const line = document.getElementById('current-time-line');
    const now = new Date();
    const minsFromStart = (now.getHours() - START_H) * 60 + now.getMinutes();
    if (minsFromStart >= 0 && minsFromStart < (END_H - START_H) * 60) {
      const totalRows = END_H - START_H;
      const pct = minsFromStart / (totalRows * 60);
      const gridHeight = totalRows * 48;
      const todayColIdx = (today.getDay() + 6) % 7;
      const colWidth = 1 / 7;
      line.style.display = 'block';
      line.style.top = (pct * gridHeight) + 'px';
      line.style.left = `calc(60px + ${todayColIdx * colWidth * 100}%)`;
      line.style.right = `calc(${(6 - todayColIdx) * colWidth * 100}%)`;
    } else {
      document.getElementById('current-time-line').style.display = 'none';
    }
  } else {
    document.getElementById('current-time-line').style.display = 'none';
  }
}

function timeToMins(t) { const [h,m] = t.split(':').map(Number); return h*60+m; }

function openClassModal(id = null) {
  editingClassId = id;
  const modal = document.getElementById('class-modal');
  const deleteBtn = document.getElementById('cls-delete-btn');
  document.getElementById('class-modal-title').textContent = id ? 'Edit Class' : 'Add Class';
  deleteBtn.style.display = id ? 'inline-flex' : 'none';

  if (id) {
    const cls = loadClasses().find(c => c.id === id);
    if (cls) {
      document.getElementById('cls-subject').value = cls.subject;
      document.getElementById('cls-day').value = cls.day;
      document.getElementById('cls-start').value = cls.startTime;
      document.getElementById('cls-end').value = cls.endTime;
      document.getElementById('cls-location').value = cls.location || '';
      selectedColor = cls.color;
      document.querySelectorAll('.color-opt').forEach(o => {
        o.classList.toggle('selected', o.dataset.color === cls.color);
      });
    }
  } else {
    document.getElementById('cls-subject').value = '';
    document.getElementById('cls-start').value = '09:00';
    document.getElementById('cls-end').value = '10:00';
    document.getElementById('cls-location').value = '';
    selectedColor = '#1B3A6B';
    document.querySelectorAll('.color-opt').forEach((o,i) => o.classList.toggle('selected', i===0));
  }

  modal.classList.add('open');
}

function closeClassModal() { document.getElementById('class-modal').classList.remove('open'); }

function selectColor(el) {
  document.querySelectorAll('.color-opt').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
  selectedColor = el.dataset.color;
}

function saveClass() {
  const subject = document.getElementById('cls-subject').value.trim();
  const day = document.getElementById('cls-day').value;
  const startTime = document.getElementById('cls-start').value;
  const endTime = document.getElementById('cls-end').value;
  const location = document.getElementById('cls-location').value.trim();

  if (!subject) { showToast('Subject name is required!', 'danger'); return; }
  if (!startTime || !endTime) { showToast('Please set start and end time!', 'danger'); return; }
  if (startTime >= endTime) { showToast('Start time must be before end time!', 'danger'); return; }

  const classes = loadClasses();
  if (editingClassId) {
    const idx = classes.findIndex(c => c.id === editingClassId);
    if (idx > -1) classes[idx] = { ...classes[idx], subject, day, startTime, endTime, location, color: selectedColor };
  } else {
    if (classes.length >= 20) { showToast('Maximum 20 class slots reached!', 'danger'); return; }
    classes.push({ id: uuid(), subject, day, startTime, endTime, location, color: selectedColor });
  }

  saveClasses(classes);
  closeClassModal();
  renderTimetable();
  showToast(editingClassId ? 'Class updated!' : 'Class added! 📅', 'success');
}

function deleteClass() {
  showConfirm('Delete Class?', 'This class slot will be permanently removed.', () => {
    const classes = loadClasses().filter(c => c.id !== editingClassId);
    saveClasses(classes);
    closeClassModal();
    renderTimetable();
    showToast('Class deleted.', 'default');
  });
}

// ═══════════════════════════════════
// TO-DO
// ═══════════════════════════════════
let todoFilter = 'all';

function loadTasks() { return JSON.parse(localStorage.getItem('studynest_todos') || '[]'); }
function saveTasks(d) { localStorage.setItem('studynest_todos', JSON.stringify(d)); }

function addTask() {
  const title = document.getElementById('todo-input').value.trim();
  if (!title) { showToast('Please enter a task title!', 'danger'); return; }
  const tasks = loadTasks();
  if (tasks.filter(t => !t.completed).length >= 100) { showToast('Maximum 100 active tasks!', 'danger'); return; }
  tasks.unshift({
    id: uuid(),
    title,
    subject: document.getElementById('todo-subject').value.trim(),
    dueDate: document.getElementById('todo-due').value,
    priority: document.getElementById('todo-priority').value,
    completed: false,
    createdAt: new Date().toISOString()
  });
  saveTasks(tasks);
  document.getElementById('todo-input').value = '';
  document.getElementById('todo-subject').value = '';
  document.getElementById('todo-due').value = '';
  renderTodos();
  showToast('Task added! ✅', 'success');
}

function toggleTask(id) {
  const tasks = loadTasks();
  const t = tasks.find(t => t.id === id);
  if (t) { t.completed = !t.completed; t.completedAt = t.completed ? new Date().toISOString() : null; }
  saveTasks(tasks);
  renderTodos();
}

function deleteTask(id) {
  showConfirm('Delete Task?', 'This task will be permanently removed.', () => {
    saveTasks(loadTasks().filter(t => t.id !== id));
    renderTodos();
    showToast('Task deleted.');
  });
}

function clearCompleted() {
  const tasks = loadTasks();
  const completed = tasks.filter(t => t.completed);
  if (completed.length === 0) { showToast('No completed tasks to clear!'); return; }
  showConfirm('Clear Completed?', `Remove all ${completed.length} completed task(s)?`, () => {
    saveTasks(tasks.filter(t => !t.completed));
    renderTodos();
    showToast('Completed tasks cleared!', 'success');
  });
}

function setFilter(f, el) {
  todoFilter = f;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  renderTodos();
}

function renderTodos() {
  const tasks = loadTasks();
  const now = new Date();
  const todayISO = now.toISOString().split('T')[0];

  const todayAll = tasks.filter(t => t.dueDate === todayISO);
  const todayDone = todayAll.filter(t => t.completed).length;
  const pct = todayAll.length ? Math.round(todayDone / todayAll.length * 100) : 0;
  document.getElementById('progress-text').textContent = `${todayDone} of ${todayAll.length} tasks completed today`;
  document.getElementById('progress-pct').textContent = pct + '%';
  document.getElementById('progress-fill').style.width = pct + '%';

  let filtered = tasks;
  if (todoFilter === 'today') filtered = tasks.filter(t => !t.completed && t.dueDate === todayISO);
  else if (todoFilter === 'upcoming') filtered = tasks.filter(t => !t.completed && t.dueDate && t.dueDate > todayISO);
  else if (todoFilter === 'completed') filtered = tasks.filter(t => t.completed);
  else filtered = tasks.filter(t => !t.completed);

  const todayGroup = filtered.filter(t => !t.completed && (t.dueDate === todayISO || !t.dueDate));
  const upcomingGroup = filtered.filter(t => !t.completed && t.dueDate && t.dueDate > todayISO);
  const overdueGroup = filtered.filter(t => !t.completed && t.dueDate && t.dueDate < todayISO);
  const completedGroup = filtered.filter(t => t.completed);

  const container = document.getElementById('todo-list-container');
  let html = '';

  if (todoFilter === 'all' || todoFilter === 'today') {
    if (overdueGroup.length) html += renderTaskGroup('⚠️ Overdue', overdueGroup, todayISO, true);
    if (todayGroup.length) html += renderTaskGroup('📅 Today', todayGroup, todayISO, false);
    else if (!overdueGroup.length && todoFilter === 'today') html += `<div class="empty-state"><div class="empty-icon">🎉</div><p>All caught up! No tasks for today.</p></div>`;
  }
  if (todoFilter === 'upcoming' || todoFilter === 'all') {
    if (upcomingGroup.length) html += renderTaskGroup('📆 Upcoming', upcomingGroup, todayISO, false);
    else if (todoFilter === 'upcoming') html += `<div class="empty-state"><div class="empty-icon">📅</div><p>No upcoming tasks.</p></div>`;
  }
  if (todoFilter === 'completed') {
    if (completedGroup.length) html += renderTaskGroup('✅ Completed', completedGroup, todayISO, false);
    else html += `<div class="empty-state"><div class="empty-icon">💪</div><p>No completed tasks yet.</p></div>`;
  }
  if (todoFilter === 'all' && completedGroup.length) html += renderTaskGroup('✅ Completed', completedGroup, todayISO, false);

  if (!html) html = `<div class="empty-state" style="padding:48px 20px"><div class="empty-icon">📝</div><p>No tasks here.<br>Start by adding one above!</p></div>`;

  container.innerHTML = html;
}

function renderTaskGroup(label, tasks, todayISO, isOverdue) {
  const cards = tasks.map(t => {
    const overdue = !t.completed && t.dueDate && t.dueDate < todayISO;
    return `<div class="task-card priority-${t.priority}${overdue ? ' overdue' : ''}">
      <div class="task-check${t.completed ? ' checked' : ''}" onclick="toggleTask('${t.id}')"></div>
      <div class="task-body">
        <div class="task-title${t.completed ? ' done' : ''}">${t.title}</div>
        <div class="task-meta">
          ${t.subject ? `<span class="tag tag-subject">${t.subject}</span>` : ''}
          ${t.dueDate ? `<span class="tag ${overdue ? 'tag-overdue' : 'tag-date'}">📅 ${formatDate(t.dueDate)}</span>` : ''}
          <span class="tag tag-date">${t.priority} priority</span>
        </div>
      </div>
      <button class="task-delete" onclick="deleteTask('${t.id}')">✕</button>
    </div>`;
  }).join('');
  return `<div class="todo-section-label">${label}</div>${cards}`;
}

function formatDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// ═══════════════════════════════════
// POMODORO TIMER
// ═══════════════════════════════════
const TIMER_CIRCUMFERENCE = 2 * Math.PI * 108; // 678.6
let timerInterval = null;
let timerState = {
  mode: 'work',
  running: false,
  elapsed: 0,
  totalSecs: 25 * 60,
  pomodorosThisRound: 0,
  totalPomodoros: 0
};

function getSettings() {
  const work = parseInt(document.getElementById('set-work-settings')?.value || document.getElementById('set-work')?.value || 25, 10);
  const short = parseInt(document.getElementById('set-short-settings')?.value || document.getElementById('set-short')?.value || 5, 10);
  const long = parseInt(document.getElementById('set-long-settings')?.value || document.getElementById('set-long')?.value || 15, 10);
  return { work: work * 60, short: short * 60, long: long * 60 };
}

function applySettings() {
  if (!timerState.running) {
    const s = getSettings();
    timerState.totalSecs = s[timerState.mode];
    timerState.elapsed = 0;
    updateTimerDisplay();
  }
}

function setTimerMode(mode, el) {
  if (timerState.running) { showToast('Stop the timer first to change mode!'); return; }
  timerState.mode = mode;
  timerState.elapsed = 0;
  const s = getSettings();
  timerState.totalSecs = s[mode];
  document.querySelectorAll('.timer-mode-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('timer-mode-text').textContent = mode === 'work' ? 'Work Session' : mode === 'short' ? 'Short Break' : 'Long Break';
  document.getElementById('timer-ring').style.stroke = mode === 'work' ? 'var(--accent)' : mode === 'short' ? 'var(--success)' : 'var(--primary)';
  updateTimerDisplay();
}

function toggleTimer() {
  if (timerState.running) {
    clearInterval(timerInterval);
    timerState.running = false;
    document.getElementById('timer-play-btn').textContent = '▶';
  } else {
    timerState.running = true;
    document.getElementById('timer-play-btn').textContent = '⏸';
    timerInterval = setInterval(timerTick, 1000);
  }
}

function timerTick() {
  timerState.elapsed++;
  updateTimerDisplay();
  if (timerState.elapsed >= timerState.totalSecs) {
    clearInterval(timerInterval);
    timerState.running = false;
    onSessionEnd();
  }
}

function updateTimerDisplay() {
  const remaining = Math.max(0, timerState.totalSecs - timerState.elapsed);
  const m = Math.floor(remaining / 60);
  const s = remaining % 60;
  const timeStr = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  document.getElementById('timer-display').textContent = timeStr;
  document.title = `${timeStr} — ${timerState.mode === 'work' ? 'Work Session' : 'Break'} | StudyNest`;

  const pct = timerState.totalSecs > 0 ? timerState.elapsed / timerState.totalSecs : 0;
  const offset = TIMER_CIRCUMFERENCE * (1 - pct);
  document.getElementById('timer-ring').style.strokeDashoffset = offset;
  const focusRing = document.getElementById('focus-timer-ring');
  if (focusRing) focusRing.style.strokeDashoffset = offset;
  const focusDisplay = document.getElementById('focus-timer-display');
  if (focusDisplay) focusDisplay.textContent = timeStr;
  const focusLabel = document.getElementById('focus-mode-text');
  if (focusLabel) focusLabel.textContent = timerState.mode === 'work' ? 'Work Session' : timerState.mode === 'short' ? 'Short Break' : 'Long Break';

  document.getElementById('timer-play-btn').textContent = timerState.running ? '⏸' : '▶';
}

function resetTimer() {
  clearInterval(timerInterval);
  timerState.running = false;
  timerState.elapsed = 0;
  document.getElementById('timer-play-btn').textContent = '▶';
  updateTimerDisplay();
}

function skipSession() {
  clearInterval(timerInterval);
  timerState.running = false;
  timerState.elapsed = 0;
  advanceMode();
  updateTimerDisplay();
}

function onSessionEnd() {
  document.getElementById('timer-play-btn').textContent = '▶';
  playChime();
  logSession();

  const msgs = {
    work: { title: 'Time for a break! 🍅', body: 'Great work! A short break is starting.' },
    short: { title: 'Back to work!', body: "Break's over. Start your next Pomodoro." },
    long: { title: "Refreshed? Let's go!", body: 'Long break complete. Ready for another round?' }
  };
  const msg = msgs[timerState.mode];
  sendNotification(msg.title, msg.body);
  showToast(`${msg.title} ${msg.body}`, 'accent');

  if (timerState.mode === 'work') {
    timerState.pomodorosThisRound++;
    timerState.totalPomodoros++;
    updateDots();
  }

  setTimeout(() => advanceMode(), 1500);
}

function advanceMode() {
  const s = getSettings();
  if (timerState.mode === 'work') {
    if (timerState.pomodorosThisRound >= 4) {
      timerState.mode = 'long';
      timerState.pomodorosThisRound = 0;
      document.getElementById('timer-mode-text').textContent = 'Long Break';
      document.getElementById('timer-ring').style.stroke = 'var(--primary)';
      document.querySelectorAll('.timer-mode-tab').forEach((t,i) => t.classList.toggle('active', i===2));
    } else {
      timerState.mode = 'short';
      document.getElementById('timer-mode-text').textContent = 'Short Break';
      document.getElementById('timer-ring').style.stroke = 'var(--success)';
      document.querySelectorAll('.timer-mode-tab').forEach((t,i) => t.classList.toggle('active', i===1));
    }
  } else {
    timerState.mode = 'work';
    document.getElementById('timer-mode-text').textContent = 'Work Session';
    document.getElementById('timer-ring').style.stroke = 'var(--accent)';
    document.querySelectorAll('.timer-mode-tab').forEach((t,i) => t.classList.toggle('active', i===0));
    if (timerState.pomodorosThisRound >= 4) timerState.pomodorosThisRound = 0;
  }
  timerState.totalSecs = s[timerState.mode];
  timerState.elapsed = 0;
  updateTimerDisplay();
  updateDots();
}

function updateDots() {
  const dots = document.querySelectorAll('.pom-dot');
  const completed = timerState.pomodorosThisRound % 5;
  dots.forEach((d, i) => d.classList.toggle('done', i < completed));
}

function logSession() {
  const sessions = JSON.parse(localStorage.getItem('studynest_sessions') || '[]');
  const todayISO = new Date().toISOString().split('T')[0];
  const todaySessions = sessions.filter(s => s.date === todayISO);
  todaySessions.unshift({
    type: timerState.mode,
    duration: Math.round(timerState.totalSecs / 60),
    endTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    date: todayISO,
    no: timerState.totalPomodoros
  });
  localStorage.setItem('studynest_sessions', JSON.stringify([...todaySessions, ...sessions.filter(s => s.date !== todayISO)]));
  renderSessionLog();
}

function renderSessionLog() {
  const todayISO = new Date().toISOString().split('T')[0];
  const sessions = JSON.parse(localStorage.getItem('studynest_sessions') || '[]').filter(s => s.date === todayISO);
  const log = document.getElementById('session-log');
  if (!sessions.length) {
    log.innerHTML = '<div class="empty-state" style="padding:20px 0"><div class="empty-icon">⏱️</div><p>No sessions yet.<br>Start your first Pomodoro!</p></div>';
    return;
  }
  log.innerHTML = sessions.map(s => `
    <div class="session-log-item">
      <span class="session-badge badge-${s.type === 'work' ? 'work' : s.type === 'short' ? 'break' : 'long'}">
        ${s.type === 'work' ? 'Work' : s.type === 'short' ? 'Short Break' : 'Long Break'}
      </span>
      <span style="flex:1;font-size:0.8rem;color:var(--muted)">${s.duration} min</span>
      <span style="font-size:0.78rem;color:var(--muted)">${s.endTime}</span>
    </div>`).join('');
}

function clearSessionLog() {
  const todayISO = new Date().toISOString().split('T')[0];
  const all = JSON.parse(localStorage.getItem('studynest_sessions') || '[]');
  localStorage.setItem('studynest_sessions', JSON.stringify(all.filter(s => s.date !== todayISO)));
  renderSessionLog();
  showToast('Session log cleared.');
}

function playChime() {
  if (document.getElementById('mute-toggle')?.checked) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.15);
      gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + i * 0.15 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.6);
      osc.start(ctx.currentTime + i * 0.15);
      osc.stop(ctx.currentTime + i * 0.15 + 0.65);
    });
  } catch(e) {}
}

function sendNotification(title, body) {
  if (Notification.permission === 'granted') {
    new Notification(title, { body, icon: '🍅' });
  }
}

function requestNotifPerm() {
  Notification.requestPermission().then(p => {
    if (p === 'granted') {
      document.getElementById('notif-banner').style.display = 'none';
      showToast('Notifications enabled! 🔔', 'success');
    } else {
      showToast('Notification permission denied. Check browser settings.');
    }
  });
}

function checkNotifPermission() {
  const banner = document.getElementById('notif-banner');
  if (!('Notification' in window) || Notification.permission === 'granted') {
    banner.style.display = 'none';
  } else {
    banner.style.display = 'flex';
  }
  renderSessionLog();
}

// Spacebar shortcut for timer
document.addEventListener('keydown', e => {
  if (e.code === 'Space' && document.getElementById('page-timer').classList.contains('active')) {
    e.preventDefault();
    toggleTimer();
  }
});

// ═══════════════════════════════════
// ANALYTICS (CHART.JS)
// ═══════════════════════════════════
function updateAnalytics() {
  const total = goals.length;
  const completed = goals.filter(g => g.done).length;
  const pending = total - completed;
  const percent = total ? Math.round((completed / total) * 100) : 0;

  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
  setEl('total-goals', total);
  setEl('completed-goals', completed);
  setEl('progress-percent', percent + '%');

  setEl('goals-ring-pct', percent + '%');
  setEl('goals-total-count', total);
  setEl('goals-done-count', completed);
  const sideBar = document.getElementById('goals-sidebar-bar');
  if (sideBar) sideBar.style.width = percent + '%';

  const bar = document.getElementById('analytics-bar');
  if (bar) bar.style.width = percent + '%';
  const barPend = document.getElementById('analytics-bar-pending');
  if (barPend) barPend.style.width = (total ? Math.round((pending / total) * 100) : 0) + '%';

  setEl('an-completed-label', completed);
  setEl('an-pending-label', pending);
  setEl('an-donut-pct', percent + '%');

  let msg = '';
  if (percent === 100) msg = '🔥 Perfect! All goals completed!';
  else if (percent > 70) msg = '💪 Great job! Keep pushing!';
  else if (percent > 40) msg = '👍 You\'re doing well!';
  else msg = '🚀 Start completing your goals!';
  setEl('analytics-message', msg);

  if (typeof Chart !== 'undefined') {
    if (window.chart) window.chart.destroy();
    const ctx = document.getElementById('goalsChart');
    if (ctx) {
      window.chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Completed', 'Pending'],
          datasets: [{
            data: [completed || 0, pending || (total ? pending : 1)],
            backgroundColor: ['#2E8B57', '#DDD5C0'],
            borderWidth: 0
          }]
        },
        options: {
          cutout: '72%',
          plugins: { legend: { display: false } }
        }
      });
    }
  }
}

// ═══════════════════════════════════
// CONFETTI
// ═══════════════════════════════════
function launchConfetti() {
  const duration = 1500;
  const end = Date.now() + duration;

  function frame() {
    confetti({ particleCount: 6, angle: 60, spread: 70, origin: { x: 0 }, colors: ['#E8A020', '#1B3A6B', '#2E8B57'] });
    confetti({ particleCount: 6, angle: 120, spread: 70, origin: { x: 1 }, colors: ['#E8A020', '#1B3A6B', '#2E8B57'] });
    if (Date.now() < end) requestAnimationFrame(frame);
  }

  frame();
  setTimeout(() => {
    confetti({ particleCount: 120, spread: 100, origin: { y: 0.6 } });
  }, 1500);
}

// ═══════════════════════════════════
// UTILITIES
// ═══════════════════════════════════
function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random()*16|0;
    return (c==='x' ? r : (r&0x3|0x8)).toString(16);
  });
}

function showToast(msg, type = 'default') {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast${type === 'success' ? ' toast-success' : type === 'accent' ? ' toast-accent' : ''}`;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

let confirmCb = null;
function showConfirm(title, msg, cb) {
  confirmCb = cb;
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-msg').textContent = msg;
  document.getElementById('confirm-overlay').classList.add('open');
  document.getElementById('confirm-ok').onclick = () => { closeConfirm(); if (confirmCb) confirmCb(); };
}
function closeConfirm() { document.getElementById('confirm-overlay').classList.remove('open'); }

document.getElementById('class-modal').addEventListener('click', function(e) { if (e.target === this) closeClassModal(); });
document.getElementById('confirm-overlay').addEventListener('click', function(e) { if (e.target === this) closeConfirm(); });

// ═══════════════════════════════════
// UI EFFECTS & ANIMATIONS
// ═══════════════════════════════════
function initUIEffects() {
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const lerp = (current, target, ease = 0.08) => current + (target - current) * ease;

  const autoRevealSelectors = [
    '.page-header', '.card', '.todo-top', '.timer-main-card', '.timetable-wrap',
    '.planner-panel', '.notes-panel', '.analytics-panel', '.goals-panel', '.settings-panel', '.focus-card',
    '.story-scroll-section', '.focus-tunnel-section'
  ];
  const revealTargets = [...new Set(autoRevealSelectors.flatMap(sel => Array.from(document.querySelectorAll(sel))))];
  revealTargets.forEach((el, idx) => {
    el.classList.add('reveal');
    el.style.setProperty('--reveal-delay', `${(idx % 8) * 0.06}s`);
  });

  document.querySelectorAll('.home-grid, .timer-controls, .todo-extra-row, .settings-grid').forEach(group => {
    group.querySelectorAll('.reveal').forEach((el, index) => el.style.setProperty('--reveal-order', index));
  });

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.18 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  const heroEntrance = document.querySelector('.hero-entrance');
  if (heroEntrance) requestAnimationFrame(() => heroEntrance.classList.add('visible'));

  const ring = document.getElementById('cursor-ring');
  const dot = document.getElementById('cursor-dot');
  const interactiveSelector = 'button, .nav-btn, .btn, .btn-timer, .task-card, .class-block, .color-opt, .week-nav button, .filter-btn, .timer-mode-tab';
  const mainScroll = document.getElementById('main');

  const storySection = document.querySelector('.story-scroll-section');
  const focusSection = document.querySelector('.focus-tunnel-section');
  const storyStages = storySection ? Array.from(storySection.querySelectorAll('.story-stage')) : [];
  const focusInner = focusSection ? focusSection.querySelector('.focus-tunnel-inner') : null;
  const storyDots = storySection ? Array.from(storySection.querySelectorAll('.story-dot')) : [];

  let cursorX = 0, cursorY = 0, cursorTick = false, rafId = null;
  let targetStoryProgress = 0, currentStoryProgress = 0;
  let targetTunnelProgress = 0, currentTunnelProgress = 0;

  const updateCursor = () => {
    ring.style.left = `${cursorX}px`;
    ring.style.top = `${cursorY}px`;
    dot.style.left = `${cursorX}px`;
    dot.style.top = `${cursorY}px`;
    cursorTick = false;
  };

  const getProgress = (section) => {
    if (!section) return 0;
    const rect = section.getBoundingClientRect();
    const vh = window.innerHeight;
    const raw = (vh - rect.top) / (rect.height - vh);
    return clamp(raw * 0.96, 0, 1);
  };

  const isStorySectionVisible = () => {
    if (!storySection) return false;
    const rect = storySection.getBoundingClientRect();
    return rect.top <= window.innerHeight * 0.2 && rect.bottom >= window.innerHeight * 0.3;
  };

  let currentStoryStep = 0;
  let storyScrollLocked = false;
  let storyDebounce = false;

  const setStoryStep = (step) => {
    const clampedStep = Math.max(0, Math.min(step, storyStages.length - 1));
    if (clampedStep === currentStoryStep) return;
    currentStoryStep = clampedStep;
    storyStages.forEach((stage, index) => stage.classList.toggle('active', index === currentStoryStep));
    storyDots.forEach((dot, idx) => dot.classList.toggle('active', idx === currentStoryStep));
  };

  const lockStoryScroll = () => {
    if (storyScrollLocked) return;
    storyScrollLocked = true;
    document.body.style.overflow = 'hidden';
    if (mainScroll) mainScroll.style.overflow = 'hidden';
  };

  const unlockStoryScroll = () => {
    if (!storyScrollLocked) return;
    storyScrollLocked = false;
    document.body.style.overflow = '';
    if (mainScroll) mainScroll.style.overflow = 'auto';
  };

  const updateStoryLockState = () => {
    if (!storySection) return;
    if (isStorySectionVisible() && currentStoryStep < storyStages.length - 1) {
      lockStoryScroll();
      storyStages.forEach((stage, index) => stage.classList.toggle('active', index === currentStoryStep));
      storyDots.forEach((dot, idx) => dot.classList.toggle('active', idx === currentStoryStep));
    } else {
      unlockStoryScroll();
    }
  };

  const handleStoryWheel = (event) => {
    if (!storyScrollLocked || storyDebounce) return;
    const delta = event.deltaY;
    if (delta > 20) {
      event.preventDefault();
      if (currentStoryStep < storyStages.length - 1) {
        storyDebounce = true;
        setStoryStep(currentStoryStep + 1);
        window.setTimeout(() => { storyDebounce = false; }, 350);
        if (currentStoryStep === storyStages.length - 1) {
          unlockStoryScroll();
          if (mainScroll) mainScroll.scrollBy({ top: 120, behavior: 'smooth' });
        }
      }
    } else if (delta < -20 && currentStoryStep > 0) {
      event.preventDefault();
      storyDebounce = true;
      setStoryStep(currentStoryStep - 1);
      window.setTimeout(() => { storyDebounce = false; }, 350);
    }
  };

  const storyObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.target === storySection) {
        if (entry.isIntersecting) updateStoryLockState();
        else unlockStoryScroll();
      }
    });
  }, { threshold: 0.35 });

  if (storySection) storyObserver.observe(storySection);
  if (mainScroll) mainScroll.addEventListener('wheel', handleStoryWheel, { passive: false });
  window.addEventListener('resize', updateStoryLockState);
  setStoryStep(0);

  const updateFocusTransforms = () => {
    if (!focusSection || !focusInner) return;
    focusInner.style.opacity = '1';
    focusInner.style.transform = 'none';
  };

  const animateScene = () => {
    currentStoryProgress = lerp(currentStoryProgress, targetStoryProgress, 0.08);
    currentTunnelProgress = lerp(currentTunnelProgress, targetTunnelProgress, 0.08);
    updateFocusTransforms();
    if (Math.abs(currentStoryProgress - targetStoryProgress) > 0.001 || Math.abs(currentTunnelProgress - targetTunnelProgress) > 0.001) {
      rafId = requestAnimationFrame(animateScene);
    } else {
      rafId = null;
    }
  };

  const refreshTargets = () => {
    targetStoryProgress = getProgress(storySection);
    targetTunnelProgress = getProgress(focusSection);
    if (rafId === null) rafId = requestAnimationFrame(animateScene);
  };

  document.addEventListener('mousemove', e => {
    cursorX = e.clientX;
    cursorY = e.clientY;
    if (!cursorTick) { cursorTick = true; requestAnimationFrame(updateCursor); }
    const px = (e.clientX / window.innerWidth - 0.5) * 18;
    const py = (e.clientY / window.innerHeight - 0.5) * 18;
    document.documentElement.style.setProperty('--parallax-x', `${px}px`);
    document.documentElement.style.setProperty('--parallax-y', `${py}px`);
  });

  if (mainScroll) {
    mainScroll.addEventListener('scroll', () => {
      const offset = Math.min(18, mainScroll.scrollTop * 0.02);
      document.documentElement.style.setProperty('--scroll-offset', `${offset}px`);
      refreshTargets();
    }, { passive: true });
  }

  window.addEventListener('resize', refreshTargets);

  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) refreshTargets(); });
  }, { root: mainScroll, threshold: 0.2 });

  if (storySection) sectionObserver.observe(storySection);
  if (focusSection) sectionObserver.observe(focusSection);

  document.addEventListener('mousedown', () => {
    dot.style.transform = 'translate(-50%, -50%) scale(0.75)';
    ring.style.transform = 'translate(-50%, -50%) scale(0.88)';
  });
  document.addEventListener('mouseup', () => {
    dot.style.transform = 'translate(-50%, -50%) scale(1)';
    ring.style.transform = 'translate(-50%, -50%) scale(1)';
  });

  document.querySelectorAll(interactiveSelector).forEach(el => {
    el.addEventListener('mouseenter', () => {
      ring.style.width = '52px'; ring.style.height = '52px';
      ring.style.borderColor = 'rgba(232,160,32,0.95)';
      dot.style.background = 'rgba(255,255,255,0.95)';
    });
    el.addEventListener('mouseleave', () => {
      ring.style.width = '40px'; ring.style.height = '40px';
      ring.style.borderColor = 'rgba(27,58,107,0.75)';
      dot.style.background = 'rgba(232,160,32,0.95)';
    });
  });

  window.addEventListener('mouseout', e => {
    if (!e.relatedTarget) { dot.style.opacity = '0'; ring.style.opacity = '0.35'; }
  });
  window.addEventListener('mouseover', () => { dot.style.opacity = '1'; ring.style.opacity = '1'; });

  refreshTargets();
  setTimeout(() => document.body.classList.remove('loading'), 600);
}

// ═══════════════════════════════════
// INIT
// ═══════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem(STORAGE_THEME) === 'dark') {
    document.body.classList.add('dark-mode');
  }

  initUIEffects();
  renderGoals();
  renderSettings();
  refreshHome();
  updateTimerDisplay();

  document.getElementById('todo-due').value = new Date().toISOString().split('T')[0];

  const wd = getWeekDates(0);
  document.getElementById('week-label').textContent = `${wd[0].getDate()}/${wd[0].getMonth()+1} – ${wd[6].getDate()}/${wd[6].getMonth()+1}`;
});
