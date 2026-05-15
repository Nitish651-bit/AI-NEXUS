/**
 * DOM action executor — finds and acts on visible interactive elements
 * by their accessible name. Powers voice commands like "click activate",
 * "press settings", "scroll down", "open menu", etc.
 */

const isVisible = (el: Element): boolean => {
  const rect = (el as HTMLElement).getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return false;
  const style = window.getComputedStyle(el as HTMLElement);
  if (style.visibility === "hidden" || style.display === "none" || style.opacity === "0") return false;
  return true;
};

const accessibleName = (el: Element): string => {
  const aria = el.getAttribute("aria-label");
  if (aria) return aria.trim();
  const labelledby = el.getAttribute("aria-labelledby");
  if (labelledby) {
    const ref = document.getElementById(labelledby);
    if (ref?.textContent) return ref.textContent.trim();
  }
  const title = el.getAttribute("title");
  if (title) return title.trim();
  const text = (el as HTMLElement).innerText || el.textContent || "";
  return text.replace(/\s+/g, " ").trim();
};

const INTERACTIVE_SELECTOR =
  'button, a[href], [role="button"], [role="link"], [role="menuitem"], [role="tab"], input[type="button"], input[type="submit"], summary';

const score = (name: string, query: string): number => {
  const n = name.toLowerCase();
  const q = query.toLowerCase().trim();
  if (!q) return 0;
  if (n === q) return 100;
  if (n.startsWith(q)) return 80;
  if (n.includes(q)) return 60;
  // word overlap
  const qWords = q.split(/\s+/).filter(Boolean);
  const matches = qWords.filter((w) => n.includes(w)).length;
  if (matches === qWords.length) return 50;
  if (matches > 0) return 20 + matches * 5;
  return 0;
};

export interface DomActionResult {
  ok: boolean;
  message: string;
  matchedLabel?: string;
}

/** Click the visible interactive element best matching `query`. */
export function clickByLabel(query: string): DomActionResult {
  const candidates: { el: Element; name: string; s: number }[] = [];
  document.querySelectorAll(INTERACTIVE_SELECTOR).forEach((el) => {
    if (!isVisible(el)) return;
    const name = accessibleName(el);
    if (!name) return;
    const s = score(name, query);
    if (s > 0) candidates.push({ el, name, s });
  });
  if (candidates.length === 0) {
    return { ok: false, message: `I could not find anything labeled "${query}" on this page.` };
  }
  candidates.sort((a, b) => b.s - a.s);
  const best = candidates[0];
  (best.el as HTMLElement).scrollIntoView({ behavior: "smooth", block: "center" });
  setTimeout(() => (best.el as HTMLElement).click(), 150);
  return { ok: true, matchedLabel: best.name, message: `Clicking ${best.name}` };
}

/** Scroll the page. amount: "up" | "down" | "top" | "bottom" | "left" | "right" */
export function scrollPage(direction: string): DomActionResult {
  const d = direction.toLowerCase();
  const step = window.innerHeight * 0.85;
  if (d.includes("top")) {
    window.scrollTo({ top: 0, behavior: "smooth" });
    return { ok: true, message: "Scrolling to top" };
  }
  if (d.includes("bottom") || d.includes("end")) {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    return { ok: true, message: "Scrolling to bottom" };
  }
  if (d.includes("up")) {
    window.scrollBy({ top: -step, behavior: "smooth" });
    return { ok: true, message: "Scrolling up" };
  }
  if (d.includes("down")) {
    window.scrollBy({ top: step, behavior: "smooth" });
    return { ok: true, message: "Scrolling down" };
  }
  return { ok: false, message: `I don't know how to scroll ${direction}.` };
}

/** Fill the focused or best-matched input with text. */
export function fillInput(label: string, value: string): DomActionResult {
  let target: HTMLInputElement | HTMLTextAreaElement | null = null;
  if (label) {
    const inputs = Array.from(
      document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input, textarea")
    ).filter((el) => isVisible(el) && !el.disabled && !el.readOnly);
    const scored = inputs
      .map((el) => {
        const name =
          el.getAttribute("aria-label") ||
          el.getAttribute("placeholder") ||
          el.getAttribute("name") ||
          (el.id && document.querySelector(`label[for="${el.id}"]`)?.textContent) ||
          "";
        return { el, s: score(name, label) };
      })
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s);
    target = scored[0]?.el ?? null;
  }
  if (!target) {
    const active = document.activeElement;
    if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA")) {
      target = active as HTMLInputElement | HTMLTextAreaElement;
    }
  }
  if (!target) return { ok: false, message: `I could not find an input matching "${label}".` };

  const setter = Object.getOwnPropertyDescriptor(
    target.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype,
    "value"
  )?.set;
  setter?.call(target, value);
  target.dispatchEvent(new Event("input", { bubbles: true }));
  target.dispatchEvent(new Event("change", { bubbles: true }));
  target.focus();
  return { ok: true, message: `Filled ${label || "input"} with ${value}` };
}

/** Go back / forward in history. */
export function historyAction(action: "back" | "forward"): DomActionResult {
  if (action === "back") {
    window.history.back();
    return { ok: true, message: "Going back" };
  }
  window.history.forward();
  return { ok: true, message: "Going forward" };
}
