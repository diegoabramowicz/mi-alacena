let toastTimeout = null;
let confirmAction = null;

export function showToast(msg, options = {}) {
  const config = typeof options === "number"
    ? { duration: options }
    : options;
  const { duration = 2600, type = "info" } = config;
  const toast = document.getElementById("toast");
  if (!toast) return;

  if (toastTimeout) {
    window.clearTimeout(toastTimeout);
    toastTimeout = null;
  }

  const iconMap = {
    info: "ti ti-sparkles",
    success: "ti ti-check",
    error: "ti ti-alert-circle",
    warning: "ti ti-alert-triangle",
  };

  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon"><i class="${iconMap[type] || iconMap.info}"></i></span>
    <span class="toast-message"></span>
  `;
  toast.querySelector(".toast-message").textContent = msg;
  toast.classList.remove("show");
  void toast.offsetWidth;
  toast.classList.add("show");
  toastTimeout = window.setTimeout(() => {
    toast.classList.remove("show");
  }, duration);
}

export function setSyncStatus(status) {
  const dot = document.getElementById("sync-dot");
  if (!dot) return;
  dot.className = `sync-dot${status === "syncing" ? " syncing" : status === "error" ? " error" : ""}`;
}

export function setLoading(show, text = "Cargando...") {
  document.getElementById("loading-text").textContent = text;
  document.getElementById("loading").classList.toggle("active", show);
}

export function setSelectValue(id, value) {
  const select = document.getElementById(id);
  if (!select) return;
  for (const option of select.options) {
    if (option.value === value) {
      select.value = value;
      return;
    }
  }
}

export function toggleBodyScroll(locked) {
  document.body.style.overflow = locked ? "hidden" : "";
}

export function setInlineError(id, message) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = message;
  el.classList.toggle("show", Boolean(message));
}

export function clearInlineError(...ids) {
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = "";
    el.classList.remove("show");
  });
}

export function openConfirmModal(options = {}) {
  const {
    title = "Confirmar acción",
    message = "¿Quieres continuar?",
    confirmLabel = "Confirmar",
    confirmTone = "danger",
    onConfirm = null,
  } = options;

  const modal = document.getElementById("confirm-modal");
  if (!modal) return;

  confirmAction = onConfirm;
  document.getElementById("confirm-modal-title").textContent = title;
  document.getElementById("confirm-modal-message").textContent = message;

  const button = document.getElementById("confirm-modal-button");
  button.textContent = confirmLabel;
  button.className = `btn ${confirmTone === "danger" ? "danger" : "primary"}`;
  button.disabled = false;

  modal.classList.add("active");
  toggleBodyScroll(true);
}

export function closeConfirmModal(event) {
  const modal = document.getElementById("confirm-modal");
  if (!modal) return;
  if (event && event.target !== modal) return;
  modal.classList.remove("active");
  toggleBodyScroll(false);
  confirmAction = null;
}

export async function confirmModalAction() {
  if (!confirmAction) return;
  const action = confirmAction;
  const button = document.getElementById("confirm-modal-button");
  button.disabled = true;

  try {
    await action();
    closeConfirmModal();
  } catch (_error) {
    button.disabled = false;
  }
}
