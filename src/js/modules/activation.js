import { state } from "../state.js";
import { sb } from "../services/supabase.js";
import { showPage } from "./navigation.js";
import { renderList } from "./render.js";
import { toggleBodyScroll, showToast } from "../utils/ui.js";

const INVENTORY_CHALLENGE_GOAL = 10;

function getChallengeMeta() {
  return state.currentUser?.user_metadata || {};
}

export function getInventoryProductsCount() {
  return state.productos.length;
}

export function isInventoryChallengeCompleted() {
  return !!getChallengeMeta().firstInventoryChallengeCompleted;
}

export function getInventoryChallengeState() {
  const count = getInventoryProductsCount();

  if (isInventoryChallengeCompleted()) {
    return "completed";
  }

  if (count === 0) {
    return "empty";
  }

  if (count < INVENTORY_CHALLENGE_GOAL) {
    return "progress";
  }

  return "pending-completion";
}

export function closeActivationModal(event) {
  const modal = document.getElementById("activation-modal");
  if (!modal) return;
  if (event && event.target !== modal) return;
  modal.classList.remove("active");
  state.activationModalAction = "";
  toggleBodyScroll(false);
}

function openActivationModal({ title, body, primaryLabel, secondaryLabel, action = "" }) {
  const modal = document.getElementById("activation-modal");
  if (!modal) return;

  state.activationModalAction = action;
  document.getElementById("activation-modal-title").textContent = title;
  document.getElementById("activation-modal-body").textContent = body;
  document.getElementById("activation-modal-primary").textContent = primaryLabel;
  document.getElementById("activation-modal-secondary").textContent = secondaryLabel;

  modal.classList.add("active");
  toggleBodyScroll(true);
}

export function activationModalPrimaryAction() {
  const action = state.activationModalAction;
  closeActivationModal();

  if (action === "load-more") {
    showPage("scanner");
  }
}

export function activationModalSecondaryAction() {
  const action = state.activationModalAction;
  closeActivationModal();

  if (action === "completed") {
    showPage("scanner");
  }
}

export function renderInventoryActivationCard() {
  const mount = document.getElementById("inventory-activation-card");
  if (!mount) return;

  const count = getInventoryProductsCount();
  const stateName = getInventoryChallengeState();
  const progressPercent = Math.min(100, Math.round((count / INVENTORY_CHALLENGE_GOAL) * 100));

  if (stateName === "completed") {
    mount.innerHTML = `
      <div class="activation-card activation-card-soft">
      <div class="activation-card-copy">
        <div class="activation-card-kicker">Tu cocina ya tiene memoria</div>
        <div class="activation-card-title">Seguí completando tu cocina</div>
        <div class="activation-card-text">Cuantos más productos cargues, más contexto va a tener Nestra para ayudarte mejor.</div>
      </div>
        <div class="activation-card-actions">
          <button class="btn secondary btn-inline" type="button" onclick="showPage('scanner')"><i class="ti ti-plus"></i> Agregar productos</button>
        </div>
      </div>
    `;
    return;
  }

  if (stateName === "empty") {
    mount.innerHTML = `
      <div class="activation-card activation-card-empty">
        <div class="activation-card-icon"><i class="ti ti-sparkles"></i></div>
        <div class="activation-card-copy">
        <div class="activation-card-kicker">Primer desafío</div>
        <div class="activation-card-title">Tu cocina todavía está vacía</div>
        <div class="activation-card-text">No hace falta cargar todo hoy. Empezá con 10 productos y Nestra va a tener un mejor punto de partida para ayudarte.</div>
      </div>
        <div class="activation-card-actions">
          <button class="btn primary btn-inline" type="button" onclick="showPage('scanner')"><i class="ti ti-plus"></i> Cargar mis primeros 10 productos</button>
        </div>
      </div>
    `;
    return;
  }

  mount.innerHTML = `
    <div class="activation-card activation-card-progress">
      <div class="activation-card-copy">
        <div class="activation-card-kicker">Primer desafío</div>
        <div class="activation-card-title">Tu primer desafío está en marcha</div>
        <div class="activation-card-text">Ya cargaste ${count} de ${INVENTORY_CHALLENGE_GOAL} productos. Nestra ya empieza a ayudarte desde ahora. Cuando llegues a 10, va a tener mucho más contexto para mostrarte mejor qué conviene usar, reponer y completar.</div>
      </div>
      <div class="activation-progress-block">
        <div class="activation-progress-meta">
          <span>${count} / ${INVENTORY_CHALLENGE_GOAL} productos cargados</span>
          <strong>${progressPercent}%</strong>
        </div>
        <div class="activation-progress-bar">
          <span style="width:${progressPercent}%"></span>
        </div>
      </div>
      <div class="activation-card-actions">
        <button class="btn primary btn-inline" type="button" onclick="showPage('scanner')"><i class="ti ti-plus"></i> Seguir cargando</button>
      </div>
    </div>
  `;
}

async function persistChallengeCompletion() {
  const currentMetadata = getChallengeMeta();

  const { data, error } = await sb.auth.updateUser({
    data: {
      ...currentMetadata,
      firstInventoryChallengeCompleted: true,
      firstInventoryChallengeCompletedAt: new Date().toISOString(),
    },
  });

  if (error) {
    throw error;
  }

  if (data?.user) {
    state.currentUser = data.user;
  }
}

export async function syncInventoryChallengeCompletion({ showCelebration = false } = {}) {
  if (getInventoryProductsCount() < INVENTORY_CHALLENGE_GOAL || isInventoryChallengeCompleted()) {
    return false;
  }

  try {
    await persistChallengeCompletion();
    if (showCelebration) {
      openActivationModal({
        title: "Tu cocina ya empezó a recordar",
        body: "Cargaste tus primeros 10 productos. Ahora Nestra tiene una base mucho más útil para ayudarte a organizar mejor tu cocina, detectar prioridades y comprar con más claridad.",
        primaryLabel: "Ver mi cocina",
        secondaryLabel: "Seguir cargando",
        action: "completed",
      });
    }
    return true;
  } catch {
    showToast("No pudimos guardar el avance de tu desafío.", { type: "error" });
    return false;
  }
}

export async function initializeInventoryChallenge() {
  const completedNow = await syncInventoryChallengeCompletion({ showCelebration: false });
  if (completedNow) {
    renderList();
  }
}

export async function handleInventoryProductAdded() {
  const count = getInventoryProductsCount();

  if (isInventoryChallengeCompleted()) {
    return;
  }

  if (count >= INVENTORY_CHALLENGE_GOAL) {
    const completedNow = await syncInventoryChallengeCompletion({ showCelebration: true });
    if (completedNow) {
      renderList();
    }
    return;
  }

  openActivationModal({
    title: "Producto guardado",
    body: `Ya cargaste ${count} de ${INVENTORY_CHALLENGE_GOAL} productos.`,
    primaryLabel: "Cargar otro",
    secondaryLabel: "Volver a mi cocina",
    action: "load-more",
  });
}
