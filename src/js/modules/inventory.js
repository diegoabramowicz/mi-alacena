import { state } from "../state.js";
import { sb } from "../services/supabase.js";
import { renderList, renderSelects } from "./render.js";
import { setLoading, setSelectValue, showToast, toggleBodyScroll } from "../utils/ui.js";

export async function eliminarProducto(id) {
  if (!window.confirm("¿Eliminar este producto?")) return;
  setLoading(true, "Eliminando...");
  await sb.from("productos").delete().eq("id", id);
  state.productos = state.productos.filter((producto) => producto.id !== id);
  state.lotes = state.lotes.filter((lote) => lote.producto_id !== id);
  renderList();
  setLoading(false);
  showToast("Producto eliminado");
}

export function editProducto(id) {
  const producto = state.productos.find((item) => item.id === id);
  if (!producto) return;

  state.editId = id;
  document.getElementById("edit-nombre").value = producto.nombre || "";
  document.getElementById("edit-barcode").value = producto.barcode || "";
  renderSelects();
  window.setTimeout(() => {
    setSelectValue("edit-cat", producto.categoria || "");
    setSelectValue("edit-ubic", producto.ubicacion || "");
  }, 50);

  const preview = document.getElementById("modal-preview");
  if (producto.imagen_url) {
    document.getElementById("modal-preview-img").src = producto.imagen_url;
    document.getElementById("modal-preview-name").textContent = producto.nombre;
    preview.style.display = "block";
  } else {
    preview.style.display = "none";
  }

  document.getElementById("edit-modal").classList.add("active");
  toggleBodyScroll(true);
}

export async function saveEdit() {
  const nombre = document.getElementById("edit-nombre").value.trim();
  if (!nombre) {
    showToast("Ingresá el nombre");
    return;
  }

  const btn = document.querySelector("#edit-modal .btn.primary");
  btn.disabled = true;
  setLoading(true, "Guardando...");
  const { error } = await sb.from("productos").update({
    nombre,
    categoria: document.getElementById("edit-cat").value,
    ubicacion: document.getElementById("edit-ubic").value,
    barcode: document.getElementById("edit-barcode").value.trim(),
  }).eq("id", state.editId);

  if (!error) {
    const producto = state.productos.find((item) => item.id === state.editId);
    if (producto) {
      producto.nombre = nombre;
      producto.categoria = document.getElementById("edit-cat").value;
      producto.ubicacion = document.getElementById("edit-ubic").value;
      producto.barcode = document.getElementById("edit-barcode").value.trim();
    }
    renderList();
    showToast("✓ Producto actualizado");
    closeEditModal();
  } else {
    showToast("Error al guardar");
  }

  setLoading(false);
  btn.disabled = false;
}

export function closeEditModal(event) {
  if (event && event.target !== document.getElementById("edit-modal")) return;
  document.getElementById("edit-modal").classList.remove("active");
  toggleBodyScroll(false);
  state.editId = null;
}
