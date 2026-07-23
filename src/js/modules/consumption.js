import { state } from "../state.js";
import { sb } from "../services/supabase.js";
import { trackEvent } from "../services/analytics.js";
import { diasLabel, fmtF, getEstado, lotesDeProducto } from "../utils/date.js";
import { fetchData } from "./data.js";
import { renderList } from "./render.js";
import { setLoading, showToast, toggleBodyScroll } from "../utils/ui.js";

function totalConsumoSeleccionado() {
  return Object.values(state.consumoDelta).reduce((sum, value) => sum + (value || 0), 0);
}

function setConsumoError(message = "") {
  const summary = document.getElementById("consumo-summary");
  if (!summary) return;
  summary.textContent = message || "Selecciona cuánto consumiste de cada lote.";
  summary.classList.toggle("error", Boolean(message));
}

function updateConsumoSummary() {
  const total = totalConsumoSeleccionado();
  const summary = document.getElementById("consumo-summary");
  const button = document.getElementById("consumo-confirm-btn");
  if (summary) {
    summary.textContent = total > 0
      ? `Vas a descontar ${total} ${total === 1 ? "unidad" : "unidades"}`
      : "Selecciona cuánto consumiste de cada lote.";
    summary.classList.remove("error");
  }
  if (button) {
    button.disabled = total === 0;
    button.innerHTML = `<i class="ti ti-check"></i> ${total > 0 ? `Descontar ${total}` : "Confirmar descuento"}`;
  }
}

function renderConsumoRows(productoLotes) {
  const container = document.getElementById("consumo-lotes");
  if (!container) return;

  container.innerHTML = productoLotes.map((lote) => {
    const estado = getEstado(lote.fecha_venc);
    const selected = state.consumoDelta[lote.id] || 0;
    const available = Math.max(0, lote.cantidad - selected);
    const hasStock = lote.cantidad > 0;
    const activeClass = selected > 0 ? " active" : "";
    const disabledClass = hasStock ? "" : " disabled";
    const label = lote.fecha_venc ? diasLabel(lote.fecha_venc) : "Sin fecha de vencimiento";
    const dateLabel = lote.fecha_venc ? fmtF(lote.fecha_venc) : "Sin fecha";

    return `<div class="consumo-lote-row ${estado}${activeClass}${disabledClass}">
      <div class="consumo-lote-accent ${estado}"></div>
      <div class="consumo-lote-main">
        <div class="consumo-lote-copy">
          <div class="consumo-lote-date">${dateLabel}</div>
          <div class="consumo-lote-status">${label}</div>
        </div>
        <div class="consumo-lote-meta">
          <span class="consumo-lote-available">${lote.cantidad} disponibles</span>
          ${lote.cantidad > 1 ? `<button class="consumo-fill-btn" type="button" onclick="fillConsumo('${lote.id}', ${lote.cantidad})" ${available === 0 ? "disabled" : ""}>Usar todo</button>` : ""}
        </div>
      </div>
      <div class="consumo-stepper">
        <button class="qty-btn" type="button" onclick="stepConsumo('${lote.id}',-1,${lote.cantidad})" ${selected === 0 ? "disabled" : ""}>−</button>
        <span class="consumo-stepper-value" id="cdelta-${lote.id}">${selected}</span>
        <button class="qty-btn" type="button" onclick="stepConsumo('${lote.id}',1,${lote.cantidad})" ${available === 0 || !hasStock ? "disabled" : ""}>+</button>
      </div>
    </div>`;
  }).join("");
}

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
    ? `<img src="${producto.imagen_url}" alt="" class="product-mini-shot">`
    : '<div class="product-mini-shot product-mini-shot-placeholder"><i class="ti ti-box"></i></div>';

  document.getElementById("consumo-product").innerHTML = `${img}<div><div class="consumo-product-name">${producto.nombre}</div><div class="consumo-product-sub">Indicá cuántas unidades consumiste de cada lote.</div></div>`;

  renderConsumoRows(productoLotes);
  updateConsumoSummary();

  document.getElementById("consumo-modal").classList.add("active");
  toggleBodyScroll(true);
}

export function stepConsumo(loteId, delta, max) {
  const current = state.consumoDelta[loteId] || 0;
  const next = Math.max(0, Math.min(max, current + delta));
  state.consumoDelta[loteId] = next;
  renderConsumoRows(lotesDeProducto(state.consumoProductoId));
  updateConsumoSummary();
}

export function fillConsumo(loteId, max) {
  state.consumoDelta[loteId] = max;
  renderConsumoRows(lotesDeProducto(state.consumoProductoId));
  updateConsumoSummary();
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
    setConsumoError("Selecciona al menos una unidad para descontar.");
    return;
  }

  const btn = document.getElementById("consumo-confirm-btn");
  btn.disabled = true;
  setLoading(true, "Guardando consumo...");

  let total = 0;
  try {
    for (const [loteId, delta] of entradas) {
      const lote = state.lotes.find((item) => item.id === loteId);
      if (!lote) continue;
      const nuevaCantidad = Math.max(0, lote.cantidad - delta);
      total += delta;

      if (nuevaCantidad === 0) {
        const { error } = await sb.from("lotes").delete().eq("id", loteId);
        if (error) throw error;
      } else {
        const { error } = await sb.from("lotes").update({ cantidad: nuevaCantidad }).eq("id", loteId);
        if (error) throw error;
      }
    }
    await fetchData();
    trackEvent("stock_discount_confirmed", {
      total_units: total,
      lot_count: entradas.length,
    });
    renderList();
    showToast(`−${total} consumidos`);
    closeConsumoModal();
  } catch {
    setConsumoError("No pudimos guardar este descuento. Inténtalo de nuevo.");
  } finally {
    setLoading(false);
    btn.disabled = false;
  }
}
