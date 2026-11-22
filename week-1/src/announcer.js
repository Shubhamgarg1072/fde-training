const region = document.querySelector('[data-announcer]');

export function announce(message) {
  // Clearing first makes screen readers repeat a message that is identical to the last one.
  region.textContent = '';
  requestAnimationFrame(() => {
    region.textContent = message;
  });
}
