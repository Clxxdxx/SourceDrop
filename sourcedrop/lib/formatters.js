/**
 * Formatos de salida.
 * Cada formato es una función independiente para poder añadir otros más tarde.
 */

function escapeMarkdownUrl(url) {
  return String(url).replace(/\)/g, "%29");
}

function quoteText(text) {
  return `“${text}”`;
}

export const FORMATTERS = {
  plain(clip, options = {}) {
    return clip.text;
  },

  quote_url(clip, options = {}) {
    const datePart = options.includeDate === false
      ? ""
      : ` — Accessed: ${new Date(clip.date).toISOString().slice(0, 10)}`;
    return `${quoteText(clip.text)} — ${clip.title} (${clip.url})${datePart}`;
  },

  markdown(clip, options = {}) {
    const datePart = options.includeDate === false
      ? ""
      : `\n\n*Accessed: ${new Date(clip.date).toISOString().slice(0, 10)}*`;

    return `> ${clip.text.replace(/\n/g, "\n> ")}\n>\n> [${clip.title}](${escapeMarkdownUrl(clip.url)})${datePart}`;
  }
};

export function formatClip(clip, format, options = {}) {
  const formatter = FORMATTERS[format] || FORMATTERS.plain;
  return formatter(clip, options);
}
