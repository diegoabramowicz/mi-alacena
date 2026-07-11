import { state } from "../state.js";
import { sb } from "../services/supabase.js";
import { renderSelects } from "./render.js";
import { setSyncStatus, showToast } from "../utils/ui.js";

export async function fetchData() {
  setSyncStatus("syncing");
  try {
    const hogarId = state.currentHogar.id;
    const [productos, lotes, categorias, ubicaciones] = await Promise.all([
      sb.from("productos").select("*").eq("hogar_id", hogarId).order("agregado_at"),
      sb.from("lotes").select("*, productos!inner(hogar_id)").eq("productos.hogar_id", hogarId),
      sb.from("categorias").select("*").eq("hogar_id", hogarId).order("nombre"),
      sb.from("ubicaciones").select("*").eq("hogar_id", hogarId).order("nombre"),
    ]);

    const authError = [productos, lotes, categorias, ubicaciones].find((res) => res.error?.status === 401 || res.error?.status === 403);
    if (authError) {
      showToast("Sesión expirada — ingresá de nuevo");
      setSyncStatus("error");
      return { ok: false, reason: "auth" };
    }

    const queryError = [productos, lotes, categorias, ubicaciones].find((res) => res.error);
    if (queryError) {
      setSyncStatus("error");
      showToast("Error al cargar datos");
      return { ok: false, reason: "network" };
    }

    state.productos = productos.data || [];
    state.lotes = lotes.data || [];
    state.categorias = categorias.data || [];
    state.ubicaciones = ubicaciones.data || [];
    renderSelects();
    setSyncStatus("ok");
    return { ok: true, reason: null };
  } catch {
    setSyncStatus("error");
    showToast("Error al cargar datos");
    return { ok: false, reason: "network" };
  }
}

export async function agregarProductoNuevo(nombre, categoria, ubicacion, barcode, imagenURL, cantidad, fechaVenc) {
  const { data: producto, error } = await sb.from("productos").insert({
    hogar_id: state.currentHogar.id,
    nombre,
    categoria,
    ubicacion,
    barcode,
    imagen_url: imagenURL,
  }).select().single();

  if (error || !producto) throw error;

  if (cantidad) {
    const { data: lote, error: loteError } = await sb.from("lotes").insert({
      producto_id: producto.id,
      cantidad,
      fecha_venc: fechaVenc || null,
    }).select().single();

    if (loteError || !lote) {
      await sb.from("productos").delete().eq("id", producto.id);
      throw loteError;
    }

    if (lote) state.lotes.push(lote);
  }

  state.productos.push(producto);
  return producto;
}
