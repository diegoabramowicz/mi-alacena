import { state } from "../state.js";

export function changeQty(delta, context) {
  if (context === "scan") {
    state.qtyScan = Math.max(1, state.qtyScan + delta);
    document.querySelectorAll("#qty-scan").forEach((el) => { el.textContent = state.qtyScan; });
    return;
  }

  if (context === "lote") {
    state.loteQty = Math.max(1, state.loteQty + delta);
    document.getElementById("qty-lote").textContent = state.loteQty;
    return;
  }

  state.qtyManual = Math.max(1, state.qtyManual + delta);
  document.getElementById("qty-manual").textContent = state.qtyManual;
}
