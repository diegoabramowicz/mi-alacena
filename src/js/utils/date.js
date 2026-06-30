import { state } from "../state.js";

export function normalizarFecha(val) {
  if (!val) return "";
  if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  const date = new Date(val);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

export function getEstado(fecha) {
  if (!fecha) return "ok";
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const diff = (new Date(`${fecha}T00:00:00`) - hoy) / 86400000;
  return diff < 0 ? "vencido" : diff <= 7 ? "pronto" : "ok";
}

export function fmtF(fecha) {
  if (!fecha) return "—";
  const [y, m, d] = fecha.split("-");
  return `${d}/${m}/${y}`;
}

export function diasLabel(fecha) {
  if (!fecha) return "";
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const diff = Math.round((new Date(`${fecha}T00:00:00`) - hoy) / 86400000);
  if (diff < 0) return `Venció hace ${Math.abs(diff)} día${Math.abs(diff) !== 1 ? "s" : ""}`;
  if (diff === 0) return "Vence hoy";
  if (diff === 1) return "Vence mañana";
  return `Vence en ${diff} días`;
}

export function lotesDeProducto(id) {
  return state.lotes
    .filter((lote) => lote.producto_id === id)
    .sort((a, b) => {
      if (!a.fecha_venc && !b.fecha_venc) return 0;
      if (!a.fecha_venc) return 1;
      if (!b.fecha_venc) return -1;
      return a.fecha_venc.localeCompare(b.fecha_venc);
    });
}

export function totalCantidad(id) {
  return lotesDeProducto(id).reduce((sum, lote) => sum + (parseInt(lote.cantidad, 10) || 0), 0);
}

export function estadoProducto(id) {
  const productoLotes = lotesDeProducto(id);
  if (!productoLotes.length) return "ok";
  const estados = productoLotes.map((lote) => getEstado(lote.fecha_venc));
  if (estados.includes("vencido")) return "vencido";
  if (estados.includes("pronto")) return "pronto";
  return "ok";
}
