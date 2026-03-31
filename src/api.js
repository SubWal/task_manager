const API_URL = "http://localhost:3001/tasks";

// GET all tasks
export async function fetchTasks() {
  const response = await fetch(API_URL);
  if (!response.ok) throw new Error(`Failed to fetch tasks: ${response.status}`);
  return response.json();
}

// GET single task by id
export async function fetchTask(id) {
  const response = await fetch(`${API_URL}/${id}`);
  if (!response.ok) return null;
  return response.json();
}

// POST new task
export async function createTask(task) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(task),
  });
  if (!response.ok) throw new Error(`Failed to create task: ${response.status}`);
  return response.json();
}

// PUT update task
export async function updateTaskAPI(id, data) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error(`Failed to update task: ${response.status}`);
  return response.json();
}

// DELETE task
export async function deleteTaskAPI(id) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error(`Failed to delete task: ${response.status}`);
}
