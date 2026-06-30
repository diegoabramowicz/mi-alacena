import { state } from "../state.js";
import { sb } from "../services/supabase.js";
import { loadApp } from "./auth.js";
import { setLoading, showToast } from "../utils/ui.js";

export function showCrearHogar() {
  const crear = document.getElementById("crear-hogar-form");
  const unirse = document.getElementById("unirse-hogar-form");
  crear.style.display = "flex";
  crear.style.flexDirection = "column";
  crear.style.gap = "10px";
  unirse.style.display = "none";
}

export function showUnirseHogar() {
  const crear = document.getElementById("crear-hogar-form");
  const unirse = document.getElementById("unirse-hogar-form");
  unirse.style.display = "flex";
  unirse.style.flexDirection = "column";
  unirse.style.gap = "10px";
  crear.style.display = "none";
}

export function hideHogarForms() {
  document.getElementById("crear-hogar-form").style.display = "none";
  document.getElementById("unirse-hogar-form").style.display = "none";
}

export async function doCrearHogar() {
  const nombre = document.getElementById("hogar-nombre").value.trim();
  const err = document.getElementById("crear-error");
  if (!nombre) {
    err.textContent = "Ingresá un nombre";
    err.classList.add("show");
    return;
  }

  setLoading(true, "Creando hogar...");
  const { data, error } = await sb.rpc("crear_hogar", { nombre_hogar: nombre });
  setLoading(false);
  if (error) {
    err.textContent = error.message;
    err.classList.add("show");
    return;
  }
  state.currentHogar = data;
  await loadApp();
}

export async function doUnirseHogar() {
  const codigo = document.getElementById("hogar-codigo").value.trim().toLowerCase();
  const err = document.getElementById("unirse-error");
  if (!codigo) {
    err.textContent = "Ingresá un código";
    err.classList.add("show");
    return;
  }

  setLoading(true, "Uniéndome al hogar...");
  const { data, error } = await sb.rpc("unirse_a_hogar", { codigo_hogar: codigo });
  setLoading(false);
  if (error) {
    err.textContent = "Código inválido o ya sos miembro";
    err.classList.add("show");
    return;
  }
  state.currentHogar = data;
  await loadApp();
}

export function copiarCodigo() {
  if (!state.currentHogar) return;
  navigator.clipboard.writeText(state.currentHogar.codigo).then(() => showToast("✓ Código copiado"));
}
