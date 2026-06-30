import { state } from "../state.js";
import { sb } from "../services/supabase.js";
import { renderList } from "./render.js";
import { setLoading, showToast, toggleBodyScroll } from "../utils/ui.js";

export function openLoteModal(productoId, loteId) {
  const producto = state.productos.find((item) => item.id === productoId);
  if (!producto) return;

  state.loteModalProductoId = productoId;
  state.loteModalLoteId = loteId;

  const img = producto.imagen_url
    ? `<img src="${producto.imagen_url}" alt="" style="width:40px;height:40px;object-fit:contain;border-radius:8px;background:#fff;border:1px solid var(--border);flex-shrink:0">`
    : '<div style="width:40px;height:40px;border-radius:8px;background:var(--surface);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--text-tertiary);font-size:18px"><i class="ti ti-box"></i></div>';

  document.getElementById("lote-modal-product").innerHTML = `${img}<div><div style="font-size:14px;font-weight:500;color:var(--text-primary)">${producto.nombre}</div><div style="font-size:12px;color:var(--text-secondary)">${producto.categoria || ""}${producto.ubicacion ? ` · ${producto.ubicacion}` : ""}</div></div>`;

  if (loteId) {
    const lote = state.lotes.find((item) => item.id === loteId);
    document.getElementById("lote-fecha").value = lote?.fecha_venc || "";
    document.getElementById("lote-modal-title").textContent = "Editar fecha de lote";
    document.getElementById("lote-qty-wrap").style.display = "none";
    document.getElementById("lote-delete-btn").style.display = "flex";
  } else {
    state.loteQty = 1;
    document.getElementById("qty-lote").textContent = 1;
    document.getElementById("lote-fecha").value = "";
    document.getElementById("lote-modal-title").textContent = "Agregar lote";
    document.getElementById("lote-qty-wrap").style.display = "block";
    document.getElementById("lote-delete-btn").style.display = "none";
  }

  document.getElementById("lote-modal").classList.add("active");
  toggleBodyScroll(true);
}

export function closeLoteModal(event) {
  if (event && event.target !== document.getElementById("lote-modal")) return;
  document.getElementById("lote-modal").classList.remove("active");
  toggleBodyScroll(false);
  state.loteModalProductoId = null;
  state.loteModalLoteId = null;
}

export async function saveLote() {
  const fecha = document.getElementById("lote-fecha").value;
  const btn = document.querySelector("#lote-modal .btn.primary");
  btn.disabled = true;
  setLoading(true, "Guardando lote...");

  if (state.loteModalLoteId) {
    const { error } = await sb.from("lotes").update({ fecha_venc: fecha || null }).eq("id", state.loteModalLoteId);
    if (!error) {
      const lote = state.lotes.find((item) => item.id === state.loteModalLoteId);
      if (lote) lote.fecha_venc = fecha || null;
    }
  } else {
    const { data, error } = await sb.from("lotes").insert({
      producto_id: state.loteModalProductoId,
      cantidad: state.loteQty,
      fecha_venc: fecha || null,
    }).select().single();
    if (!error && data) state.lotes.push(data);
  }

  renderList();
  showToast("✓ Lote guardado");
  closeLoteModal();
  setLoading(false);
  btn.disabled = false;
}

export async function deleteLote() {
  if (!state.loteModalLoteId || !window.confirm("¿Eliminar este lote?")) return;
  setLoading(true, "Eliminando...");
  await sb.from("lotes").delete().eq("id", state.loteModalLoteId);
  state.lotes = state.lotes.filter((lote) => lote.id !== state.loteModalLoteId);
  renderList();
  showToast("Lote eliminado");
  closeLoteModal();
  setLoading(false);
}
