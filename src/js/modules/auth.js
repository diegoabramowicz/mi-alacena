import { getAuthRedirectUrl } from "../config.js";
import { state, resetSessionState } from "../state.js";
import { sb } from "../services/supabase.js";
import { fetchData } from "./data.js";
import { initializeInventoryChallenge } from "./activation.js";
import { renderList } from "./render.js";
import { clearInlineError, setLoading, setInlineError, showToast } from "../utils/ui.js";

const AUTH_MODE_STORAGE_KEY = "nestra-auth-mode";
const GOOGLE_LOGIN_IDLE_HTML = '<i class="ti ti-brand-google-filled"></i> Continuar con Google';
const GOOGLE_REGISTER_IDLE_HTML = '<i class="ti ti-brand-google-filled"></i> Continuar con Google';

function showPublicHome() {
  document.getElementById("public-home")?.style.setProperty("display", "block");
  document.getElementById("auth-screen").classList.remove("active");
  document.getElementById("hogar-screen").classList.remove("active");
  document.getElementById("main-app").style.display = "none";
  closePublicMenu();
  setLoading(false);
}

function showAccessScreen() {
  document.getElementById("public-home")?.style.setProperty("display", "block");
  document.getElementById("auth-screen").classList.add("active");
  document.getElementById("hogar-screen").classList.remove("active");
  closePublicMenu();
}

function setAuthStep(step) {
  document.querySelectorAll(".auth-step").forEach((node) => node.classList.remove("active"));
  const next = document.getElementById(step);
  if (next) next.classList.add("active");
  showAccessScreen();
}

function setHomeStep(step) {
  document.querySelectorAll(".home-step").forEach((node) => node.classList.remove("active"));
  const next = document.getElementById(step);
  if (next) next.classList.add("active");
  document.getElementById("auth-screen").classList.remove("active");
  document.getElementById("hogar-screen").classList.add("active");
}

function activateAuthSwitch(mode) {
  document.getElementById("switch-login")?.classList.toggle("active", mode === "login");
  document.getElementById("switch-register")?.classList.toggle("active", mode === "register");
}

function setStoredAuthMode(mode) {
  try {
    window.sessionStorage.setItem(AUTH_MODE_STORAGE_KEY, mode === "register" ? "register" : "login");
  } catch {}
}

function getStoredAuthMode() {
  try {
    return window.sessionStorage.getItem(AUTH_MODE_STORAGE_KEY) === "register" ? "register" : "login";
  } catch {
    return "login";
  }
}

function showStoredAuthMode() {
  if (getStoredAuthMode() === "register") {
    showAuthRegister();
    return;
  }
  showAuthLogin();
}

function setAuthError(id, message) {
  setInlineError(id, message);
}

function clearAuthError(...ids) {
  clearInlineError(...ids);
}

function toggleButtonLoading(id, isLoading, loadingLabel, idleHtml) {
  const btn = document.getElementById(id);
  if (!btn) return;
  btn.disabled = isLoading;
  btn.innerHTML = isLoading
    ? `<i class="ti ti-loader" style="animation:spin .7s linear infinite"></i> ${loadingLabel}`
    : idleHtml;
}

function toggleOAuthButtonsLoading(isLoading) {
  toggleButtonLoading("btn-google-login", isLoading, "Abriendo Google...", GOOGLE_LOGIN_IDLE_HTML);
  toggleButtonLoading("btn-google-register", isLoading, "Abriendo Google...", GOOGLE_REGISTER_IDLE_HTML);
}

function setRegisterPasswordStage(isVisible) {
  document.getElementById("signup-password-stage")?.classList.toggle("active", isVisible);
  const continueBtn = document.getElementById("btn-signup-continue");
  if (continueBtn) continueBtn.style.display = isVisible ? "none" : "flex";
}

function getUserDisplayName(user) {
  const email = user?.email || "";
  return user?.user_metadata?.nombre || email.split("@")[0] || "";
}

function normalizeOAuthError(message) {
  const raw = (message || "").toLowerCase();

  if (!raw) return "No pudimos completar el ingreso con Google.";
  if (raw.includes("access_denied") || raw.includes("cancel") || raw.includes("denied")) {
    return "No se completó el ingreso con Google.";
  }
  if (raw.includes("provider is not enabled")) {
    return "Google todavía no está habilitado en Supabase.";
  }
  if (raw.includes("redirect") || raw.includes("redirect_uri")) {
    return "La URL de retorno de Google no está configurada correctamente.";
  }
  if (raw.includes("signup") && raw.includes("disabled")) {
    return "El registro está deshabilitado en este proyecto.";
  }

  return "No pudimos completar el ingreso con Google.";
}

function normalizeAuthError(message, context = "generic") {
  const raw = (message || "").toLowerCase();

  if (!raw) {
    if (context === "signup") return "No pudimos crear tu cuenta.";
    if (context === "profile") return "No pudimos guardar tu nombre.";
    return "No pudimos completar esta acción.";
  }

  if (raw.includes("user already registered") || raw.includes("already registered")) {
    return "Ese email ya está registrado.";
  }
  if (raw.includes("invalid login credentials")) {
    return "No pudimos ingresar con esos datos.";
  }
  if (raw.includes("email not confirmed")) {
    return "Tu email todavía no fue confirmado.";
  }
  if (raw.includes("password should be at least") || raw.includes("password") && raw.includes("6")) {
    return "La contraseña debe tener al menos 6 caracteres.";
  }
  if (raw.includes("unable to validate email") || raw.includes("invalid email")) {
    return "El email no es válido.";
  }
  if (raw.includes("signup") && raw.includes("disabled")) {
    return "El registro está deshabilitado en este momento.";
  }
  if (raw.includes("network") || raw.includes("fetch")) {
    return "Tuvimos un problema de conexión. Inténtalo de nuevo.";
  }

  if (context === "signup") return "No pudimos crear tu cuenta.";
  if (context === "profile") return "No pudimos guardar tu nombre.";
  if (context === "login") return "No pudimos ingresar con esos datos.";
  return "No pudimos completar esta acción.";
}

function consumeOAuthErrorFromUrl() {
  const url = new URL(window.location.href);
  const hashParams = new URLSearchParams(url.hash.startsWith("#") ? url.hash.slice(1) : "");
  const rawMessage = url.searchParams.get("error_description")
    || url.searchParams.get("error")
    || hashParams.get("error_description")
    || hashParams.get("error");

  if (!rawMessage) return "";

  ["error", "error_code", "error_description"].forEach((key) => {
    url.searchParams.delete(key);
    hashParams.delete(key);
  });

  const nextSearch = url.searchParams.toString();
  const nextHash = hashParams.toString();
  const nextUrl = `${url.pathname}${nextSearch ? `?${nextSearch}` : ""}${nextHash ? `#${nextHash}` : ""}`;
  window.history.replaceState({}, "", nextUrl);

  return normalizeOAuthError(rawMessage);
}

export function showAuthLogin() {
  setStoredAuthMode("login");
  clearAuthError("login-error", "signup-error", "profile-error");
  activateAuthSwitch("login");
  setAuthStep("step-login");
}

export function showAuthRegister() {
  setStoredAuthMode("register");
  clearAuthError("login-error", "signup-error", "profile-error");
  setRegisterPasswordStage(false);
  document.getElementById("signup-pass").value = "";
  activateAuthSwitch("register");
  setAuthStep("step-register");
}

export function continueRegisterWithEmail() {
  clearAuthError("signup-error");
  const emailInput = document.getElementById("signup-email");
  const email = emailInput.value.trim().toLowerCase();

  if (!email) {
    setAuthError("signup-error", "Ingresá tu email para crear la cuenta.");
    return;
  }

  if (!emailInput.checkValidity()) {
    setAuthError("signup-error", "El email no es válido.");
    return;
  }

  emailInput.value = email;
  setRegisterPasswordStage(true);
  document.getElementById("signup-pass").focus();
}

export function editRegisterEmail() {
  clearAuthError("signup-error");
  setRegisterPasswordStage(false);
  document.getElementById("signup-pass").value = "";
  document.getElementById("signup-email").focus();
}

export async function openAccess(mode = "login") {
  closePublicMenu();
  if (state.currentUser) {
    await handleSession(state.currentUser);
    return;
  }
  if (mode === "register") {
    showAuthRegister();
    return;
  }
  showAuthLogin();
}

export function closeAccess(event) {
  if (event && event.target !== document.getElementById("auth-screen")) return;
  clearAuthError("login-error", "signup-error", "profile-error");
  document.getElementById("auth-screen").classList.remove("active");
  setLoading(false);
}

export async function doLogin() {
  clearAuthError("login-error");
  const email = document.getElementById("login-email").value.trim().toLowerCase();
  const pass = document.getElementById("login-pass").value;

  if (!email) {
    setAuthError("login-error", "Ingresá tu email para continuar.");
    return;
  }
  if (!pass) {
    setAuthError("login-error", "Ingresá tu contraseña para continuar.");
    return;
  }

  toggleButtonLoading("btn-login", true, "Ingresando...", '<i class="ti ti-arrow-right"></i> Ingresar');
  setLoading(true, "Ingresando...");
  try {
    const { data, error } = await sb.auth.signInWithPassword({ email, password: pass });
    if (error) {
      setLoading(false);
      setAuthError("login-error", normalizeAuthError(error.message, "login"));
      return;
    }
    if (data?.user) {
      await handleSession(data.user);
      return;
    }
  } catch {
    setLoading(false);
    setAuthError("login-error", "Tuvimos un problema de conexión. Inténtalo de nuevo.");
  } finally {
    toggleButtonLoading("btn-login", false, "Ingresando...", '<i class="ti ti-arrow-right"></i> Ingresar');
  }
}

export async function doGoogleAuth(mode = "login") {
  setStoredAuthMode(mode);
  clearAuthError("login-error", "signup-error", "profile-error");
  toggleOAuthButtonsLoading(true);

  try {
    const { error } = await sb.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: getAuthRedirectUrl(),
        queryParams: {
          prompt: "select_account",
        },
      },
    });

    if (error) {
      toggleOAuthButtonsLoading(false);
      setAuthError(mode === "register" ? "signup-error" : "login-error", normalizeOAuthError(error.message));
    }
  } catch {
    toggleOAuthButtonsLoading(false);
    setAuthError(mode === "register" ? "signup-error" : "login-error", "No pudimos abrir Google en este momento.");
  }
}

export async function doRegister() {
  clearAuthError("signup-error");
  const email = document.getElementById("signup-email").value.trim().toLowerCase();
  const pass = document.getElementById("signup-pass").value;
  const passwordStageVisible = document.getElementById("signup-password-stage")?.classList.contains("active");

  if (!email) {
    setAuthError("signup-error", "Ingresá tu email para crear la cuenta.");
    return;
  }
  if (!passwordStageVisible) {
    continueRegisterWithEmail();
    return;
  }
  if (!pass || pass.length < 6) {
    setAuthError("signup-error", "La contraseña debe tener al menos 6 caracteres.");
    return;
  }

  toggleButtonLoading("btn-signup", true, "Creando cuenta...", '<i class="ti ti-arrow-right"></i> Crear cuenta');
  try {
    const { error } = await sb.auth.signUp({ email, password: pass });
    if (error) {
      if ((error.message || "").toLowerCase().includes("already registered")) {
        setRegisterPasswordStage(false);
        document.getElementById("signup-pass").value = "";
        document.getElementById("signup-email").focus();
      }
      setAuthError("signup-error", normalizeAuthError(error.message, "signup"));
      return;
    }
    showToast("Cuenta creada. Sigamos con tu perfil.");
    document.getElementById("profile-name").value = "";
    activateAuthSwitch("register");
    setAuthStep("step-profile-name");
  } catch {
    setAuthError("signup-error", "Tuvimos un problema al crear tu cuenta.");
  } finally {
    toggleButtonLoading("btn-signup", false, "Creando cuenta...", '<i class="ti ti-arrow-right"></i> Crear cuenta');
  }
}

export async function saveProfileName() {
  clearAuthError("profile-error");
  const name = document.getElementById("profile-name").value.trim();
  if (!name) {
    setAuthError("profile-error", "Cuéntanos tu nombre para seguir.");
    return;
  }

  toggleButtonLoading("btn-profile-name", true, "Guardando...", '<i class="ti ti-check"></i> Continuar');
  try {
    const { data, error } = await sb.auth.updateUser({ data: { nombre: name } });
    if (error) {
      setAuthError("profile-error", normalizeAuthError(error.message, "profile"));
      return;
    }
    if (data?.user) state.currentUser = data.user;
    showToast("Perfecto. Ahora conectemos tu hogar.");
    setHomeStep("home-choice");
  } catch {
    setAuthError("profile-error", "Tuvimos un problema al guardar tu nombre.");
  } finally {
    toggleButtonLoading("btn-profile-name", false, "Guardando...", '<i class="ti ti-check"></i> Continuar');
  }
}

export async function doLogout() {
  closeUserMenu();
  await limpiarSesion();
}

export function toggleUserMenu(event) {
  event?.stopPropagation();
  const panel = document.getElementById("user-menu-panel");
  if (!panel) return;
  panel.classList.toggle("open");
}

export function closeUserMenu() {
  const panel = document.getElementById("user-menu-panel");
  if (!panel) return;
  panel.classList.remove("open");
}

export function togglePublicMenu(event) {
  event?.stopPropagation();
  const panel = document.getElementById("public-menu-panel");
  if (!panel) return;
  panel.classList.toggle("open");
}

export function closePublicMenu() {
  const panel = document.getElementById("public-menu-panel");
  if (!panel) return;
  panel.classList.remove("open");
}

export async function limpiarSesion(mode = "login") {
  try {
    await sb.auth.signOut({ scope: "local" });
  } catch {}
  state.currentUser = null;
  showPublicHome();
}

export function mostrarLogin(mode = "login") {
  resetSessionState();
  closeUserMenu();
  showPublicHome();
  document.getElementById("login-email").value = "";
  document.getElementById("login-pass").value = "";
  document.getElementById("signup-email").value = "";
  document.getElementById("signup-pass").value = "";
  setRegisterPasswordStage(false);
  const signupPassConfirm = document.getElementById("signup-pass-confirm");
  if (signupPassConfirm) signupPassConfirm.value = "";
  document.getElementById("profile-name").value = "";
  clearAuthError("login-error", "signup-error", "profile-error");
  toggleButtonLoading("btn-login", false, "Ingresando...", '<i class="ti ti-arrow-right"></i> Ingresar');
  toggleButtonLoading("btn-signup", false, "Creando cuenta...", '<i class="ti ti-arrow-right"></i> Crear cuenta');
  toggleButtonLoading("btn-profile-name", false, "Guardando...", '<i class="ti ti-check"></i> Continuar');
  toggleOAuthButtonsLoading(false);
}

async function goToHomeOrApp(miembro) {
  if (miembro?.hogares) {
    state.currentHogar = miembro.hogares;
    await loadApp();
    return;
  }
  setHomeStep("home-choice");
}

export async function handleSession(user) {
  if (!user) {
    showPublicHome();
    return;
  }

  state.currentUser = user;
  const displayName = getUserDisplayName(user);

  if (!displayName) {
    activateAuthSwitch("register");
    setAuthStep("step-profile-name");
    setLoading(false);
    return;
  }

  try {
    const { data: miembro, error } = await sb.from("hogar_miembros")
      .select("hogar_id, hogares(*)")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (error?.status === 401 || error?.status === 403) {
      await limpiarSesion("login");
      return;
    }

    setLoading(false);
    await goToHomeOrApp(miembro);
  } catch {
    setLoading(false);
    showPublicHome();
  }
}

export async function init() {
  setLoading(true, "Cargando...");
  const oauthErrorMessage = consumeOAuthErrorFromUrl();

  const killSwitch = window.setTimeout(() => {
    if (!state.appInitialized) {
      showPublicHome();
      if (oauthErrorMessage) {
        showAuthLogin();
        showToast(oauthErrorMessage, { type: "error", duration: 3600 });
      }
    }
  }, 6000);

  try {
    const { data: { session } } = await sb.auth.getSession();
    clearTimeout(killSwitch);
    state.appInitialized = true;

    if (session?.user) {
      await handleSession(session.user);
      return;
    }

    showPublicHome();
    if (oauthErrorMessage) {
      showAuthLogin();
      showToast(oauthErrorMessage, { type: "error", duration: 3600 });
    }
  } catch {
    clearTimeout(killSwitch);
    showPublicHome();
    if (oauthErrorMessage) {
      showAuthLogin();
      showToast(oauthErrorMessage, { type: "error", duration: 3600 });
    }
  }

  sb.auth.onAuthStateChange(async (event, session) => {
    if (event === "SIGNED_IN") {
      const appVisible = document.getElementById("main-app")?.style.display === "flex";
      if (!state.currentUser || state.currentUser.id !== session?.user?.id || !appVisible) {
        await handleSession(session?.user ?? null);
      }
      return;
    }

    if (event === "SIGNED_OUT") {
      resetSessionState();
      showPublicHome();
    }
  });
}

export async function loadApp() {
  document.getElementById("public-home")?.style.setProperty("display", "none");
  document.getElementById("auth-screen").classList.remove("active");
  document.getElementById("hogar-screen").classList.remove("active");
  document.getElementById("main-app").style.display = "flex";
  document.getElementById("main-app").style.flexDirection = "column";

  const email = state.currentUser.email || "";
  const nombre = getUserDisplayName(state.currentUser);
  const inicial = nombre[0]?.toUpperCase() || "?";

  document.getElementById("hogar-badge").textContent = state.currentHogar.nombre;
  document.getElementById("header-avatar").textContent = inicial;
  document.getElementById("user-menu-name").textContent = nombre;
  document.getElementById("user-menu-email").textContent = email;
  document.getElementById("user-menu-hogar").textContent = state.currentHogar.nombre;
  document.getElementById("settings-email").textContent = email;
  document.getElementById("settings-hogar-name").textContent = state.currentHogar.nombre;
  document.getElementById("settings-codigo").textContent = state.currentHogar.codigo;
  document.getElementById("settings-avatar").textContent = inicial;

  setLoading(true, "Cargando inventario...");
  await fetchData();
  setLoading(false);
  renderList();
  await initializeInventoryChallenge();
}

document.addEventListener("click", (event) => {
  const menu = document.querySelector(".user-menu");
  if (!menu) return;
  if (!menu.contains(event.target)) closeUserMenu();
});

document.addEventListener("click", (event) => {
  const menu = document.querySelector(".public-menu");
  if (!menu) return;
  if (!menu.contains(event.target)) closePublicMenu();
});
