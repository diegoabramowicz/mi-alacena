import { state } from "../state.js";
import { setCurrentAnalyticsPage, trackPageView } from "../services/analytics.js";
import { resetManualForm } from "./manual.js";
import { closeFilterSheet, renderList } from "./render.js";
import { stopScan } from "./scanner.js";

function resetAppScroll() {
  window.scrollTo({ top: 0, behavior: "auto" });
}

export function showPage(name) {
  document.querySelectorAll(".page").forEach((page) => page.classList.remove("active"));
  document.querySelectorAll(".tab").forEach((tab) => tab.classList.remove("active"));
  document.getElementById(`page-${name}`).classList.add("active");
  document.getElementById(`tab-${name}`).classList.add("active");
  if (name !== "inventario") closeFilterSheet();
  if (name === "inventario") renderList();
  if (name === "manual") resetManualForm();
  if (name !== "scanner" && state.scanning) stopScan();
  resetAppScroll();
  if (name === "inventario") {
    trackPageView("inventory", {
      product_count: state.productos.length,
      lot_count: state.lotes.length,
    });
    return;
  }
  setCurrentAnalyticsPage(name);
}
