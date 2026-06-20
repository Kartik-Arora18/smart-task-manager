// ── State ──────────────────────────────────────────────────────────────────
let tasks = [];
const STORAGE_KEY = 'stm_tasks_v1';
const THEME_KEY   = 'stm_theme_v1';

// ── DOM refs ───────────────────────────────────────────────────────────────
const taskInput      = document.getElementById('task-input');
const prioritySelect = document.getElementById('priority-select');
const dueDateInput   = document.getElementById('due-date');
const addBtn         = document.getElementById('add-btn');
const searchInput    = document.getElementById('search-input');
const pendingList    = document.getElementById('pending-list');
const completedList  = document.getElementById('completed-list');
const countTotal     = document.getElementById('count-total');
const countPending   = document.getElementById('count-pending');
const countCompleted = document.getElementById('count-completed');
const themeBtn       = document.getElementById('theme-btn');

// ── localStorage ───────────────────────────────────────────────────────────
function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}
function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    tasks = raw ? JSON.parse(raw) : [];
  } catch { tasks = []; }
}

// ── Dark mode ──────────────────────────────────────────────────────────────
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  themeBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
  localStorage.setItem(THEME_KEY, theme);
}
function toggleDarkMode() {
  const current = document.documentElement.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

// ── Add task ───────────────────────────────────────────────────────────────
function addTask() {
  const title = taskInput.value.trim();
  if (!title) {
    taskInput.focus();
    taskInput.style.borderColor = 'var(--red)';
    setTimeout(() => taskInput.style.borderColor = '', 1000);
    return;
  }
  const task = {
    id:        Date.now(),
    title,
    priority:  prioritySelect.value,
    dueDate:   dueDateInput.value,
    completed: false,
    createdAt: new Date().toISOString()
  };
  tasks.unshift(task);
  saveToStorage();
  taskInput.value      = '';
  dueDateInput.value   = '';
  prioritySelect.value = 'medium';
  renderTasks();
}

// ── Delete task ────────────────────────────────────────────────────────────
function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveToStorage();
  renderTasks();
}

// ── Complete / undo ────────────────────────────────────────────────────────
function completeTask(id) {
  const task = tasks.find(t => t.id === id);
  if (task) { task.completed = !task.completed; saveToStorage(); renderTasks(); }
}

// ── Counters ───────────────────────────────────────────────────────────────
function updateCounters() {
  const total     = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  countTotal.textContent     = total;
  countPending.textContent   = total - completed;
  countCompleted.textContent = completed;
}

// ── Build task card ────────────────────────────────────────────────────────
function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function buildCard(task) {
  const div = document.createElement('div');
  div.className = 'task-card' + (task.completed ? ' completed-card' : '');

  let dateHtml = '';
  if (task.dueDate) {
    const due    = new Date(task.dueDate + 'T00:00:00');
    const today  = new Date(); today.setHours(0,0,0,0);
    const isOver = !task.completed && due < today;
    const label  = due.toLocaleDateString(undefined, { month:'short', day:'numeric', year:'numeric' });
    dateHtml = `<span class="task-date ${isOver ? 'overdue' : ''}">📅 ${label}${isOver ? ' (overdue)' : ''}</span>`;
  }

  div.innerHTML = `
    <div class="task-main">
      <div class="task-title">${escapeHtml(task.title)}</div>
      <div class="task-meta">
        <span class="badge badge-${task.priority}">${task.priority}</span>
        ${dateHtml}
      </div>
    </div>
    <div class="task-actions">
      ${task.completed
        ? `<button class="icon-btn" title="Undo"   onclick="completeTask(${task.id})">↩️</button>`
        : `<button class="icon-btn" title="Done"   onclick="completeTask(${task.id})">✔️</button>`}
      <button class="icon-btn" title="Delete" onclick="deleteTask(${task.id})">🗑️</button>
    </div>`;
  return div;
}

// ── Render ─────────────────────────────────────────────────────────────────
function renderTasks() {
  const q = searchInput.value.trim().toLowerCase();
  const filtered = q ? tasks.filter(t => t.title.toLowerCase().includes(q) || t.priority.includes(q)) : tasks;

  const pending   = filtered.filter(t => !t.completed);
  const completed = filtered.filter(t =>  t.completed);

  pendingList.innerHTML   = '';
  completedList.innerHTML = '';

  if (pending.length === 0) {
    pendingList.innerHTML = `<div class="empty"><span class="emoji">🎉</span>${q ? 'No matching pending tasks.' : 'No pending tasks — add one above!'}</div>`;
  } else {
    pending.forEach(t => pendingList.appendChild(buildCard(t)));
  }

  if (completed.length === 0) {
    completedList.innerHTML = `<div class="empty"><span class="emoji">📋</span>${q ? 'No matching completed tasks.' : 'Completed tasks will appear here.'}</div>`;
  } else {
    completed.forEach(t => completedList.appendChild(buildCard(t)));
  }

  updateCounters();
}

// ── Event listeners ────────────────────────────────────────────────────────
addBtn.addEventListener('click', addTask);
taskInput.addEventListener('keydown', e => { if (e.key === 'Enter') addTask(); });
searchInput.addEventListener('input', renderTasks);
themeBtn.addEventListener('click', toggleDarkMode);

// ── Init ───────────────────────────────────────────────────────────────────
loadFromStorage();
applyTheme(localStorage.getItem(THEME_KEY) || 'light');
renderTasks();
