// Spreadsheet-style keyboard navigation for forms, for a mouse-less user.
// Enter/ArrowDown move forward, ArrowUp moves back, ArrowLeft/ArrowRight
// move back/forward but only once the text cursor is already at that edge
// of the field (so normal in-field text editing still works). Enter on the
// last field submits the form. `skipWhenFilled` (e.g. { debit: "credit" })
// skips a mutually-exclusive field when the one before it has a value.

function getFocusable(form) {
  return Array.from(form.elements).filter(
    (el) => (el.tagName === "INPUT" || el.tagName === "SELECT") && el.type !== "hidden" && !el.disabled
  );
}

function nextIndex(focusable, index, skipWhenFilled) {
  const current = focusable[index];
  let next = index + 1;
  if (
    skipWhenFilled &&
    current &&
    skipWhenFilled[current.name] &&
    current.value &&
    focusable[next]?.name === skipWhenFilled[current.name]
  ) {
    next += 1;
  }
  return next;
}

function isAtEdge(el, edge) {
  if (el.tagName === "SELECT") return true;
  if (el.type === "number" || el.type === "date") return true;
  try {
    return edge === "start" ? el.selectionStart === 0 : el.selectionEnd === el.value.length;
  } catch {
    return true;
  }
}

export function handleFieldNav(e, { skipWhenFilled } = {}) {
  const el = e.target;
  if (el.tagName !== "INPUT" && el.tagName !== "SELECT") return;
  const form = el.form;
  if (!form) return;
  const focusable = getFocusable(form);
  const index = focusable.indexOf(el);

  if (e.key === "Enter" || e.key === "ArrowDown") {
    e.preventDefault();
    const next = focusable[nextIndex(focusable, index, skipWhenFilled)];
    if (next) next.focus();
    else if (e.key === "Enter") form.requestSubmit();
    return;
  }

  if (e.key === "ArrowUp") {
    e.preventDefault();
    focusable[index - 1]?.focus();
    return;
  }

  if (e.key === "ArrowRight" && isAtEdge(el, "end")) {
    e.preventDefault();
    focusable[nextIndex(focusable, index, skipWhenFilled)]?.focus();
    return;
  }

  if (e.key === "ArrowLeft" && isAtEdge(el, "start")) {
    e.preventDefault();
    focusable[index - 1]?.focus();
  }
}
