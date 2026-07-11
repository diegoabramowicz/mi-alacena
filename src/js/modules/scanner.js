import { state } from "../state.js";
import { sb } from "../services/supabase.js";
import { fetchOFF } from "../services/open-food-facts.js";
import { handleInventoryProductAdded } from "./activation.js";
import { agregarProductoNuevo } from "./data.js";
import { renderList } from "./render.js";
import { showPage } from "./navigation.js";
import { clearInlineError, setInlineError, setLoading, setSelectValue, showToast } from "../utils/ui.js";

export function setScanState(name) {
  clearInlineError("scan-new-error");
  document.querySelectorAll("#page-scanner .form-section").forEach((section) => section.classList.remove("active"));
  document.getElementById(`scan-${name}`).classList.add("active");
}

export function showManualInput() {
  setScanState("manual");
  document.getElementById("manual-bc").value = "";
}

export function lookupManual() {
  const code = document.getElementById("manual-bc").value.trim();
  if (code) lookupBarcode(code);
}

export async function lookupBarcode(code) {
  state.currentBC = code;
  state.currentOFFImg = "";
  state.qtyScan = 1;
  document.querySelectorAll("#qty-scan").forEach((el) => { el.textContent = "1"; });

  const existing = state.productos.find((producto) => producto.barcode === String(code));
  if (existing) {
    state.currentFoundId = existing.id;
    document.getElementById("found-name").textContent = existing.nombre;
    document.getElementById("found-meta").textContent = [existing.categoria, existing.ubicacion].filter(Boolean).join(" · ");
    document.getElementById("found-fecha").value = "";
    const imgEl = document.getElementById("found-img");
    if (existing.imagen_url) {
      imgEl.src = existing.imagen_url;
      imgEl.style.display = "block";
    } else {
      imgEl.style.display = "none";
    }
    setScanState("found");
    return;
  }

  state.currentFoundId = null;
  document.getElementById("new-nombre").value = "";
  document.getElementById("new-fecha").value = "";
  document.getElementById("off-preview").style.display = "none";
  setScanState("new");
  setLoading(true, "Buscando producto...");
  const off = await fetchOFF(code);
  setLoading(false);
  if (!off) return;

  if (off.nombre) document.getElementById("new-nombre").value = off.nombre;
  if (off.cat) setSelectValue("new-cat", off.cat);
  if (off.img) {
    state.currentOFFImg = off.img;
    document.getElementById("new-img").src = off.img;
    document.getElementById("off-product-name").textContent = off.nombre || "";
    document.getElementById("off-preview").style.display = "flex";
  }
}

export async function saveFound() {
  const producto = state.productos.find((item) => item.id === state.currentFoundId);
  if (!producto) return;

  setLoading(true, "Guardando...");
  try {
    const fecha = document.getElementById("found-fecha").value;
    const { data: lote, error } = await sb.from("lotes").insert({
      producto_id: producto.id,
      cantidad: state.qtyScan,
      fecha_venc: fecha || null,
    }).select().single();

    if (error || !lote) {
      showToast("No pudimos guardar el lote.", { type: "error" });
      return;
    }

    state.lotes.push(lote);
    renderList();
    showToast("✓ Lote agregado");
    setScanState("idle");
    showPage("inventario");
  } finally {
    setLoading(false);
  }
}

export async function saveNew() {
  clearInlineError("scan-new-error");
  const nombre = document.getElementById("new-nombre").value.trim();
  if (!nombre) {
    setInlineError("scan-new-error", "Ingresá el nombre del producto.");
    return;
  }

  setLoading(true, "Guardando...");
  try {
    await agregarProductoNuevo(
      nombre,
      document.getElementById("new-cat").value,
      document.getElementById("new-ubic").value,
      state.currentBC,
      state.currentOFFImg,
      state.qtyScan,
      document.getElementById("new-fecha").value,
    );
    renderList();
    setScanState("idle");
    showPage("inventario");
    await handleInventoryProductAdded();
  } catch {
    setInlineError("scan-new-error", "No pudimos guardar el producto.");
  }
  setLoading(false);
}

export async function startScan() {
  setScanState("scanning");
  document.getElementById("video-wrap").style.display = "block";
  try {
    state.scanner = new window.Html5Qrcode("scan-video");
    state.scanning = true;
    await state.scanner.start(
      { facingMode: "environment" },
      {
        fps: 10,
        qrbox: { width: 250, height: 150 },
        formatsToSupport: [
          window.Html5QrcodeSupportedFormats.EAN_13,
          window.Html5QrcodeSupportedFormats.EAN_8,
          window.Html5QrcodeSupportedFormats.CODE_128,
          window.Html5QrcodeSupportedFormats.UPC_A,
        ],
      },
      async (decoded) => {
        await stopScan({ resetView: false });
        await lookupBarcode(decoded);
      },
      () => {},
    );
  } catch (error) {
    goIdleScan();
    showToast("No se pudo acceder a la cámara desde este dispositivo o navegador.");
  }
}

export async function stopScan(options = {}) {
  const { resetView = true } = options;
  if (state.scanner) {
    try {
      await state.scanner.stop();
    } catch {}
    try {
      state.scanner.clear();
    } catch {}
    state.scanner = null;
  }
  state.scanning = false;
  document.getElementById("video-wrap").style.display = "none";
  if (resetView) {
    setScanState("idle");
    state.currentBC = "";
    state.currentFoundId = null;
    state.currentOFFImg = "";
    state.qtyScan = 1;
  }
}

export function goIdleScan() {
  stopScan({ resetView: true });
}
