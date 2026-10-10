
(() => {
  "use strict";

  const STORAGE_KEY = "studentTaskManager.tasks.v1";
  const DAYS = [
    "Monday", "Tuesday", "Wednesday", "Thursday",
    "Friday", "Saturday", "Sunday"
  ];

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];

  const elements = {
    openTaskBtn: $("#openTaskBtn"),
    emptyAddBtn: $("#emptyAddBtn"),
    taskModal: $("#taskModal"),
    closeModalBtn: $("#closeModalBtn"),
    cancelTaskBtn: $("#cancelTaskBtn"),
    taskForm: $("#taskForm"),
    taskName: $("#taskName"),
    taskDay: $("#taskDay"),
    taskPriority: $("#taskPriority"),
    taskNotes: $("#taskNotes"),
    taskList: $("#taskList"),
    emptyState: $("#emptyState"),
    searchInput: $("#searchInput"),
    totalTasks: $("#totalTasks"),
    incompleteTasks: $("#incompleteTasks"),
    completedTasks: $("#completedTasks"),
    completionRate: $("#completionRate"),
    completionBar: $("#completionBar"),
    reminderBox: $("#reminderBox"),
    reminderText: $("#reminderText"),
    viewIncompleteBtn: $("#viewIncompleteBtn"),
    dashboardView: $("#dashboardView"),
    weekView: $("#weekView"),
    weeklyGrid: $("#weeklyGrid"),
    weekSummary: $("#weekSummary"),
    pageTitle: $("#pageTitle"),
    taskCountLabel: $("#taskCountLabel"),
    toast: $("#toast")
  };

  let tasks = loadTasks();
  let currentFilter = "all";
  let currentView = "dashboard";
  let editingTaskId = null;
  let toastTimeout = null;

  function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function loadTasks() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return [];

      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];

      return parsed
        .filter((task) => task && typeof task.title === "string")
        .map((task) => ({
          id: String(task.id || createId()),
          title: task.title.slice(0, 120),
          day: DAYS.includes(task.day) ? task.day : "Monday",
          priority: ["Low", "Medium", "High"].includes(task.priority)
            ? task.priority : "Medium",
          notes: typeof task.notes === "string" ? task.notes : "",
          completed: Boolean(task.completed),
          createdAt: task.createdAt || new Date().toISOString(),
          updatedAt: task.updatedAt || task.createdAt || new Date().toISOString()
        }));
    } catch (error) {
      console.error("Could not load saved tasks:", error);
      return [];
    }
  }

  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      return true;
    } catch (error) {
      console.error("Could not save tasks:", error);
      showToast("Unable to save tasks. Check your browser storage settings.");
      return false;
    }
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]);
  }

  function showToast(message) {
    elements.toast.textContent = message;
    elements.toast.classList.add("show");

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      elements.toast.classList.remove("show");
    }, 2800);
  }

  function openModal(task = null) {
    editingTaskId = task ? task.id : null;
    elements.taskForm.reset();

    $("#modalTitle").textContent = task ? "Edit Task" : "Create a Task";
    $("#saveTaskBtn").textContent = task ? "Update Task" : "Save Task";

    elements.taskName.value = task ? task.title : "";
    elements.taskDay.value = task ? task.day : "Monday";
    elements.taskPriority.value = task ? task.priority : "Medium";
    elements.taskNotes.value = task ? task.notes : "";

    elements.taskModal.hidden = false;
    document.body.style.overflow = "hidden";
    elements.taskName.focus();
  }

  function closeModal() {
    elements.taskModal.hidden = true;
    document.body.style.overflow = "";
    editingTaskId = null;
  }

  function addOrUpdateTask(event) {
    event.preventDefault();

    const title = elements.taskName.value.trim();
    const day = elements.taskDay.value;
    const priority = elements.taskPriority.value;
    const notes = elements.taskNotes.value.trim();

    if (!title) {
      elements.taskName.focus();
      showToast("Please enter a task name.");
      return;
    }

    if (!DAYS.includes(day)) {
      showToast("Please select a valid day.");
      return;
    }

    if (!["Low", "Medium", "High"].includes(priority)) {
      showToast("Please select a valid priority.");
      return;
    }

    const now = new Date().toISOString();

    if (editingTaskId) {
      tasks = tasks.map((task) =>
        task.id === editingTaskId
          ? { ...task, title, day, priority, notes, updatedAt: now }
          : task
      );
      saveTasks();
      renderAll();
      closeModal();
      showToast("Task updated successfully!");
    } else {
      tasks.unshift({
        id: createId(),
        title,
        day,
        priority,
        notes,
        completed: false,
        createdAt: now,
        updatedAt: now
      });

      saveTasks();
      renderAll();
      closeModal();
      showToast("Task added successfully!");
    }
  }

  function toggleTask(id) {
    const task = tasks.find((item) => item.id === id);
    if (!task) return;

    task.completed = !task.completed;
    task.updatedAt = new Date().toISOString();

    saveTasks();
    renderAll();
    showToast(task.completed ? "Great work! Task completed." : "Task marked incomplete.");
  }

  function deleteTask(id) {
    const task = tasks.find((item) => item.id === id);
    if (!task) return;

    const confirmed = window.confirm(`Delete "${task.title}"?`);
    if (!confirmed) return;

    tasks = tasks.filter((item) => item.id !== id);
    saveTasks();
    renderAll();
    showToast("Task deleted.");
  }

  function getVisibleTasks() {
    const search = elements.searchInput.value.trim().toLowerCase();

    return tasks.filter((task) => {
      const matchesFilter =
        currentFilter === "all" ||
        (currentFilter === "incomplete" && !task.completed) ||
        (currentFilter === "completed" && task.completed);

      const matchesSearch =
        task.title.toLowerCase().includes(search) ||
        task.notes.toLowerCase().includes(search) ||
        task.day.toLowerCase().includes(search) ||
        task.priority.toLowerCase().includes(search);

      return matchesFilter && matchesSearch;
    });
  }

  function renderTask(task) {
    const priorityClass = `priority-${task.priority.toLowerCase()}`;

    return `
      <article class="task-item ${task.completed ? "is-completed" : ""}">
        <input
          class="task-check"
          type="checkbox"
          data-action="toggle"
          data-id="${escapeHTML(task.id)}"
          aria-label="Mark ${escapeHTML(task.title)} as ${task.completed ? "incomplete" : "completed"}"
          ${task.completed ? "checked" : ""}
        >
        <div class="task-main">
          <h3 class="task-title">${escapeHTML(task.title)}</h3>
          ${task.notes ? `<p class="task-notes">${escapeHTML(task.notes)}</p>` : ""}
          <div class="task-meta">
            <span class="meta-pill">▦ ${escapeHTML(task.day)}</span>
            <span class="priority-pill ${priorityClass}">${escapeHTML(task.priority)} Priority</span>
            <span class="meta-pill">${task.completed ? "Completed" : "Incomplete"}</span>
          </div>
        </div>
        <div class="task-actions">
          <button class="icon-btn" data-action="edit" data-id="${escapeHTML(task.id)}"
            aria-label="Edit ${escapeHTML(task.title)}" title="Edit task">✎</button>
          <button class="icon-btn delete" data-action="delete" data-id="${escapeHTML(task.id)}"
            aria-label="Delete ${escapeHTML(task.title)}" title="Delete task">×</button>
        </div>
      </article>
    `;
  }

  function renderTaskList() {
    const visibleTasks = getVisibleTasks();

    elements.taskList.innerHTML = visibleTasks.map(renderTask).join("");
    elements.emptyState.hidden = visibleTasks.length > 0;
    elements.taskList.hidden = visibleTasks.length === 0;

    const label = currentFilter === "all" ? "tasks" : `${currentFilter} tasks`;
    elements.taskCountLabel.textContent = `${visibleTasks.length} ${label}`;

    $$(".filter-btn").forEach((button) => {
      button.classList.toggle("active", button.dataset.filter === currentFilter);
    });
  }

  function renderStats() {
    const total = tasks.length;
    const completed = tasks.filter((task) => task.completed).length;
    const incomplete = total - completed;
    const percentage = total ? Math.round((completed / total) * 100) : 0;

    elements.totalTasks.textContent = total;
    elements.incompleteTasks.textContent = incomplete;
    elements.completedTasks.textContent = completed;
    elements.completionRate.textContent = `${percentage}%`;
    elements.completionBar.style.width = `${percentage}%`;

    elements.reminderBox.hidden = incomplete === 0;

    if (incomplete > 0) {
      const names = tasks
        .filter((task) => !task.completed)
        .slice(0, 3)
        .map((task) => task.title);

      const extra = incomplete > 3 ? ` and ${incomplete - 3} more` : "";
      elements.reminderText.textContent =
        `You have ${incomplete} incomplete task${incomplete === 1 ? "" : "s"}: ${names.join(", ")}${extra}.`;
    }
  }

  function getTodayName() {
    const dayNumber = new Date().getDay();
    return DAYS[dayNumber === 0 ? 6 : dayNumber - 1];
  }

  function renderWeeklyView() {
    const today = getTodayName();
    const total = tasks.length;
    const completed = tasks.filter((task) => task.completed).length;

    elements.weekSummary.textContent = `${total} task${total === 1 ? "" : "s"} · ${completed} completed`;

    elements.weeklyGrid.innerHTML = DAYS.map((day) => {
      const dayTasks = tasks.filter((task) => task.day === day);
      const doneCount = dayTasks.filter((task) => task.completed).length;

      const taskMarkup = dayTasks.length
        ? dayTasks.map((task) => `
            <div class="day-task ${task.completed ? "done" : ""}">
              <input type="checkbox"
                data-action="toggle"
                data-id="${escapeHTML(task.id)}"
                aria-label="Complete ${escapeHTML(task.title)}"
                ${task.completed ? "checked" : ""}>
              <span class="day-task-title">${escapeHTML(task.title)}
                <span class="priority-pill priority-${task.priority.toLowerCase()}">
                  ${escapeHTML(task.priority)}
                </span>
              </span>
              <button class="icon-btn" data-action="edit" data-id="${escapeHTML(task.id)}"
                aria-label="Edit ${escapeHTML(task.title)}" title="Edit task">✎</button>
            </div>
          `).join("")
        : `<p class="day-empty">No tasks planned.</p>`;

      return `
        <article class="day-card ${day === today ? "today" : ""}">
          <div class="day-heading">
            <h3>${day}${day === today ? " · Today" : ""}</h3>
            <span>${doneCount}/${dayTasks.length} completed</span>
          </div>
          ${taskMarkup}
        </article>
      `;
    }).join("");
  }

  function renderAll() {
    renderStats();
    renderTaskList();
    renderWeeklyView();
    setView(currentView);
  }

  function setView(view) {
    currentView = view === "week" ? "week" : "dashboard";

    elements.dashboardView.hidden = currentView !== "dashboard";
    elements.weekView.hidden = currentView !== "week";
    elements.pageTitle.textContent = currentView === "week" ? "Weekly View" : "Dashboard";

    $$(".nav-item").forEach((button) => {
      button.classList.toggle("active", button.dataset.view === currentView);
    });
  }

  // Main buttons
  elements.openTaskBtn.addEventListener("click", () => openModal());
  elements.emptyAddBtn.addEventListener("click", () => openModal());
  elements.closeModalBtn.addEventListener("click", closeModal);
  elements.cancelTaskBtn.addEventListener("click", closeModal);
  elements.taskForm.addEventListener("submit", addOrUpdateTask);

  elements.taskModal.addEventListener("click", (event) => {
    if (event.target.matches("[data-close-modal]")) closeModal();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !elements.taskModal.hidden) closeModal();
  });

  // Filter and search
  $$(".filter-btn").forEach((button) => {
    button.addEventListener("click", () => {
      currentFilter = button.dataset.filter;
      renderTaskList();
    });
  });

  elements.searchInput.addEventListener("input", renderTaskList);

  // Task actions use event delegation so newly added tasks work too.
  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;

    const { action, id } = button.dataset;
    if (!id) return;

    if (action === "edit") {
      const task = tasks.find((item) => item.id === id);
      if (task) openModal(task);
    } else if (action === "delete") {
      deleteTask(id);
    }
  });

  document.addEventListener("change", (event) => {
    const checkbox = event.target.closest('input[data-action="toggle"]');
    if (checkbox) toggleTask(checkbox.dataset.id);
  });

  // Navigation
  $$(".nav-item").forEach((button) => {
    button.addEventListener("click", () => setView(button.dataset.view));
  });

  // Incomplete task reminder
  elements.viewIncompleteBtn.addEventListener("click", () => {
    currentFilter = "incomplete";
    elements.searchInput.value = "";
    setView("dashboard");
    renderTaskList();
    elements.dashboardView.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  // Initialize from Local Storage
  renderAll();

  // Remind the user on page load if unfinished tasks exist.
  const pendingCount = tasks.filter((task) => !task.completed).length;
  if (pendingCount > 0) {
    showToast(`Reminder: You have ${pendingCount} incomplete task${pendingCount === 1 ? "" : "s"}.`);
  }
})();
