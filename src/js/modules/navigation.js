import { state } from "../state.js";
import { resetManualForm } from "./manual.js";
import { renderList } from "./render.js";
import { stopScan } from "./scanner.js";

export function showPage(name) {
  document.querySelectorAll(".page").forEach((page) => page.classList.remove("active"));
  document.querySelectorAll(".tab").forEach((tab) => tab.classList.remove("active"));
  document.getElementById(`page-${name}`).classList.add("active");
  document.getElementById(`tab-${name}`).classList.add("active");
  if (name === "inventario") renderList();
  if (name === "manual") resetManualForm();
  if (name !== "scanner" && state.scanning) stopScan();
}
