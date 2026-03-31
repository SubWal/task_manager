import { escapeHtml, formatDate } from "./utils.js";
import { fetchTask, updateTaskAPI, deleteTaskAPI } from "./api.js";

function getTaskId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
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

function showToast(message) {
  const banner = document.getElementById("statusBanner");
  banner.textContent = message;
  banner.hidden = false;
  setTimeout(() => { banner.hidden = true; }, 2500);
}

async function init() {
  const id = getTaskId();
  if (!id) {
    showNotFound();
    return;
  }

  const task = await fetchTask(id);

  if (!task) {
    showNotFound();
    return;
  }

  renderTask(task);

  document.getElementById("markDoneBtn").addEventListener("click", async () => {
    const newStatus = task.status === "done" ? "todo" : "done";
    try {
      const updated = await updateTaskAPI(id, { ...task, status: newStatus });
      Object.assign(task, updated);
      renderTask(task);
      showToast(task.status === "done" ? "Task marked done" : "Task marked todo");
    } catch (error) {
      console.error(error);
      showToast("Failed to update task");
    }
  });

  document.getElementById("deleteBtn").addEventListener("click", async () => {
    try {
      await deleteTaskAPI(id);
      window.location.href = "./index.html";
    } catch (error) {
      console.error(error);
      showToast("Failed to delete task");
    }
  });
}

init();
