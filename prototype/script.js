(() => {
  "use strict";

  const STORAGE_KEY = "task-management-prototype-tasks";
  const STATUSES = ["未着手", "作業中", "完了"];
  const SOON_THRESHOLD_DAYS = 3;
  const PRIORITY_ORDER = { 高: 0, 中: 1, 低: 2 };

  /** @typedef {{id:string,title:string,description:string,priority:"高"|"中"|"低",dueDate:string,status:string,sortOrder:number}} Task */

  /** @type {Task[]} */
  let tasks = loadTasks();

  /** @type {{mode:"create"|"edit", taskId:string|null, status:string|null}} */
  let modalState = { mode: "create", taskId: null, status: null };

  let draggedTaskId = null;

  // ---------- data ----------

  function loadTasks() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        // fall through to seed data
      }
    }
    return seedTasks();
  }

  function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  function seedTasks() {
    const today = new Date();
    const offsetDate = (days) => {
      const d = new Date(today);
      d.setDate(d.getDate() + days);
      return d.toISOString().slice(0, 10);
    };

    return [
      { id: crypto.randomUUID(), title: "要件定義書のレビュー", description: "誤字脱字と抜け漏れがないか確認する。", priority: "高", dueDate: offsetDate(-2), status: "未着手", sortOrder: 0 },
      { id: crypto.randomUUID(), title: "画面設計書の作成", description: "", priority: "中", dueDate: offsetDate(1), status: "未着手", sortOrder: 1 },
      { id: crypto.randomUUID(), title: "配色パターンの検討", description: "優先度・期限の強調表示に使う色を決める。", priority: "低", dueDate: "", status: "未着手", sortOrder: 2 },
      { id: crypto.randomUUID(), title: "モックのD&D実装", description: "HTML5 Drag and Drop APIで列間移動を作る。", priority: "高", dueDate: offsetDate(2), status: "作業中", sortOrder: 0 },
      { id: crypto.randomUUID(), title: "localStorage連携", description: "", priority: "中", dueDate: offsetDate(10), status: "作業中", sortOrder: 1 },
      { id: crypto.randomUUID(), title: "要件定義", description: "目的・想定利用者・スコープを整理した。", priority: "中", dueDate: offsetDate(-10), status: "完了", sortOrder: 0 },
    ];
  }

  // ---------- rendering ----------

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str ?? "";
    return div.innerHTML;
  }

  function dueDateClass(dueDate) {
    if (!dueDate) return "";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate + "T00:00:00");
    const diffDays = Math.round((due - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return "due-date--overdue";
    if (diffDays <= SOON_THRESHOLD_DAYS) return "due-date--soon";
    return "";
  }

  function formatDate(dueDate) {
    if (!dueDate) return "";
    const [y, m, d] = dueDate.split("-");
    return `${y}/${m}/${d}`;
  }

  function renderBoard() {
    for (const status of STATUSES) {
      const list = document.getElementById(`card-list-${status}`);
      list.innerHTML = "";

      const columnTasks = tasks
        .filter((t) => t.status === status)
        .sort((a, b) => a.sortOrder - b.sortOrder);

      for (const task of columnTasks) {
        list.appendChild(renderCard(task));
      }
    }
  }

  function renderCard(task) {
    const card = document.createElement("div");
    card.className = `card card--priority-${task.priority}`;
    card.draggable = true;
    card.dataset.taskId = task.id;

    const dueClass = dueDateClass(task.dueDate);
    const dueHtml = task.dueDate
      ? `<span class="due-date ${dueClass}">${escapeHtml(formatDate(task.dueDate))}</span>`
      : "";

    card.innerHTML = `
      <p class="card__title">${escapeHtml(task.title)}</p>
      <div class="card__meta">
        <span class="badge badge--priority-${task.priority}">${escapeHtml(task.priority)}</span>
        ${dueHtml}
      </div>
    `;

    card.addEventListener("click", () => openEditModal(task.id));
    card.addEventListener("dragstart", (e) => {
      draggedTaskId = task.id;
      card.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
    });
    card.addEventListener("dragend", () => {
      card.classList.remove("dragging");
      draggedTaskId = null;
    });

    return card;
  }

  // ---------- drag & drop ----------

  function setupDropZones() {
    for (const status of STATUSES) {
      const list = document.getElementById(`card-list-${status}`);

      list.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        list.classList.add("drag-over");
      });

      list.addEventListener("dragleave", () => {
        list.classList.remove("drag-over");
      });

      list.addEventListener("drop", (e) => {
        e.preventDefault();
        list.classList.remove("drag-over");
        if (!draggedTaskId) return;

        const afterElement = getDragAfterElement(list, e.clientY);
        moveTask(draggedTaskId, status, afterElement ? afterElement.dataset.taskId : null);
      });
    }
  }

  function getDragAfterElement(container, y) {
    const cards = [...container.querySelectorAll(".card:not(.dragging)")];

    return cards.reduce(
      (closest, card) => {
        const box = card.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
          return { offset, element: card };
        }
        return closest;
      },
      { offset: Number.NEGATIVE_INFINITY, element: null }
    ).element;
  }

  function moveTask(taskId, newStatus, beforeTaskId) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    task.status = newStatus;

    const columnTasks = tasks
      .filter((t) => t.status === newStatus && t.id !== taskId)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    const insertIndex = beforeTaskId
      ? columnTasks.findIndex((t) => t.id === beforeTaskId)
      : columnTasks.length;

    columnTasks.splice(insertIndex === -1 ? columnTasks.length : insertIndex, 0, task);
    columnTasks.forEach((t, i) => {
      t.sortOrder = i;
    });

    saveTasks();
    renderBoard();
  }

  function sortColumn(status, key) {
    const columnTasks = tasks
      .filter((t) => t.status === status)
      .sort((a, b) => {
        if (key === "priority") {
          return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
        }
        // key === "dueDate": tasks without a due date go last
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      });

    columnTasks.forEach((t, i) => {
      t.sortOrder = i;
    });

    saveTasks();
    renderBoard();
  }

  // ---------- modal ----------

  const overlay = document.getElementById("modal-overlay");
  const form = document.getElementById("task-form");
  const titleInput = document.getElementById("task-title");
  const titleError = document.getElementById("title-error");
  const descriptionInput = document.getElementById("task-description");
  const priorityInput = document.getElementById("task-priority");
  const dueDateInput = document.getElementById("task-due-date");
  const modalTitle = document.getElementById("modal-title");
  const submitBtn = document.getElementById("submit-btn");
  const deleteBtn = document.getElementById("delete-btn");
  const cancelBtn = document.getElementById("cancel-btn");

  function openCreateModal(status) {
    modalState = { mode: "create", taskId: null, status };
    modalTitle.textContent = "タスクを追加";
    submitBtn.textContent = "登録";
    deleteBtn.hidden = true;

    form.reset();
    priorityInput.value = "中";
    titleInput.classList.remove("invalid");
    titleError.hidden = true;

    showModal();
  }

  function openEditModal(taskId) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    modalState = { mode: "edit", taskId, status: task.status };
    modalTitle.textContent = "タスクを編集";
    submitBtn.textContent = "更新";
    deleteBtn.hidden = false;

    titleInput.value = task.title;
    descriptionInput.value = task.description;
    priorityInput.value = task.priority;
    dueDateInput.value = task.dueDate;
    titleInput.classList.remove("invalid");
    titleError.hidden = true;

    showModal();
  }

  function showModal() {
    overlay.hidden = false;
    titleInput.focus();
  }

  function closeModal() {
    overlay.hidden = true;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const title = titleInput.value.trim();

    if (!title) {
      titleInput.classList.add("invalid");
      titleError.hidden = false;
      titleInput.focus();
      return;
    }

    if (modalState.mode === "create") {
      const columnTasks = tasks.filter((t) => t.status === modalState.status);
      tasks.push({
        id: crypto.randomUUID(),
        title,
        description: descriptionInput.value.trim(),
        priority: priorityInput.value,
        dueDate: dueDateInput.value,
        status: modalState.status,
        sortOrder: columnTasks.length,
      });
    } else {
      const task = tasks.find((t) => t.id === modalState.taskId);
      if (task) {
        task.title = title;
        task.description = descriptionInput.value.trim();
        task.priority = priorityInput.value;
        task.dueDate = dueDateInput.value;
      }
    }

    saveTasks();
    renderBoard();
    closeModal();
  }

  function handleDelete() {
    if (modalState.mode !== "edit" || !modalState.taskId) return;
    if (!confirm("このタスクを削除しますか?")) return;

    tasks = tasks.filter((t) => t.id !== modalState.taskId);
    saveTasks();
    renderBoard();
    closeModal();
  }

  // ---------- init ----------

  function init() {
    renderBoard();
    setupDropZones();

    document.querySelectorAll(".add-task-btn").forEach((btn) => {
      btn.addEventListener("click", () => openCreateModal(btn.dataset.status));
    });

    document.querySelectorAll(".sort-btn").forEach((btn) => {
      btn.addEventListener("click", () => sortColumn(btn.dataset.status, btn.dataset.sortKey));
    });

    form.addEventListener("submit", handleSubmit);
    cancelBtn.addEventListener("click", closeModal);
    deleteBtn.addEventListener("click", handleDelete);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeModal();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !overlay.hidden) closeModal();
    });
    titleInput.addEventListener("input", () => {
      if (titleInput.value.trim()) {
        titleInput.classList.remove("invalid");
        titleError.hidden = true;
      }
    });
  }

  init();
})();
