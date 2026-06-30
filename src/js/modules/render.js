import { state } from "../state.js";
import { diasLabel, estadoProducto, fmtF, getEstado, lotesDeProducto, totalCantidad } from "../utils/date.js";

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

  renderSettingsLists();
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

  let filtrados = state.productos.filter((producto) => {
    if (estado && estadoProducto(producto.id) !== estado) return false;
    if (categoria && producto.categoria !== categoria) return false;
    return true;
  });

  filtrados = filtrados.sort((a, b) => {
    const orden = { vencido: 0, pronto: 1, ok: 2 };
    const diff = orden[estadoProducto(a.id)] - orden[estadoProducto(b.id)];
    if (diff !== 0) return diff;
    const fa = lotesDeProducto(a.id)[0]?.fecha_venc || "";
    const fb = lotesDeProducto(b.id)[0]?.fecha_venc || "";
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
    const est = estadoProducto(producto.id);
    const badgeLabel = est === "vencido" ? "Vencido" : est === "pronto" ? "Por vencer" : "OK";
    const total = totalCantidad(producto.id);
    const productoLotes = lotesDeProducto(producto.id);
    const image = producto.imagen_url
      ? `<img src="${producto.imagen_url}" alt="" class="card-img">`
      : `<div class="card-img card-img-placeholder"><i class="ti ti-box"></i></div>`;

    const lotesHTML = productoLotes.length
      ? productoLotes.map((lote) => {
        const estadoLote = getEstado(lote.fecha_venc);
        const label = lote.fecha_venc ? `${fmtF(lote.fecha_venc)} · ${diasLabel(lote.fecha_venc)}` : "Sin fecha";
        return `<div class="lote-row">
          <span class="lote-dot ${estadoLote}"></span>
          <span class="lote-qty">×${lote.cantidad}</span>
          <span class="lote-fecha">${label}</span>
          <button class="lote-edit-btn" onclick="openLoteModal('${producto.id}','${lote.id}')"><i class="ti ti-pencil"></i></button>
        </div>`;
      }).join("")
      : '<div class="lote-row muted"><span class="lote-fecha">Sin lotes — tocá + para agregar</span></div>';

    return `<div class="swipe-wrap" id="sw-${producto.id}">
      <div class="product-card ${est}" id="card-${producto.id}">
        <div class="card-top">
          <span class="badge ${est}">${badgeLabel}</span>
          <div class="prod-actions">
            <button class="icon-btn" onclick="openLoteModal('${producto.id}',null)" title="Agregar lote"><i class="ti ti-circle-plus"></i></button>
            <button class="icon-btn" onclick="editProducto('${producto.id}')" title="Editar"><i class="ti ti-edit"></i></button>
            <button class="icon-btn" onclick="eliminarProducto('${producto.id}')" title="Eliminar"><i class="ti ti-trash"></i></button>
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
            <div class="lotes-wrap">${lotesHTML}</div>
          </div>
          <div class="card-qty"><span class="qty-num" id="qty-${producto.id}">×${total}</span></div>
        </div>
        ${total > 0 ? `<button class="btn-descontar" onclick="openConsumoModal('${producto.id}')"><i class="ti ti-minus"></i> Descontar stock</button>` : ""}
      </div>
    </div>`;
  }).join("");
}
