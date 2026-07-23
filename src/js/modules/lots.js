import { state } from "../state.js";
import { sb } from "../services/supabase.js";
import { trackEvent } from "../services/analytics.js";
import { renderList } from "./render.js";
import { setLoading, showToast, toggleBodyScroll } from "../utils/ui.js";

export function openLoteModal(productoId) {
  const producto = state.productos.find((item) => item.id === productoId);
  if (!producto) return;

  state.loteModalProductoId = productoId;

  const img = producto.imagen_url
    ? `<img src="${producto.imagen_url}" alt="" class="product-mini-shot">`
    : '<div class="product-mini-shot product-mini-shot-placeholder"><i class="ti ti-box"></i></div>';

  document.getElementById("lote-modal-product").innerHTML = `${img}<div><div style="font-size:14px;font-weight:500;color:var(--text-primary)">${producto.nombre}</div><div style="font-size:12px;color:var(--text-secondary)">${producto.categoria || ""}${producto.ubicacion ? ` · ${producto.ubicacion}` : ""}</div></div>`;

  state.loteQty = 1;
  document.getElementById("qty-lote").textContent = 1;
  document.getElementById("lote-fecha").value = "";
  document.getElementById("lote-modal-title").textContent = "Agregar lote";
  document.getElementById("lote-qty-wrap").style.display = "block";

  document.getElementById("lote-modal").classList.add("active");
  toggleBodyScroll(true);
}

export function closeLoteModal(event) {
  if (event && event.target !== document.getElementById("lote-modal")) return;
  document.getElementById("lote-modal").classList.remove("active");
  toggleBodyScroll(false);
  state.loteModalProductoId = null;
}

export async function saveLote() {
  const fecha = document.getElementById("lote-fecha").value;
  const btn = document.querySelector("#lote-modal .btn.primary");
  btn.disabled = true;
  setLoading(true, "Guardando lote...");

  try {
    const { data, error } = await sb.from("lotes").insert({
      producto_id: state.loteModalProductoId,
      cantidad: state.loteQty,
      fecha_venc: fecha || null,
    }).select().single();

    if (error || !data) {
      showToast("No pudimos guardar el lote.", { type: "error" });
      return;
    }

    state.lotes.push(data);
    trackEvent("lot_added", { source: "inventory", quantity: state.loteQty, has_expiry: Boolean(fecha) });
    renderList();
    showToast("✓ Lote guardado");
    closeLoteModal();
  } finally {
    setLoading(false);
    btn.disabled = false;
  }
}
