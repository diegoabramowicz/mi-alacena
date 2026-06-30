import { state } from "../state.js";
import { sb } from "../services/supabase.js";
import { renderSelects } from "./render.js";
import { setLoading, showToast } from "../utils/ui.js";

export async function agregarCategoria() {
  const input = document.getElementById("new-cat-input");
  const nombre = input.value.trim();
  if (!nombre) return;
  if (state.categorias.find((categoria) => categoria.nombre === nombre)) {
    showToast("Ya existe esa categoría");
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

export async function eliminarCategoria(id) {
  if (!window.confirm("¿Eliminar esta categoría?")) return;
  setLoading(true, "Eliminando...");
  await sb.from("categorias").delete().eq("id", id);
  state.categorias = state.categorias.filter((categoria) => categoria.id !== id);
  renderSelects();
  showToast("Categoría eliminada");
  setLoading(false);
}

export async function agregarUbicacion() {
  const input = document.getElementById("new-ubic-input");
  const nombre = input.value.trim();
  if (!nombre) return;
  if (state.ubicaciones.find((ubicacion) => ubicacion.nombre === nombre)) {
    showToast("Ya existe esa ubicación");
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

export async function eliminarUbicacion(id) {
  if (!window.confirm("¿Eliminar esta ubicación?")) return;
  setLoading(true, "Eliminando...");
  await sb.from("ubicaciones").delete().eq("id", id);
  state.ubicaciones = state.ubicaciones.filter((ubicacion) => ubicacion.id !== id);
  renderSelects();
  showToast("Ubicación eliminada");
  setLoading(false);
}
