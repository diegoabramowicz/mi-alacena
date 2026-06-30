export const state = {
  currentUser: null,
  currentHogar: null,
  productos: [],
  lotes: [],
  categorias: [],
  ubicaciones: [],
  qtyScan: 1,
  qtyManual: 1,
  currentBC: "",
  currentOFFImg: "",
  currentFoundId: null,
  editId: null,
  scanner: null,
  scanning: false,
  loteModalProductoId: null,
  loteModalLoteId: null,
  loteQty: 1,
  consumoProductoId: null,
  consumoDelta: {},
  manualOFFImg: "",
  acIndex: -1,
  appInitialized: false,
};

export function resetSessionState() {
  state.currentUser = null;
  state.currentHogar = null;
  state.appInitialized = false;
}
