import { state } from "../state.js";
import { sb } from "../services/supabase.js";
import { fetchOFF } from "../services/open-food-facts.js";
import { handleInventoryProductAdded } from "./activation.js";
import { agregarProductoNuevo } from "./data.js";
import { showPage } from "./navigation.js";
import { renderList, renderSelects } from "./render.js";
import { clearInlineError, setInlineError, setLoading, setSelectValue, showToast } from "../utils/ui.js";

export function setManualState(name) {
  document.querySelectorAll("#page-manual .form-section").forEach((section) => section.classList.remove("active"));
  document.getElementById(`manual-${name}`).classList.add("active");
}

export function showManualBlank() {
  clearInlineError("manual-error");
  state.manualOFFImg = "";
  state.editId = null;
  document.getElementById("m-preview").style.display = "none";
  document.getElementById("m-nombre").value = "";
  document.getElementById("m-fecha").value = "";
  document.getElementById("m-barcode").value = "";
  document.getElementById("manual-title").textContent = "Nuevo producto";
  state.qtyManual = 1;
  document.getElementById("qty-manual").textContent = 1;
  setManualState("form");
}

export function fillManualFromProduct(producto) {
  clearInlineError("manual-error");
  state.editId = producto.id;
  state.manualOFFImg = producto.imagen_url || "";
  document.getElementById("m-nombre").value = producto.nombre || "";
  document.getElementById("m-fecha").value = "";
  document.getElementById("m-barcode").value = producto.barcode || "";
  document.getElementById("manual-title").textContent = "Editar producto";
  state.qtyManual = 1;
  document.getElementById("qty-manual").textContent = 1;
  renderSelects();
  window.setTimeout(() => {
    setSelectValue("m-cat", producto.categoria || "");
    setSelectValue("m-ubic", producto.ubicacion || "");
  }, 50);
  if (producto.imagen_url) {
    document.getElementById("m-preview-img").src = producto.imagen_url;
    document.getElementById("m-preview-name").textContent = producto.nombre;
    document.getElementById("m-preview-source").textContent = "Producto existente";
    document.getElementById("m-preview").style.display = "block";
  } else {
    document.getElementById("m-preview").style.display = "none";
  }
  setManualState("form");
}

export async function fillManualFromOFF(off) {
  clearInlineError("manual-error");
  state.editId = null;
  state.manualOFFImg = off.img || "";
  if (off.nombre) document.getElementById("m-nombre").value = off.nombre;
  if (off.cat) setSelectValue("m-cat", off.cat);
  document.getElementById("manual-title").textContent = "Nuevo producto";
  if (off.img) {
    document.getElementById("m-preview-img").src = off.img;
    document.getElementById("m-preview-name").textContent = off.nombre || "";
    document.getElementById("m-preview-source").textContent = "Open Food Facts";
    document.getElementById("m-preview").style.display = "block";
  } else {
    document.getElementById("m-preview").style.display = "none";
  }
  setManualState("form");
}

export async function searchOFF() {
  const query = document.getElementById("m-search").value.trim();
  if (!query) return;

  const btn = document.getElementById("btn-off-search");
  btn.disabled = true;
  btn.innerHTML = '<i class="ti ti-loader" style="animation:spin .7s linear infinite"></i> Buscando...';

  setLoading(true, "Buscando en Open Food Facts...");
  const off = await fetchOFF(query);
  setLoading(false);
  btn.disabled = false;
  btn.innerHTML = '<i class="ti ti-world"></i> Buscar en Open Food Facts';

  if (off && (off.nombre || off.img)) {
    await fillManualFromOFF(off);
    return;
  }

  showToast("No encontrado — cargalo manualmente");
  showManualBlank();
  if (/^\d+$/.test(query)) document.getElementById("m-barcode").value = query;
  else document.getElementById("m-nombre").value = query;
}

export async function saveManual() {
  clearInlineError("manual-error");
  const nombre = document.getElementById("m-nombre").value.trim();
  const wasEditing = !!state.editId;
  if (!nombre) {
    setInlineError("manual-error", "Ingresá el nombre del producto.");
    return;
  }

  const btn = document.getElementById("btn-save-manual");
  btn.disabled = true;
  setLoading(true, state.editId ? "Guardando cambios..." : "Guardando producto...");

  try {
    if (state.editId) {
      const { error } = await sb.from("productos").update({
        nombre,
        categoria: document.getElementById("m-cat").value,
        ubicacion: document.getElementById("m-ubic").value,
        barcode: document.getElementById("m-barcode").value.trim(),
      }).eq("id", state.editId);

      if (error) {
        throw error;
      }

      const producto = state.productos.find((item) => item.id === state.editId);
      if (producto) {
        producto.nombre = nombre;
        producto.categoria = document.getElementById("m-cat").value;
        producto.ubicacion = document.getElementById("m-ubic").value;
        producto.barcode = document.getElementById("m-barcode").value.trim();
      }

      const fecha = document.getElementById("m-fecha").value;
      if (state.qtyManual > 0 && fecha) {
        const { data: lote } = await sb.from("lotes").insert({
          producto_id: state.editId,
          cantidad: state.qtyManual,
          fecha_venc: fecha || null,
        }).select().single();
        if (lote) state.lotes.push(lote);
      }
      showToast("✓ Producto actualizado");
    } else {
      await agregarProductoNuevo(
        nombre,
        document.getElementById("m-cat").value,
        document.getElementById("m-ubic").value,
        document.getElementById("m-barcode").value.trim(),
        state.manualOFFImg,
        state.qtyManual,
        document.getElementById("m-fecha").value,
      );
    }

    renderList();
    resetManualForm();
    showPage("inventario");
    if (!wasEditing) {
      await handleInventoryProductAdded();
    }
  } catch {
    setInlineError("manual-error", "No pudimos guardar el producto.");
  }

  setLoading(false);
  btn.disabled = false;
}

export function resetManualForm() {
  clearInlineError("manual-error");
  state.editId = null;
  state.manualOFFImg = "";
  document.getElementById("m-search").value = "";
  document.getElementById("ac-list").innerHTML = "";
  document.getElementById("ac-list").classList.remove("open");
  document.getElementById("off-search-wrap").style.display = "none";
  setManualState("search");
}

export function acInput(val) {
  const list = document.getElementById("ac-list");
  const offWrap = document.getElementById("off-search-wrap");
  state.acIndex = -1;
  if (!val.trim()) {
    list.classList.remove("open");
    list.innerHTML = "";
    offWrap.style.display = "none";
    return;
  }

  offWrap.style.display = "block";
  const query = val.toLowerCase();
  const seen = new Set();
  const matches = state.productos.filter((producto) => {
    const nombre = (producto.nombre || "").toLowerCase();
    const barcode = (producto.barcode || "").toLowerCase();
    if (!nombre.includes(query) && !barcode.includes(query)) return false;
    if (seen.has(producto.nombre)) return false;
    seen.add(producto.nombre);
    return true;
  }).slice(0, 6);

  if (!matches.length) {
    list.classList.remove("open");
    list.innerHTML = "";
    return;
  }

  list.innerHTML = matches.map((producto, index) => {
    const img = producto.imagen_url
      ? `<img src="${producto.imagen_url}" alt="" class="product-tiny-shot">`
      : '<div class="product-tiny-shot product-tiny-shot-placeholder"><i class="ti ti-box"></i></div>';
    return `<div class="autocomplete-item" data-index="${index}" onmousedown="acSelectProduct(event,'${producto.id}')">${img}<div style="min-width:0"><strong>${highlight(producto.nombre, val)}</strong><small>${[producto.categoria, producto.ubicacion].filter(Boolean).join(" · ")}</small></div></div>`;
  }).join("");
  list.classList.add("open");
}

export function acSelectProduct(event, id) {
  event.preventDefault();
  document.getElementById("ac-list").classList.remove("open");
  const producto = state.productos.find((item) => item.id === id);
  if (producto) fillManualFromProduct(producto);
}

function highlight(text, query) {
  const index = text.toLowerCase().indexOf(query.toLowerCase());
  if (index === -1) return text;
  return text.slice(0, index) + `<mark style="background:var(--red-light);color:var(--red);border-radius:2px;padding:0 1px">${text.slice(index, index + query.length)}</mark>` + text.slice(index + query.length);
}

export function acKeydown(event) {
  const list = document.getElementById("ac-list");
  const items = list.querySelectorAll(".autocomplete-item");
  if (!items.length) return;

  if (event.key === "ArrowDown") {
    event.preventDefault();
    state.acIndex = Math.min(state.acIndex + 1, items.length - 1);
    items.forEach((item, index) => item.classList.toggle("selected", index === state.acIndex));
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    state.acIndex = Math.max(state.acIndex - 1, 0);
    items.forEach((item, index) => item.classList.toggle("selected", index === state.acIndex));
  } else if (event.key === "Enter" && state.acIndex >= 0) {
    event.preventDefault();
    items[state.acIndex].dispatchEvent(new MouseEvent("mousedown"));
  } else if (event.key === "Escape") {
    list.classList.remove("open");
  }
}

export function acBlur() {
  window.setTimeout(() => document.getElementById("ac-list").classList.remove("open"), 150);
}
