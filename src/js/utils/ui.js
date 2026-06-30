export function showToast(msg, duration = 2200) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), duration);
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
