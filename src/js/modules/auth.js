import { state, resetSessionState } from "../state.js";
import { sb } from "../services/supabase.js";
import { fetchData } from "./data.js";
import { renderList } from "./render.js";
import { setLoading, showToast } from "../utils/ui.js";

export function showAuthLogin() {
  document.getElementById("auth-login").style.display = "block";
  document.getElementById("auth-register").style.display = "none";
}

export function showAuthRegister() {
  document.getElementById("auth-login").style.display = "none";
  document.getElementById("auth-register").style.display = "block";
}

export async function doLogin() {
  const email = document.getElementById("login-email").value.trim();
  const pass = document.getElementById("login-pass").value;
  const err = document.getElementById("login-error");
  const btn = document.getElementById("btn-login");
  err.classList.remove("show");

  if (!email || !pass) {
    err.textContent = "Completá el email y la contraseña para continuar.";
    err.classList.add("show");
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<i class="ti ti-loader" style="animation:spin .7s linear infinite"></i> Ingresando...';

  try {
    const { error } = await sb.auth.signInWithPassword({ email, password: pass });
    if (error) {
      err.textContent = "Email o contraseña incorrectos.";
      err.classList.add("show");
      btn.disabled = false;
      btn.innerHTML = "Ingresar";
    }
  } catch {
    err.textContent = "Error de conexión. Intentá de nuevo.";
    err.classList.add("show");
    btn.disabled = false;
    btn.innerHTML = "Ingresar";
  }
}

export async function doRegister() {
  const nombre = document.getElementById("reg-nombre").value.trim();
  const email = document.getElementById("reg-email").value.trim();
  const pass = document.getElementById("reg-pass").value;
  const err = document.getElementById("reg-error");
  err.classList.remove("show");

  if (!nombre) {
    err.textContent = "Ingresá tu nombre.";
    err.classList.add("show");
    return;
  }
  if (!email) {
    err.textContent = "Ingresá tu email.";
    err.classList.add("show");
    return;
  }
  if (!pass || pass.length < 6) {
    err.textContent = "La contraseña debe tener al menos 6 caracteres.";
    err.classList.add("show");
    return;
  }

  setLoading(true, "Creando cuenta...");
  const { error } = await sb.auth.signUp({ email, password: pass, options: { data: { nombre } } });
  setLoading(false);
  if (error) {
    err.textContent = error.message;
    err.classList.add("show");
  } else {
    showToast("Cuenta creada — podés ingresar");
    showAuthLogin();
  }
}

export function doLogout() {
  if (!window.confirm("Cerrar sesion?")) return;
  mostrarLogin();
}

export async function limpiarSesion() {
  try {
    await sb.auth.signOut({ scope: "local" });
  } catch {}
  mostrarLogin();
}

export function mostrarLogin() {
  resetSessionState();
  document.getElementById("main-app").style.display = "none";
  document.getElementById("hogar-screen").classList.remove("active");
  document.getElementById("auth-screen").classList.add("active");
  const btn = document.getElementById("btn-login");
  if (btn) {
    btn.disabled = false;
    btn.innerHTML = "Ingresar";
  }
  setLoading(false);
}

export async function handleSession(user) {
  if (!user) {
    await limpiarSesion();
    return;
  }

  state.currentUser = user;

  try {
    const { data: miembro, error } = await sb.from("hogar_miembros")
      .select("hogar_id, hogares(*)")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (error?.status === 401 || error?.status === 403) {
      await limpiarSesion();
      return;
    }

    if (miembro?.hogares) {
      state.currentHogar = miembro.hogares;
      setLoading(false);
      await loadApp();
    } else {
      setLoading(false);
      document.getElementById("auth-screen").classList.remove("active");
      document.getElementById("hogar-screen").classList.add("active");
    }
  } catch {
    setLoading(false);
    document.getElementById("auth-screen").classList.add("active");
  }
}

export async function init() {
  document.getElementById("auth-screen").classList.remove("active");
  setLoading(true, "Cargando...");

  const killSwitch = window.setTimeout(() => {
    if (!state.appInitialized) {
      setLoading(false);
      document.getElementById("auth-screen").classList.add("active");
    }
  }, 6000);

  try {
    const { data: { session } } = await sb.auth.getSession();
    clearTimeout(killSwitch);
    state.appInitialized = true;
    await handleSession(session?.user ?? null);
  } catch {
    clearTimeout(killSwitch);
    setLoading(false);
    document.getElementById("auth-screen").classList.add("active");
  }

  sb.auth.onAuthStateChange(async (event, session) => {
    if (event === "SIGNED_IN") {
      const btn = document.getElementById("btn-login");
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = "Ingresar";
      }
      if (!state.currentUser) await handleSession(session?.user ?? null);
    }
  });
}

export async function loadApp() {
  document.getElementById("auth-screen").classList.remove("active");
  document.getElementById("hogar-screen").classList.remove("active");
  document.getElementById("main-app").style.display = "flex";
  document.getElementById("main-app").style.flexDirection = "column";

  const email = state.currentUser.email || "";
  const nombre = state.currentUser.user_metadata?.nombre || email.split("@")[0];
  const inicial = nombre[0]?.toUpperCase() || "?";

  document.getElementById("hogar-badge").textContent = state.currentHogar.nombre;
  document.getElementById("header-avatar").textContent = inicial;
  document.getElementById("settings-email").textContent = email;
  document.getElementById("settings-hogar-name").textContent = state.currentHogar.nombre;
  document.getElementById("settings-codigo").textContent = state.currentHogar.codigo;
  document.getElementById("settings-avatar").textContent = inicial;

  setLoading(true, "Cargando inventario...");
  await fetchData();
  setLoading(false);
  renderList();
}
