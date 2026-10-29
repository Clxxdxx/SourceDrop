import { getSettings, setSettings } from "./lib/storage.js";

const format = document.querySelector("#defaultFormat");
const includeDate = document.querySelector("#includeDate");
const saved = document.querySelector("#saved");

function t(key) {
  return chrome.i18n.getMessage(key) || key;
}

function applyI18n() {
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
}

async function init() {
  applyI18n();
  const settings = await getSettings();
  format.value = settings.defaultFormat;
  includeDate.checked = settings.includeDate;
}

async function save() {
  await setSettings({
    defaultFormat: format.value,
    includeDate: includeDate.checked
  });
  saved.textContent = t("settingsSaved");
  setTimeout(() => { saved.textContent = ""; }, 1500);
}

format.addEventListener("change", save);
includeDate.addEventListener("change", save);

init().catch((error) => {
  console.error("[SourceDrop] Options initialization failed", error);
});
