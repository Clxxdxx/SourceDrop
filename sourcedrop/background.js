/**
 * Service worker de SourceDrop.
 *
 * Importante para MV3: no se confía en estado global persistente.
 * Cada evento obtiene lo que necesita desde chrome.storage o desde el contexto
 * del evento.
 */

import { saveClip, getSettings } from "./lib/storage.js";
import { formatClip } from "./lib/formatters.js";
import { FREE_CLIP_LIMIT } from "./lib/license.js";

const MENU_SAVE = "sourcedrop-save";
const MENU_COPY = "sourcedrop-copy";
const MAX_CLIP_LENGTH = 5000;

function message(key, substitutions = []) {
  return chrome.i18n.getMessage(key, substitutions) || key;
}

function makeClip(info, tab) {
  const text = typeof info.selectionText === "string"
    ? info.selectionText.trim()
    : "";

  if (!text) {
    return { ok: false, reason: "empty" };
  }

  if (text.length > MAX_CLIP_LENGTH) {
    return { ok: false, reason: "too_long" };
  }

  if (!tab?.url || !tab?.title) {
    return { ok: false, reason: "unavailable" };
  }

  // chrome://, edge://, about: y otras páginas protegidas no son fuentes
  // capturables de forma fiable con esta extensión.
  if (/^(chrome|edge|about|devtools):/i.test(tab.url)) {
    return { ok: false, reason: "protected" };
  }

  return {
    ok: true,
    clip: {
      id: crypto.randomUUID(),
      text,
      title: tab.title,
      url: tab.url,
      date: new Date().toISOString(),
      favorite: false,
      tags: []
    }
  };
}

async function setBadge(text) {
  await chrome.action.setBadgeText({ text });
  if (text) {
    await chrome.action.setBadgeBackgroundColor({ color: "#b42318" });
    setTimeout(() => chrome.action.setBadgeText({ text: "" }), 2500);
  }
}

async function notifyFailure(reason) {
  const labels = {
    empty: "errorEmpty",
    too_long: "errorTooLong",
    unavailable: "errorUnavailable",
    protected: "errorProtected",
    duplicate: "errorDuplicate",
    limit: "errorLimit"
  };
  await setBadge("!");
  console.warn("[SourceDrop]", message(labels[reason] || "errorGeneric"));
}

chrome.runtime.onInstalled.addListener(async () => {
  await chrome.contextMenus.removeAll();

  chrome.contextMenus.create({
    id: MENU_SAVE,
    title: message("menuSave"),
    contexts: ["selection"]
  });

  chrome.contextMenus.create({
    id: MENU_COPY,
    title: message("menuCopy"),
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const result = makeClip(info, tab);

  if (!result.ok) {
    await notifyFailure(result.reason);
    return;
  }

  if (info.menuItemId === MENU_SAVE) {
    const saved = await saveClip(result.clip);

    if (!saved.ok) {
      await notifyFailure(saved.reason);
      return;
    }

    await setBadge("");
    return;
  }

  if (info.menuItemId === MENU_COPY) {
    try {
      // activeTab se solicita acceso temporal a la pestaña activa cuando
      // el usuario interactúa con ella. Esto evita host_permissions globales.
      const settings = await getSettings();
      const output = formatClip(result.clip, settings.defaultFormat, settings);

      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: async (text) => {
          await navigator.clipboard.writeText(text);
        },
        args: [output]
      });

      await setBadge("");
    } catch (error) {
      console.warn("[SourceDrop] Clipboard copy failed", error);
      await notifyFailure("unavailable");
    }
  }
});

// Referencia explícita para evitar que la constante de límite quede olvidada
// durante futuras modificaciones del worker.
void FREE_CLIP_LIMIT;
