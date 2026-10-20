// Sadece duman testi için: render sırasındaki hataları yakalar.
const errors = [];
function push(entry) {
  try {
    errors.push(entry);
    window.__BATEO_ERRORS = errors;
  } catch {
    /* yoksay */
  }
}
window.addEventListener("error", (e) => {
  push({
    type: "error",
    message: e.message,
    stack: e.error && e.error.stack ? String(e.error.stack).slice(0, 1500) : undefined,
  });
});
window.addEventListener("unhandledrejection", (e) => {
  const r = e.reason;
  push({
    type: "rejection",
    message: r && (r.message || (typeof r === "string" ? r : JSON.stringify(r))),
    stack: r && r.stack ? String(r.stack).slice(0, 1500) : undefined,
  });
});
window.__BATEO_ERRORS = errors;
