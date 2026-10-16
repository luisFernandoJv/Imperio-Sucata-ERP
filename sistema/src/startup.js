// This entry must stay independent of React/Firebase so import failures can be shown.
const recoveryKey = "imperio-startup-recovery-v1";

function isApplicationCache(name) {
  return (
    name.startsWith("imperio-sucata-") ||
    (name.startsWith("workbox-precache-v2-") &&
      name.endsWith(`${location.origin}/`))
  );
}

async function prepareDevelopment() {
  if (!import.meta.env.DEV) return false;
  const controller = navigator.serviceWorker?.controller;
  const registrations = navigator.serviceWorker
    ? await navigator.serviceWorker.getRegistrations()
    : [];
  await Promise.all(
    registrations
      .filter((registration) => {
        const worker =
          registration.active ||
          registration.waiting ||
          registration.installing;
        if (!worker) return false;
        const url = new URL(worker.scriptURL);
        return (
          url.origin === location.origin &&
          ["/sw.js", "/dev-sw.js"].includes(url.pathname)
        );
      })
      .map((registration) => registration.unregister()),
  );
  if ("caches" in window) {
    const names = await caches.keys();
    await Promise.all(
      names.filter(isApplicationCache).map((name) => caches.delete(name)),
    );
  }
  const controlledByApp =
    controller &&
    ["/sw.js", "/dev-sw.js"].includes(new URL(controller.scriptURL).pathname);
  if (!controlledByApp) return false;
  // An unregistered worker still controls this document until the next navigation.
  let alreadyReloaded = false;
  try {
    alreadyReloaded = sessionStorage.getItem(recoveryKey) === "1";
    sessionStorage.setItem(recoveryKey, "1");
  } catch {
    /* The recovery page remains available if storage is restricted. */
  }
  if (alreadyReloaded)
    throw new Error("O cache antigo ainda controla esta página.");
  location.reload();
  return true;
}

function showStartupError(error) {
  console.error("[Inicialização] Não foi possível abrir o sistema:", error);
  const panel = document.getElementById("startup-message");
  if (!panel) return;
  panel.setAttribute("role", "alert");
  document.getElementById("startup-title").textContent =
    "Não foi possível abrir o sistema";
  document.getElementById("startup-description").textContent =
    "Tente novamente. Se o problema continuar, use a recuperação de carregamento ou confira as configurações da instalação. Nenhum registro foi alterado por esta tentativa de abertura.";
  document.getElementById("startup-reload").hidden = false;
}

document
  .getElementById("startup-reload")
  ?.addEventListener("click", () => location.reload());

async function start() {
  try {
    if (await prepareDevelopment()) return;
    await import("./main.jsx");
    try {
      sessionStorage.removeItem(recoveryKey);
    } catch {
      /* Optional recovery marker. */
    }
    // Production has one registration path; Vite generates sw.js for the build.
    if (import.meta.env.PROD && "serviceWorker" in navigator) {
      const register = () =>
        navigator.serviceWorker.register("/sw.js").catch((error) => {
          console.warn("[PWA] O modo offline não pôde ser iniciado:", error);
        });
      if (document.readyState === "complete") register();
      else window.addEventListener("load", register, { once: true });
    }
  } catch (error) {
    showStartupError(error);
  }
}

start();
