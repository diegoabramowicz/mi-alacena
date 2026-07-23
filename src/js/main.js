import {
  activationModalPrimaryAction,
  activationModalSecondaryAction,
  closeActivationModal,
  getInventoryChallengeState,
} from "./modules/activation.js";
import {
  closeAccess,
  closePublicMenu,
  continueRegisterWithEmail,
  init,
  doGoogleAuth,
  doLogin,
  doLogout,
  doRegister,
  editRegisterEmail,
  openAccess,
  saveProfileName,
  showAuthLogin,
  showAuthRegister,
  togglePublicMenu,
  toggleUserMenu,
} from "./modules/auth.js";
import { closeConsumoModal, confirmarConsumo, fillConsumo, openConsumoModal, stepConsumo } from "./modules/consumption.js";
import { closeHomeOnboarding, copiarCodigo, doCrearHogar, doUnirseHogar, hideHogarForms, logoutFromHomeOnboarding, showCrearHogar, showUnirseHogar } from "./modules/home.js";
import { closeEditModal, editProducto, eliminarProducto, saveEdit } from "./modules/inventory.js";
import { closeLoteModal, openLoteModal, saveLote } from "./modules/lots.js";
import { acBlur, acInput, acKeydown, acSelectProduct, resetManualForm, saveManual, searchOFF, showManualBlank } from "./modules/manual.js";
import { showPage } from "./modules/navigation.js";
import { changeQty } from "./modules/quantity.js";
import { applyMobileFilters, clearMobileFilters, closeFilterSheet, closeProductMenus, openFilterSheet, renderList, toggleProductLotes, toggleProductMenu } from "./modules/render.js";
import { lookupManual, saveFound, saveNew, setScanState, showManualInput, startScan, stopScan } from "./modules/scanner.js";
import { agregarCategoria, agregarUbicacion, eliminarCategoria, eliminarUbicacion } from "./modules/settings.js";
import { closeConfirmModal, confirmModalAction } from "./utils/ui.js";

Object.assign(window, {
  acBlur,
  acInput,
  acKeydown,
  acSelectProduct,
  activationModalPrimaryAction,
  activationModalSecondaryAction,
  applyMobileFilters,
  agregarCategoria,
  agregarUbicacion,
  changeQty,
  closeActivationModal,
  closeAccess,
  closeHomeOnboarding,
  clearMobileFilters,
  closeConsumoModal,
  closeConfirmModal,
  closeEditModal,
  closeFilterSheet,
  closeProductMenus,
  closePublicMenu,
  closeLoteModal,
  confirmModalAction,
  confirmarConsumo,
  continueRegisterWithEmail,
  copiarCodigo,
  fillConsumo,
  getInventoryChallengeState,
  doCrearHogar,
  doGoogleAuth,
  doLogin,
  doLogout,
  doRegister,
  doUnirseHogar,
  editRegisterEmail,
  editProducto,
  eliminarCategoria,
  eliminarProducto,
  eliminarUbicacion,
  hideHogarForms,
  lookupManual,
  logoutFromHomeOnboarding,
  openAccess,
  openConsumoModal,
  openFilterSheet,
  openLoteModal,
  renderList,
  resetManualForm,
  saveProfileName,
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
  toggleProductLotes,
  toggleProductMenu,
  togglePublicMenu,
  toggleUserMenu,
});
import { inject } from "@vercel/analytics";
inject();

init();
