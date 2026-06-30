import { init, doLogin, doLogout, doRegister, showAuthLogin, showAuthRegister } from "./modules/auth.js";
import { closeConsumoModal, confirmarConsumo, openConsumoModal, stepConsumo } from "./modules/consumption.js";
import { copiarCodigo, doCrearHogar, doUnirseHogar, hideHogarForms, showCrearHogar, showUnirseHogar } from "./modules/home.js";
import { closeEditModal, editProducto, eliminarProducto, saveEdit } from "./modules/inventory.js";
import { closeLoteModal, deleteLote, openLoteModal, saveLote } from "./modules/lots.js";
import { acBlur, acInput, acKeydown, acSelectProduct, resetManualForm, saveManual, searchOFF, showManualBlank } from "./modules/manual.js";
import { showPage } from "./modules/navigation.js";
import { changeQty } from "./modules/quantity.js";
import { renderList } from "./modules/render.js";
import { lookupManual, saveFound, saveNew, setScanState, showManualInput, startScan, stopScan } from "./modules/scanner.js";
import { agregarCategoria, agregarUbicacion, eliminarCategoria, eliminarUbicacion } from "./modules/settings.js";

Object.assign(window, {
  acBlur,
  acInput,
  acKeydown,
  acSelectProduct,
  agregarCategoria,
  agregarUbicacion,
  changeQty,
  closeConsumoModal,
  closeEditModal,
  closeLoteModal,
  confirmarConsumo,
  copiarCodigo,
  deleteLote,
  doCrearHogar,
  doLogin,
  doLogout,
  doRegister,
  doUnirseHogar,
  editProducto,
  eliminarCategoria,
  eliminarProducto,
  eliminarUbicacion,
  hideHogarForms,
  lookupManual,
  openConsumoModal,
  openLoteModal,
  renderList,
  resetManualForm,
  saveEdit,
  saveFound,
  saveLote,
  saveManual,
  saveNew,
  searchOFF,
  setScanState,
  showAuthLogin,
  showAuthRegister,
  showCrearHogar,
  showManualBlank,
  showManualInput,
  showPage,
  showUnirseHogar,
  startScan,
  stepConsumo,
  stopScan,
});

init();
