import { state } from "../state.js";
import { diasLabel, estadoProducto, fmtF, getEstado, lotesDeProducto, totalCantidad } from "../utils/date.js";

function lotesVisibles(productoId, estadoFiltro) {
  const lotes = lotesDeProducto(productoId);
  if (!estadoFiltro) return lotes;
  return lotes.filter((lote) => getEstado(lote.fecha_venc) === estadoFiltro);
}

function totalCantidadLotes(lotes) {
  return lotes.reduce((sum, lote) => sum + (parseInt(lote.cantidad, 10) || 0), 0);
}

function estadoLotes(lotes, productoId) {
  if (!lotes.length) return estadoProducto(productoId);
  const estados = lotes.map((lote) => getEstado(lote.fecha_venc));
  if (estados.includes("vencido")) return "vencido";
  if (estados.includes("pronto")) return "pronto";
  return "ok";
}

function getInventoryFilterKey(estado, categoria) {
  return `${estado}::${categoria}`;
}

function getLotesRenderState(productoId, lotes) {
  const expanded = !!state.expandedProductLotes[productoId];
  const hasMore = lotes.length > 0;
  return { expanded, hasMore };
}

function getToggleLabel(totalCount, expanded) {
  return expanded
    ? "Ocultar detalle"
    : totalCount > 1
      ? `Ver ${totalCount - 1} lote${totalCount - 1 === 1 ? "" : "s"} más`
      : "Ver detalle del lote";
}

function getUrgentLote(lotes) {
  if (!lotes.length) {
    return null;
  }

  const nextLote = lotes.find((lote) => !!lote.fecha_venc) || lotes[0];
  return lotes.find((lote) => getEstado(lote.fecha_venc) === "vencido")
    || lotes.find((lote) => getEstado(lote.fecha_venc) === "pronto")
    || nextLote;
}

function syncProductMenuDom() {
  document.querySelectorAll(".prod-menu-panel").forEach((panel) => {
    panel.classList.remove("open");
  });

  if (!state.openProductMenuId) return;

  document
    .querySelector(`#card-${state.openProductMenuId} .prod-menu-panel`)
    ?.classList.add("open");
}

export function toggleProductLotes(productoId) {
  state.expandedProductLotes[productoId] = !state.expandedProductLotes[productoId];
  state.openProductMenuId = null;
  syncProductMenuDom();
  const expanded = !!state.expandedProductLotes[productoId];
  const card = document.getElementById(`card-${productoId}`);
  const button = document.getElementById(`toggle-lotes-${productoId}`);

  if (card) {
    card.classList.toggle("expanded", expanded);
  }

  if (button) {
    const totalCount = parseInt(button.dataset.totalLotes || "0", 10);
    button.textContent = getToggleLabel(totalCount, expanded);
  }
}

export function toggleProductMenu(productoId, event) {
  event?.stopPropagation();
  state.openProductMenuId = state.openProductMenuId === productoId ? null : productoId;
  syncProductMenuDom();
}

export function closeProductMenus() {
  if (!state.openProductMenuId) return;
  state.openProductMenuId = null;
  syncProductMenuDom();
}

export function renderSelects() {
  ["new-cat", "m-cat", "edit-cat"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const cur = el.value;
    el.innerHTML = state.categorias.map((categoria) => `<option value="${categoria.nombre}">${categoria.nombre}</option>`).join("");
    if (cur) el.value = cur;
  });

  ["new-ubic", "m-ubic", "edit-ubic"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const cur = el.value;
    el.innerHTML = '<option value="">— Sin ubicación —</option>' +
      state.ubicaciones.map((ubicacion) => `<option value="${ubicacion.nombre}">${ubicacion.nombre}</option>`).join("");
    if (cur) el.value = cur;
  });

  const filterCategoria = document.getElementById("filter-cat");
  if (filterCategoria) {
    const cur = filterCategoria.value;
    filterCategoria.innerHTML = '<option value="">Todas las categorías</option>' +
      state.categorias.map((categoria) => `<option value="${categoria.nombre}">${categoria.nombre}</option>`).join("");
    if (cur) filterCategoria.value = cur;
  }

  const mobileFilterCategoria = document.getElementById("mobile-filter-cat");
  if (mobileFilterCategoria) {
    const cur = mobileFilterCategoria.value;
    mobileFilterCategoria.innerHTML = '<option value="">Todas las categorías</option>' +
      state.categorias.map((categoria) => `<option value="${categoria.nombre}">${categoria.nombre}</option>`).join("");
    if (cur) mobileFilterCategoria.value = cur;
  }

  syncMobileFilterControls();
  renderSettingsLists();
}

export function syncMobileFilterControls() {
  const desktopEstado = document.getElementById("filter-est");
  const desktopCategoria = document.getElementById("filter-cat");
  const mobileEstado = document.getElementById("mobile-filter-est");
  const mobileCategoria = document.getElementById("mobile-filter-cat");
  if (desktopEstado && mobileEstado) mobileEstado.value = desktopEstado.value || "";
  if (desktopCategoria && mobileCategoria) mobileCategoria.value = desktopCategoria.value || "";
}

export function openFilterSheet() {
  syncMobileFilterControls();
  document.getElementById("filter-sheet-overlay")?.classList.add("active");
  document.body.style.overflow = "hidden";
}

export function closeFilterSheet(event) {
  const overlay = document.getElementById("filter-sheet-overlay");
  if (event && event.target !== overlay) return;
  overlay?.classList.remove("active");
  document.body.style.overflow = "";
}

export function applyMobileFilters() {
  const desktopEstado = document.getElementById("filter-est");
  const desktopCategoria = document.getElementById("filter-cat");
  const mobileEstado = document.getElementById("mobile-filter-est");
  const mobileCategoria = document.getElementById("mobile-filter-cat");
  if (desktopEstado && mobileEstado) desktopEstado.value = mobileEstado.value;
  if (desktopCategoria && mobileCategoria) desktopCategoria.value = mobileCategoria.value;
  renderList();
  closeFilterSheet();
}

export function clearMobileFilters() {
  const desktopEstado = document.getElementById("filter-est");
  const desktopCategoria = document.getElementById("filter-cat");
  const mobileEstado = document.getElementById("mobile-filter-est");
  const mobileCategoria = document.getElementById("mobile-filter-cat");
  if (desktopEstado) desktopEstado.value = "";
  if (desktopCategoria) desktopCategoria.value = "";
  if (mobileEstado) mobileEstado.value = "";
  if (mobileCategoria) mobileCategoria.value = "";
  renderList();
  closeFilterSheet();
}

export function renderSettingsLists() {
  const catsEl = document.getElementById("settings-cats");
  const ubicsEl = document.getElementById("settings-ubics");
  if (!catsEl || !ubicsEl) return;

  catsEl.innerHTML = state.categorias.length
    ? state.categorias.map((categoria) => `<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="font-size:14px">${categoria.nombre}</span><button class="icon-btn" onclick="eliminarCategoria('${categoria.id}')"><i class="ti ti-trash"></i></button></div>`).join("")
    : '<p style="font-size:13px;color:var(--text-tertiary);padding:8px 0">Sin categorías todavía</p>';

  ubicsEl.innerHTML = state.ubicaciones.length
    ? state.ubicaciones.map((ubicacion) => `<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="font-size:14px">${ubicacion.nombre}</span><button class="icon-btn" onclick="eliminarUbicacion('${ubicacion.id}')"><i class="ti ti-trash"></i></button></div>`).join("")
    : '<p style="font-size:13px;color:var(--text-tertiary);padding:8px 0">Sin ubicaciones todavía</p>';
}

export function renderList() {
  const estado = document.getElementById("filter-est")?.value || "";
  const categoria = document.getElementById("filter-cat")?.value || "";
  const list = document.getElementById("product-list");
  if (!list) return;

  syncMobileFilterControls();

  const filterKey = getInventoryFilterKey(estado, categoria);
  if (state.lastInventoryFilterKey !== filterKey) {
    state.lastInventoryFilterKey = filterKey;
    state.expandedProductLotes = {};
    state.openProductMenuId = null;
  }

  document.getElementById("filters-fab")?.classList.toggle("is-active", Boolean(estado || categoria));

  let filtrados = state.productos.filter((producto) => {
    if (categoria && producto.categoria !== categoria) return false;
    if (estado && lotesVisibles(producto.id, estado).length === 0) return false;
    return true;
  });

  filtrados = filtrados.sort((a, b) => {
    const orden = { vencido: 0, pronto: 1, ok: 2 };
    const lotesA = lotesVisibles(a.id, estado);
    const lotesB = lotesVisibles(b.id, estado);
    const diff = orden[estadoLotes(lotesA, a.id)] - orden[estadoLotes(lotesB, b.id)];
    if (diff !== 0) return diff;
    const fa = lotesA[0]?.fecha_venc || "";
    const fb = lotesB[0]?.fecha_venc || "";
    return fa.localeCompare(fb);
  });

  const totalUnidades = state.productos.reduce((sum, producto) => sum + totalCantidad(producto.id), 0);
  document.getElementById("stat-total").textContent = totalUnidades;
  document.getElementById("stat-pronto").textContent = state.productos.filter((producto) => estadoProducto(producto.id) === "pronto").length;
  document.getElementById("stat-vencido").textContent = state.productos.filter((producto) => estadoProducto(producto.id) === "vencido").length;

  if (!filtrados.length) {
    list.innerHTML = `<div class="empty"><i class="ti ti-package-off"></i>${state.productos.length === 0 ? "Todavía no tenés productos.<br><small>Agregá uno desde Escanear o Manual.</small>" : "No hay productos con ese filtro."}</div>`;
    return;
  }

  list.innerHTML = filtrados.map((producto) => {
    const productoLotes = lotesVisibles(producto.id, estado);
    const { expanded, hasMore } = getLotesRenderState(producto.id, productoLotes);
    const menuOpen = state.openProductMenuId === producto.id;
    const urgentLote = getUrgentLote(productoLotes);
    const est = estadoLotes(productoLotes, producto.id);
    const badgeLabel = est === "vencido" ? "Vencido" : est === "pronto" ? "Por vencer" : "OK";
    const total = estado ? totalCantidadLotes(productoLotes) : totalCantidad(producto.id);
    const image = producto.imagen_url
      ? `<img src="${producto.imagen_url}" alt="" class="card-img">`
      : `<div class="card-img card-img-placeholder"><i class="ti ti-box"></i></div>`;

    const lotesRestantes = productoLotes.filter((lote) => lote.id !== urgentLote?.id);

    const lotesHTML = lotesRestantes.length
      ? lotesRestantes.map((lote) => {
        const estadoLote = getEstado(lote.fecha_venc);
        const label = lote.fecha_venc ? `${fmtF(lote.fecha_venc)} · ${diasLabel(lote.fecha_venc)}` : "Sin fecha";
        return `<div class="lote-row">
          <span class="lote-dot ${estadoLote}"></span>
          <span class="lote-qty">×${lote.cantidad}</span>
          <span class="lote-fecha">${label}</span>
        </div>`;
      }).join("")
      : "";

    const urgentRowHTML = urgentLote
      ? `<div class="lote-row lote-row-featured ${getEstado(urgentLote.fecha_venc)}">
          <span class="lote-dot ${getEstado(urgentLote.fecha_venc)}"></span>
          <span class="lote-qty">×${urgentLote.cantidad}</span>
          <span class="lote-fecha">${urgentLote.fecha_venc ? `${fmtF(urgentLote.fecha_venc)} · ${diasLabel(urgentLote.fecha_venc)}` : "Sin fecha"}</span>
        </div>`
      : '<div class="lote-row muted lote-row-featured"><span class="lote-fecha">Sin lotes cargados</span></div>';

    const lotesToggleHTML = hasMore
      ? `<button class="lotes-toggle" id="toggle-lotes-${producto.id}" data-total-lotes="${productoLotes.length}" type="button" onclick="toggleProductLotes('${producto.id}')">
          ${getToggleLabel(productoLotes.length, expanded)}
        </button>`
      : '<div class="lotes-toggle-spacer" aria-hidden="true"></div>';

    return `<div class="swipe-wrap" id="sw-${producto.id}">
      <div class="product-card ${est}${expanded ? " expanded" : ""}" id="card-${producto.id}">
        <div class="card-top">
          <span class="badge ${est}">${badgeLabel}</span>
          <div class="prod-card-menu">
            <button class="icon-btn prod-more-btn" type="button" onclick="toggleProductMenu('${producto.id}', event)" title="Más acciones">
              <i class="ti ti-dots"></i>
            </button>
            <div class="prod-menu-panel${menuOpen ? " open" : ""}" onclick="event.stopPropagation()">
              <button class="prod-menu-action" type="button" onclick="editProducto('${producto.id}')"><i class="ti ti-edit"></i><span>Editar producto</span></button>
              <button class="prod-menu-action danger" type="button" onclick="eliminarProducto('${producto.id}')"><i class="ti ti-trash"></i><span>Eliminar producto</span></button>
            </div>
          </div>
        </div>
        <div class="card-body">
          ${image}
          <div class="card-main">
            <div class="prod-name">${producto.nombre}</div>
            <div class="prod-meta">
              <span>${producto.categoria || ""}</span>
              ${producto.ubicacion ? `<span><i class="ti ti-map-pin" style="font-size:11px;vertical-align:-1px"></i> ${producto.ubicacion}</span>` : ""}
            </div>
            <div class="lote-primary-block">
              ${urgentRowHTML}
            </div>
            <div class="lotes-section${hasMore ? " has-toggle" : ""}">
              <div class="lotes-wrap">${lotesHTML}</div>
              ${lotesToggleHTML}
            </div>
          </div>
          <div class="card-qty"><span class="qty-num" id="qty-${producto.id}">×${total}</span></div>
        </div>
        <div class="product-card-actions">
          <button class="btn-add-lote" type="button" onclick="openLoteModal('${producto.id}')"><i class="ti ti-circle-plus"></i> Agregar lote</button>
          ${total > 0 ? `<button class="btn-descontar inline" type="button" onclick="openConsumoModal('${producto.id}')"><i class="ti ti-minus"></i> Descontar stock</button>` : ""}
        </div>
      </div>
    </div>`;
  }).join("");
}

document.addEventListener("click", () => {
  if (!state.openProductMenuId) return;
  closeProductMenus();
});
