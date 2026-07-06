import { state } from "../state.js";
import { sb } from "../services/supabase.js";
import { renderSelects } from "./render.js";
import { clearInlineError, openConfirmModal, setInlineError, setLoading, showToast } from "../utils/ui.js";

export async function agregarCategoria() {
  const input = document.getElementById("new-cat-input");
  const nombre = input.value.trim();
  clearInlineError("settings-cat-error");
  if (!nombre) return;
  if (state.categorias.find((categoria) => categoria.nombre === nombre)) {
    setInlineError("settings-cat-error", "Ya existe esa categoría.");
    return;
  }

  setLoading(true, "Guardando...");
  const { data } = await sb.from("categorias").insert({ hogar_id: state.currentHogar.id, nombre }).select().single();
  if (data) {
    state.categorias.push(data);
    renderSelects();
    input.value = "";
    showToast("✓ Categoría agregada");
  }
  setLoading(false);
}

export function eliminarCategoria(id) {
  const categoria = state.categorias.find((item) => item.id === id);
  openConfirmModal({
    title: "Eliminar categoría",
    message: categoria
      ? `Se va a eliminar la categoría "${categoria.nombre}".`
      : "Se va a eliminar esta categoría.",
    confirmLabel: "Eliminar categoría",
    confirmTone: "danger",
    onConfirm: async () => {
      setLoading(true, "Eliminando...");
      await sb.from("categorias").delete().eq("id", id);
      state.categorias = state.categorias.filter((item) => item.id !== id);
      renderSelects();
      showToast("Categoría eliminada");
      setLoading(false);
    },
  });
}

export async function agregarUbicacion() {
  const input = document.getElementById("new-ubic-input");
  const nombre = input.value.trim();
  clearInlineError("settings-ubic-error");
  if (!nombre) return;
  if (state.ubicaciones.find((ubicacion) => ubicacion.nombre === nombre)) {
    setInlineError("settings-ubic-error", "Ya existe esa ubicación.");
    return;
  }

  setLoading(true, "Guardando...");
  const { data } = await sb.from("ubicaciones").insert({ hogar_id: state.currentHogar.id, nombre }).select().single();
  if (data) {
    state.ubicaciones.push(data);
    renderSelects();
    input.value = "";
    showToast("✓ Ubicación agregada");
  }
  setLoading(false);
}

export function eliminarUbicacion(id) {
  const ubicacion = state.ubicaciones.find((item) => item.id === id);
  openConfirmModal({
    title: "Eliminar ubicación",
    message: ubicacion
      ? `Se va a eliminar la ubicación "${ubicacion.nombre}".`
      : "Se va a eliminar esta ubicación.",
    confirmLabel: "Eliminar ubicación",
    confirmTone: "danger",
    onConfirm: async () => {
      setLoading(true, "Eliminando...");
      await sb.from("ubicaciones").delete().eq("id", id);
      state.ubicaciones = state.ubicaciones.filter((item) => item.id !== id);
      renderSelects();
      showToast("Ubicación eliminada");
      setLoading(false);
    },
  });
}
