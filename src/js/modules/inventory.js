import { state } from "../state.js";
import { sb } from "../services/supabase.js";
import { renderList, renderSelects } from "./render.js";
import { clearInlineError, openConfirmModal, setInlineError, setLoading, setSelectValue, showToast, toggleBodyScroll } from "../utils/ui.js";

export function eliminarProducto(id) {
  const producto = state.productos.find((item) => item.id === id);
  openConfirmModal({
    title: "Eliminar producto",
    message: producto
      ? `Se va a eliminar "${producto.nombre}" junto con todos sus lotes.`
      : "Se va a eliminar este producto junto con todos sus lotes.",
    confirmLabel: "Eliminar producto",
    confirmTone: "danger",
    onConfirm: async () => {
      setLoading(true, "Eliminando...");
      try {
        const { error } = await sb.from("productos").delete().eq("id", id);
        if (error) {
          showToast("No pudimos eliminar el producto.", { type: "error" });
          throw error;
        }
        state.productos = state.productos.filter((item) => item.id !== id);
        state.lotes = state.lotes.filter((lote) => lote.producto_id !== id);
        renderList();
        showToast("Producto eliminado");
      } finally {
        setLoading(false);
      }
    },
  });
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
  clearInlineError("edit-error");
  const nombre = document.getElementById("edit-nombre").value.trim();
  if (!nombre) {
    setInlineError("edit-error", "Ingresá el nombre del producto.");
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
    setInlineError("edit-error", "No pudimos guardar los cambios.");
  }

  setLoading(false);
  btn.disabled = false;
}

export function closeEditModal(event) {
  if (event && event.target !== document.getElementById("edit-modal")) return;
  document.getElementById("edit-modal").classList.remove("active");
  toggleBodyScroll(false);
  state.editId = null;
  clearInlineError("edit-error");
}
