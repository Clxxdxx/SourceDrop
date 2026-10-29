/**
 * Capa pequeña sobre chrome.storage.local.
 * Mantiene el resto de la aplicación independiente de la forma de persistir datos.
 */

import { FREE_CLIP_LIMIT, isPro } from "./license.js";

export const STORAGE_KEY = "clips";
export const SETTINGS_KEY = "settings";

export const DEFAULT_SETTINGS = {
  defaultFormat: "plain",
  includeDate: true
};

export async function getClips() {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  const clips = Array.isArray(data[STORAGE_KEY]) ? data[STORAGE_KEY] : [];
  return clips;
}

export async function saveClip(clip) {
  const clips = await getClips();

  if (!isPro() && clips.length >= FREE_CLIP_LIMIT) {
    return { ok: false, reason: "limit" };
  }

  const duplicate = clips.some(
    (item) => item.text === clip.text && item.url === clip.url
  );
  if (duplicate) {
    return { ok: false, reason: "duplicate" };
  }

  clips.unshift(clip);
  await chrome.storage.local.set({ [STORAGE_KEY]: clips });
  return { ok: true, clip };
}

export async function updateClip(id, patch) {
  const clips = await getClips();
  const index = clips.findIndex((clip) => clip.id === id);
  if (index === -1) return false;

  clips[index] = { ...clips[index], ...patch };
  await chrome.storage.local.set({ [STORAGE_KEY]: clips });
  return true;
}

export async function deleteClip(id) {
  const clips = await getClips();
  const next = clips.filter((clip) => clip.id !== id);
  await chrome.storage.local.set({ [STORAGE_KEY]: next });
  return next.length !== clips.length;
}

export async function getSettings() {
  const data = await chrome.storage.local.get(SETTINGS_KEY);
  return {
    ...DEFAULT_SETTINGS,
    ...(data[SETTINGS_KEY] || {})
  };
}

export async function setSettings(settings) {
  await chrome.storage.local.set({
    [SETTINGS_KEY]: { ...DEFAULT_SETTINGS, ...settings }
  });
}

export async function exportAllClips() {
  return getClips();
}
