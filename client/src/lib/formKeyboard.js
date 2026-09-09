// Enter moves focus to the next field, like Tab, instead of submitting.
// Lets a mouse-less keyboard user move through a form without ever
// accidentally submitting partway through.
export function focusNextFieldOnEnter(e) {
  if (e.key !== "Enter") return;
  if (e.target.tagName !== "INPUT" && e.target.tagName !== "SELECT") return;

  e.preventDefault();
  const form = e.target.form;
  if (!form) return;

  const focusable = Array.from(form.elements).filter(
    (el) => (el.tagName === "INPUT" || el.tagName === "SELECT") && el.type !== "hidden" && !el.disabled
  );
  const next = focusable[focusable.indexOf(e.target) + 1];
  if (next) next.focus();
}
