import {
  getClips,
  updateClip,
  deleteClip,
  getSettings
} from "./lib/storage.js";
import { formatClip } from "./lib/formatters.js";
import { FREE_CLIP_LIMIT, isPro } from "./lib/license.js";

const elements = {
  clips: document.querySelector("#clips"),
  empty: document.querySelector("#emptyState"),
  search: document.querySelector("#searchInput"),
  count: document.querySelector("#count"),
  limitNotice: document.querySelector("#limitNotice"),
  upgrade: document.querySelector("#upgradeButton"),
  exportJson: document.querySelector("#exportJson"),
  exportMarkdown: document.querySelector("#exportMarkdown"),
  options: document.querySelector("#optionsButton")
};

let clips = [];
let settings = {};

const formatLabels = {
  plain: "Plain",
  quote_url: "Quote + URL",
  markdown: "Markdown"
};

function t(key) {
  return chrome.i18n.getMessage(key) || key;
}

function applyI18n() {
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
    node.placeholder = t(node.dataset.i18nPlaceholder);
  });
}

function domainOf(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function dateOf(iso) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric"
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

async function copyText(text) {
  await navigator.clipboard.writeText(text);
}

function createFormatSelect(selected) {
  const select = document.createElement("select");
  select.setAttribute("aria-label", t("formatLabel"));

  Object.entries(formatLabels).forEach(([value, label]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    option.selected = value === selected;
    select.appendChild(option);
  });

  return select;
}

function render() {
  const query = elements.search.value.trim().toLowerCase();

  const filtered = clips.filter((clip) =>
    [clip.text, clip.title, clip.url].some((value) =>
      String(value).toLowerCase().includes(query)
    )
  );

  elements.clips.replaceChildren();
  elements.empty.classList.toggle("hidden", filtered.length !== 0);
  elements.count.textContent = `${clips.length}/${isPro() ? "∞" : FREE_CLIP_LIMIT}`;
  elements.limitNotice.classList.toggle(
    "hidden",
    isPro() || clips.length < FREE_CLIP_LIMIT
  );

  filtered.forEach((clip) => {
    const article = document.createElement("article");
    article.className = "clip";

    const text = document.createElement("p");
    text.className = "clip-text";
    text.textContent = clip.text;

    const meta = document.createElement("div");
    meta.className = "clip-meta";

    const source = document.createElement("span");
    source.className = "clip-source";
    source.textContent = `${domainOf(clip.url)} · ${dateOf(clip.date)}`;
    source.title = `${clip.title} — ${clip.url}`;

    meta.appendChild(source);

    const actions = document.createElement("div");
    actions.className = "clip-actions";

    const select = createFormatSelect(settings.defaultFormat);

    const copy = document.createElement("button");
    copy.type = "button";
    copy.textContent = t("copy");
    copy.addEventListener("click", async () => {
      try {
        await copyText(formatClip(clip, select.value, settings));
        copy.textContent = t("copied");
        setTimeout(() => { copy.textContent = t("copy"); }, 1200);
      } catch (error) {
        console.warn("[SourceDrop] Popup copy failed", error);
        copy.textContent = t("copyFailed");
      }
    });

    const favorite = document.createElement("button");
    favorite.type = "button";
    favorite.className = `favorite${clip.favorite ? " active" : ""}`;
    favorite.textContent = clip.favorite ? "★" : "☆";
    favorite.setAttribute("aria-label", t("favorite"));
    favorite.addEventListener("click", async () => {
      await updateClip(clip.id, { favorite: !clip.favorite });
      clips = await getClips();
      render();
    });

    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = t("delete");
    remove.addEventListener("click", async () => {
      await deleteClip(clip.id);
      clips = await getClips();
      render();
    });

    actions.append(select, copy, favorite, remove);
    article.append(text, meta, actions);
    elements.clips.appendChild(article);
  });
}

function download(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function markdownExport() {
  return clips.map((clip) =>
    formatClip(clip, "markdown", settings)
  ).join("\n\n---\n\n");
}

elements.search.addEventListener("input", render);

elements.exportJson.addEventListener("click", () => {
  download(
    "sourcedrop-export.json",
    JSON.stringify(clips, null, 2),
    "application/json"
  );
});

elements.exportMarkdown.addEventListener("click", () => {
  download(
    "sourcedrop-export.md",
    markdownExport(),
    "text/markdown"
  );
});

elements.upgrade.addEventListener("click", () => {
  window.alert(t("proComingSoon"));
});

elements.options.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

async function init() {
  applyI18n();
  settings = await getSettings();
  clips = await getClips();
  render();
}

init().catch((error) => {
  console.error("[SourceDrop] Popup initialization failed", error);
});
