// Dados cadastrais são texto, inclusive quando contêm marcação ou fórmulas.
export function escapeHtml(value) {
  const entities = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return String(value ?? "").replace(/[&<>"']/g, (char) => entities[char]);
}

export function csvText(value) {
  let text = String(value ?? "");
  if (/^[\s\p{Cc}]*[=+\-@]/u.test(text)) text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}
