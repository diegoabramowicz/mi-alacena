import { state } from "../state.js";
import { sb } from "../services/supabase.js";
import { limpiarSesion, loadApp } from "./auth.js";
import { clearInlineError, setInlineError, setLoading, showToast } from "../utils/ui.js";

function setHomeStep(nextStep) {
  document.querySelectorAll(".home-step").forEach((node) => node.classList.remove("active"));
  const step = document.getElementById(nextStep);
  if (step) step.classList.add("active");
}

function clearHomeErrors() {
  clearInlineError("crear-error", "unirse-error");
}

function showHomeError(id, message) {
  setInlineError(id, message);
}

function normalizeHomeError(message, fallback) {
  const raw = (message || "").toLowerCase();
  if (!raw) return fallback;
  if (raw.includes("duplicate") || raw.includes("already")) return fallback;
  if (raw.includes("invalid")) return fallback;
  if (raw.includes("network") || raw.includes("fetch")) return "Tuvimos un problema de conexión. Inténtalo de nuevo.";
  return fallback;
}

export function showCrearHogar() {
  clearHomeErrors();
  setHomeStep("home-create");
}

export function showUnirseHogar() {
  clearHomeErrors();
  setHomeStep("home-join");
}

export function hideHogarForms() {
  clearHomeErrors();
  setHomeStep("home-choice");
}

export function closeHomeOnboarding(event) {
  const screen = document.getElementById("hogar-screen");
  if (event && event.target !== screen) return;
  if (state.currentUser && !state.currentHogar) {
    logoutFromHomeOnboarding();
    return;
  }
  screen?.classList.remove("active");
  document.getElementById("auth-screen")?.classList.remove("active");
  document.getElementById("main-app").style.display = "none";
  document.getElementById("public-home")?.style.setProperty("display", "block");
  setLoading(false);
}

export async function logoutFromHomeOnboarding() {
  await limpiarSesion("login");
}

export async function doCrearHogar() {
  const nombre = document.getElementById("hogar-nombre").value.trim();
  const err = document.getElementById("crear-error");
  clearHomeErrors();
  if (!nombre) {
    showHomeError("crear-error", "Dale un nombre a tu hogar para continuar.");
    return;
  }

  setLoading(true, "Creando hogar...");
  const { data, error } = await sb.rpc("crear_hogar", { nombre_hogar: nombre });
  setLoading(false);
  if (error) {
    showHomeError("crear-error", normalizeHomeError(error.message, "No pudimos crear tu hogar."));
    return;
  }
  state.currentHogar = data;
  await loadApp();
}

export async function doUnirseHogar() {
  const codigo = document.getElementById("hogar-codigo").value.trim().toLowerCase();
  const err = document.getElementById("unirse-error");
  clearHomeErrors();
  if (!codigo) {
    showHomeError("unirse-error", "Ingresá el código que te compartieron.");
    return;
  }

  setLoading(true, "Uniéndome al hogar...");
  const { data, error } = await sb.rpc("unirse_a_hogar", { codigo_hogar: codigo });
  setLoading(false);
  if (error) {
    showHomeError("unirse-error", normalizeHomeError(error.message, "Ese código no es válido o ya formas parte de ese hogar."));
    return;
  }
  state.currentHogar = data;
  await loadApp();
}

export function copiarCodigo() {
  if (!state.currentHogar) return;
  navigator.clipboard.writeText(state.currentHogar.codigo).then(() => showToast("✓ Código copiado"));
}
