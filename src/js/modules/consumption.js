import { state } from "../state.js";
import { sb } from "../services/supabase.js";
import { diasLabel, fmtF, getEstado, lotesDeProducto } from "../utils/date.js";
import { renderList } from "./render.js";
import { setLoading, showToast, toggleBodyScroll } from "../utils/ui.js";

export function openConsumoModal(productoId) {
  const producto = state.productos.find((item) => item.id === productoId);
  const productoLotes = lotesDeProducto(productoId);
  if (!producto || !productoLotes.length) {
    showToast("Sin lotes registrados");
    return;
  }

  state.consumoProductoId = productoId;
  state.consumoDelta = {};

  const img = producto.imagen_url
    ? `<img src="${producto.imagen_url}" alt="" style="width:40px;height:40px;object-fit:contain;border-radius:8px;background:#fff;border:1px solid var(--border);flex-shrink:0">`
    : '<div style="width:40px;height:40px;border-radius:8px;background:var(--surface);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--text-tertiary);font-size:18px"><i class="ti ti-box"></i></div>';

  document.getElementById("consumo-product").innerHTML = `${img}<div><div style="font-size:14px;font-weight:500;color:var(--text-primary)">${producto.nombre}</div><div style="font-size:12px;color:var(--text-secondary)">Indicá cuánto consumiste de cada lote</div></div>`;

  document.getElementById("consumo-lotes").innerHTML = productoLotes.map((lote) => {
    const estado = getEstado(lote.fecha_venc);
    const label = lote.fecha_venc ? `${fmtF(lote.fecha_venc)} · ${diasLabel(lote.fecha_venc)}` : "Sin fecha";
    return `<div class="consumo-lote-row">
      <div style="display:flex;align-items:center;gap:8px;flex:1;min-width:0">
        <span class="lote-dot ${estado}"></span>
        <div style="min-width:0">
          <div style="font-size:13px;font-weight:500;color:var(--text-primary)">Stock: ×<span id="cstock-${lote.id}">${lote.cantidad}</span></div>
          <div style="font-size:11px;color:var(--text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${label}</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
        <button class="qty-btn" onclick="stepConsumo('${lote.id}',-1,${lote.cantidad})">−</button>
        <span class="qty-val" id="cdelta-${lote.id}" style="font-family:var(--font-mono);font-weight:600;min-width:20px;text-align:center;color:var(--red)">0</span>
        <button class="qty-btn" onclick="stepConsumo('${lote.id}',1,${lote.cantidad})">+</button>
      </div>
    </div>`;
  }).join("");

  document.getElementById("consumo-modal").classList.add("active");
  toggleBodyScroll(true);
}

export function stepConsumo(loteId, delta, max) {
  const current = state.consumoDelta[loteId] || 0;
  const next = Math.max(0, Math.min(max, current + delta));
  state.consumoDelta[loteId] = next;
  document.getElementById(`cdelta-${loteId}`).textContent = next;
  const lote = state.lotes.find((item) => item.id === loteId);
  if (lote) document.getElementById(`cstock-${loteId}`).textContent = lote.cantidad - next;
}

export function closeConsumoModal(event) {
  if (event && event.target !== document.getElementById("consumo-modal")) return;
  document.getElementById("consumo-modal").classList.remove("active");
  toggleBodyScroll(false);
  state.consumoProductoId = null;
  state.consumoDelta = {};
}

export async function confirmarConsumo() {
  const entradas = Object.entries(state.consumoDelta).filter(([, value]) => value > 0);
  if (!entradas.length) {
    showToast("No indicaste nada para consumir");
    return;
  }

  const btn = document.querySelector("#consumo-modal .btn.primary");
  btn.disabled = true;
  setLoading(true, "Guardando consumo...");

  let total = 0;
  for (const [loteId, delta] of entradas) {
    const lote = state.lotes.find((item) => item.id === loteId);
    if (!lote) continue;
    const nuevaCantidad = Math.max(0, lote.cantidad - delta);
    total += delta;

    if (nuevaCantidad === 0) {
      await sb.from("lotes").delete().eq("id", loteId);
      state.lotes = state.lotes.filter((item) => item.id !== loteId);
    } else {
      await sb.from("lotes").update({ cantidad: nuevaCantidad }).eq("id", loteId);
      lote.cantidad = nuevaCantidad;
    }
  }

  renderList();
  showToast(`−${total} consumidos`);
  closeConsumoModal();
  setLoading(false);
  btn.disabled = false;
}
