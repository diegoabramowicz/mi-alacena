import { track } from "@vercel/analytics";

const EVENT_NAMES = new Set([
  "landing_view",
  "auth_login_opened",
  "auth_signup_opened",
  "login_completed",
  "signup_completed",
  "home_created",
  "home_joined",
  "inventory_viewed",
  "product_created",
  "lot_added",
  "stock_discount_confirmed",
  "scanner_started",
  "scanner_success",
]);

const state = {
  onceKeys: new Set(),
  lastPageView: "",
};

function cleanProps(props = {}) {
  return Object.fromEntries(
    Object.entries(props).filter(([, value]) => value !== undefined && value !== null && value !== ""),
  );
}

export function trackEvent(name, props = {}) {
  if (!EVENT_NAMES.has(name)) return;

  try {
    track(name, cleanProps(props));
  } catch {}
}

export function trackOnce(name, key = name, props = {}) {
  if (state.onceKeys.has(key)) return;
  state.onceKeys.add(key);
  trackEvent(name, props);
}

export function trackPageView(page, props = {}) {
  if (!page || state.lastPageView === page) return;
  state.lastPageView = page;
  trackEvent(`${page}_viewed`, props);
}

export function setCurrentAnalyticsPage(page) {
  state.lastPageView = page || "";
}

export function resetAnalyticsSession() {
  state.onceKeys.clear();
  state.lastPageView = "";
}
