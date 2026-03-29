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

function getTaskId() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  return id ? Number(id) : null;
}

function renderTask(task) {
  document.getElementById("loading").hidden = true;
  document.getElementById("detailView").hidden = false;

  document.getElementById("taskTitle").textContent = task.title;
  document.getElementById("taskBadges").innerHTML =
    `<span class="pill">${escapeHtml(task.status)}</span><span class="pill">${escapeHtml(task.priority)}</span>`;

  document.getElementById("taskGrid").innerHTML = `
    <div class="kv"><dt>Due</dt><dd>${formatDate(task.dueDate)}</dd></div>
    <div class="kv"><dt>Tags</dt><dd>${task.tags ? escapeHtml(task.tags) : "—"}</dd></div>
    <div class="kv"><dt>Estimate</dt><dd>${task.estimate ? task.estimate + " min" : "—"}</dd></div>
  `;

  document.getElementById("taskDesc").textContent = task.description || "No description.";

  const markDoneBtn = document.getElementById("markDoneBtn");
  markDoneBtn.textContent = task.status === "done" ? "Mark Todo" : "Mark Done";
}

function showNotFound() {
  document.getElementById("loading").hidden = true;
  document.getElementById("notFound").hidden = false;
}

function init() {
  const id = getTaskId();
  if (!id) {
    showNotFound();
    return;
  }

  const tasks = loadTasks();
  const task = tasks.find((t) => t.id === id);

  if (!task) {
    showNotFound();
    return;
  }

  renderTask(task);

  document.getElementById("markDoneBtn").addEventListener("click", () => {
    const allTasks = loadTasks();
    const t = allTasks.find((x) => x.id === id);
    if (!t) return;
    t.status = t.status === "done" ? "todo" : "done";
    saveTasks(allTasks);
    renderTask(t);
    const banner = document.getElementById("statusBanner");
    banner.textContent = t.status === "done" ? "Task marked done" : "Task marked todo";
    banner.hidden = false;
    setTimeout(() => { banner.hidden = true; }, 2500);
  });

  document.getElementById("deleteBtn").addEventListener("click", () => {
    const allTasks = loadTasks();
    const filtered = allTasks.filter((x) => x.id !== id);
    saveTasks(filtered);
    window.location.href = "./index.html";
  });
}

init();
