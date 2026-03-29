// ── Data Layer ──
const STORAGE_KEY = "taskflow_tasks";

function loadTasks() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveTasks(tasks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function generateId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

// ── State ──
let tasks = loadTasks();
let editingTaskId = null;
let selectedTaskId = null;

// ── DOM References ──
const taskList = document.getElementById("taskList");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const priorityFilter = document.getElementById("priorityFilter");
const sortBy = document.getElementById("sortBy");
const taskModal = document.getElementById("taskModal");
const taskForm = document.getElementById("taskForm");
const modalTitle = document.getElementById("modalTitle");
const openModalBtn = document.getElementById("openModalBtn");
const emptyAddBtn = document.getElementById("emptyAddBtn");
const closeModalBtn = document.getElementById("closeModalBtn");
const cancelBtn = document.getElementById("cancelBtn");
const saveTaskBtn = document.getElementById("saveTaskBtn");
const toast = document.getElementById("toast");
const detailEmpty = document.getElementById("detailEmpty");
const detailView = document.getElementById("detailView");

// ── Helpers ──
const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDateShort(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function showToast(message) {
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    toast.hidden = true;
  }, 2500);
}

// ── Filtering & Sorting ──
function getFilteredTasks() {
  const search = searchInput.value.toLowerCase().trim();
  const status = statusFilter.value;
  const priority = priorityFilter.value;
  const sort = sortBy.value;

  let filtered = tasks.filter((t) => {
    if (status !== "all" && t.status !== status) return false;
    if (priority !== "all" && t.priority !== priority) return false;
    if (search && !t.title.toLowerCase().includes(search) && !(t.description || "").toLowerCase().includes(search)) {
      return false;
    }
    return true;
  });

  filtered.sort((a, b) => {
    switch (sort) {
      case "due-asc":
        return (a.dueDate || "9999") > (b.dueDate || "9999") ? 1 : -1;
      case "due-desc":
        return (a.dueDate || "") < (b.dueDate || "") ? 1 : -1;
      case "priority-desc":
        return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      case "title-asc":
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });

  return filtered;
}

// ── Rendering ──
function renderTaskList() {
  const filtered = getFilteredTasks();

  if (tasks.length === 0) {
    emptyState.hidden = false;
    taskList.innerHTML = "";
    return;
  }

  emptyState.hidden = true;

  if (filtered.length === 0) {
    taskList.innerHTML = `<li class="empty"><div class="empty__title">No matching tasks</div><p class="empty__text">Try adjusting your filters or search.</p></li>`;
    return;
  }

  taskList.innerHTML = filtered
    .map(
      (t) => `
    <li class="task-card is-entering" data-task-id="${t.id}">
      <div class="task-card__row">
        <label class="checkbox">
          <input type="checkbox" aria-label="Mark task complete" ${t.status === "done" ? "checked" : ""} data-check-id="${t.id}" />
          <span class="checkbox__box" aria-hidden="true"></span>
        </label>
        <div class="task-card__meta">
          <div class="task-card__title">${escapeHtml(t.title)}</div>
          <div class="task-card__sub">
            <span class="badge">${escapeHtml(t.priority)}</span>
            <span class="dot" aria-hidden="true">•</span>
            <span>${formatDateShort(t.dueDate)}</span>
            <span class="dot" aria-hidden="true">•</span>
            <span>${escapeHtml(t.status)}</span>
          </div>
        </div>
      </div>
      <div class="task-card__actions">
        <button class="btn btn--ghost" type="button" data-select-id="${t.id}">View</button>
        <button class="btn btn--ghost" type="button" data-edit-id="${t.id}">Edit</button>
        <button class="btn btn--ghost btn--danger" type="button" data-delete-id="${t.id}">Delete</button>
      </div>
    </li>`
    )
    .join("");
}

function renderDetail(task) {
  if (!task) {
    detailEmpty.hidden = false;
    detailView.hidden = true;
    return;
  }

  detailEmpty.hidden = true;
  detailView.hidden = false;

  detailView.querySelector(".detail__title").textContent = task.title;
  detailView.querySelector(".detail__badges").innerHTML =
    `<span class="pill">${escapeHtml(task.status)}</span><span class="pill">${escapeHtml(task.priority)}</span>`;

  const grid = detailView.querySelector(".detail__grid");
  grid.innerHTML = `
    <div class="kv"><dt>Due</dt><dd>${formatDate(task.dueDate)}</dd></div>
    <div class="kv"><dt>Tags</dt><dd>${task.tags ? escapeHtml(task.tags) : "—"}</dd></div>
    <div class="kv"><dt>Estimate</dt><dd>${task.estimate ? task.estimate + " min" : "—"}</dd></div>
  `;

  detailView.querySelector(".detail__desc").textContent = task.description || "No description.";

  selectedTaskId = task.id;
}

// ── Modal ──
function openModal(task) {
  if (task) {
    editingTaskId = task.id;
    modalTitle.textContent = "Edit Task";
    saveTaskBtn.textContent = "Update Task";
    taskForm.title.value = task.title;
    taskForm.description.value = task.description || "";
    taskForm.priority.value = task.priority;
    taskForm.status.value = task.status;
    taskForm.dueDate.value = task.dueDate || "";
    taskForm.estimate.value = task.estimate || "";
    taskForm.tags.value = task.tags || "";
  } else {
    editingTaskId = null;
    modalTitle.textContent = "Add Task";
    saveTaskBtn.textContent = "Save Task";
    taskForm.reset();
  }
  taskModal.hidden = false;
  taskForm.title.focus();
}

function closeModal() {
  taskModal.hidden = true;
  editingTaskId = null;
  taskForm.reset();
}

// ── Validation ──
function validateForm() {
  const title = taskForm.title.value.trim();
  const dueDate = taskForm.dueDate.value;

  if (title.length < 3) {
    showToast("Title must be at least 3 characters.");
    taskForm.title.focus();
    return false;
  }

  if (!dueDate) {
    showToast("Due date is required.");
    taskForm.dueDate.focus();
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (new Date(dueDate + "T00:00:00") < today && !editingTaskId) {
    showToast("Due date cannot be in the past.");
    taskForm.dueDate.focus();
    return false;
  }

  const estimate = taskForm.estimate.value;
  if (estimate && (Number(estimate) < 1 || Number(estimate) > 10000)) {
    showToast("Estimate must be between 1 and 10000.");
    taskForm.estimate.focus();
    return false;
  }

  return true;
}

// ── CRUD ──
function addTask(data) {
  const task = { id: generateId(), ...data };
  tasks.push(task);
  saveTasks(tasks);
  renderTaskList();
  showToast("Task added successfully");
}

function updateTask(id, data) {
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) return;
  tasks[idx] = { ...tasks[idx], ...data };
  saveTasks(tasks);
  renderTaskList();
  if (selectedTaskId === id) renderDetail(tasks[idx]);
  showToast("Task updated");
}

function deleteTask(id) {
  tasks = tasks.filter((t) => t.id !== id);
  saveTasks(tasks);
  if (selectedTaskId === id) renderDetail(null);
  renderTaskList();
  showToast("Task deleted");
}

function toggleDone(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;
  task.status = task.status === "done" ? "todo" : "done";
  saveTasks(tasks);
  renderTaskList();
  if (selectedTaskId === id) renderDetail(task);
}

// ── Sidebar ──
const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");
const menuBtn = document.getElementById("menuBtn");
const closeSidebarBtn = document.getElementById("closeSidebarBtn");

function openSidebar() {
  sidebar.classList.add("is-open");
  sidebarOverlay.classList.add("is-visible");
}

function closeSidebar() {
  sidebar.classList.remove("is-open");
  sidebarOverlay.classList.remove("is-visible");
}

menuBtn.addEventListener("click", openSidebar);
closeSidebarBtn.addEventListener("click", closeSidebar);
sidebarOverlay.addEventListener("click", closeSidebar);

// Sidebar nav links filter by status
document.querySelectorAll(".sidebar__link").forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    document.querySelectorAll(".sidebar__link").forEach((l) => l.classList.remove("sidebar__link--active"));
    link.classList.add("sidebar__link--active");

    const label = link.textContent.trim().toLowerCase();
    const statusMap = { "all tasks": "all", "todo": "todo", "in progress": "in-progress", "blocked": "blocked", "done": "done" };
    statusFilter.value = statusMap[label] || "all";
    renderTaskList();
    closeSidebar();
  });
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && sidebar.classList.contains("is-open")) closeSidebar();
});

// ── Event Listeners ──
openModalBtn.addEventListener("click", () => openModal(null));
emptyAddBtn.addEventListener("click", () => openModal(null));
closeModalBtn.addEventListener("click", closeModal);
cancelBtn.addEventListener("click", closeModal);

taskModal.addEventListener("click", (e) => {
  if (e.target === taskModal) closeModal();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !taskModal.hidden) closeModal();
});

taskForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!validateForm()) return;

  const data = {
    title: taskForm.title.value.trim(),
    description: taskForm.description.value.trim(),
    priority: taskForm.priority.value,
    status: taskForm.status.value,
    dueDate: taskForm.dueDate.value,
    estimate: taskForm.estimate.value ? Number(taskForm.estimate.value) : null,
    tags: taskForm.tags.value.trim(),
  };

  if (editingTaskId) {
    updateTask(editingTaskId, data);
  } else {
    addTask(data);
  }

  closeModal();
});

taskList.addEventListener("click", (e) => {
  const target = e.target;

  const checkId = target.dataset.checkId;
  if (checkId) {
    toggleDone(Number(checkId));
    return;
  }

  const selectId = target.dataset.selectId;
  if (selectId) {
    const task = tasks.find((t) => t.id === Number(selectId));
    if (task) renderDetail(task);
    return;
  }

  const editId = target.dataset.editId;
  if (editId) {
    const task = tasks.find((t) => t.id === Number(editId));
    if (task) openModal(task);
    return;
  }

  const deleteId = target.dataset.deleteId;
  if (deleteId) {
    deleteTask(Number(deleteId));
    return;
  }
});

// Detail panel action buttons
detailView.addEventListener("click", (e) => {
  const target = e.target;
  if (!selectedTaskId) return;

  if (target.textContent === "Mark Done") {
    toggleDone(selectedTaskId);
  } else if (target.textContent === "Edit") {
    const task = tasks.find((t) => t.id === selectedTaskId);
    if (task) openModal(task);
  } else if (target.textContent === "Delete") {
    deleteTask(selectedTaskId);
  }
});

searchInput.addEventListener("input", renderTaskList);
statusFilter.addEventListener("change", renderTaskList);
priorityFilter.addEventListener("change", renderTaskList);
sortBy.addEventListener("change", renderTaskList);

// ── Init ──
renderTaskList();
