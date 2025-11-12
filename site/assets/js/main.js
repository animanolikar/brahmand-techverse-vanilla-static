(() => {
  const onReady = (fn) => {
    if (document.readyState !== "loading") {
      fn();
    } else {
      document.addEventListener("DOMContentLoaded", fn);
    }
  };

  const setupNav = () => {
    const megaToggle = document.querySelector("[data-mega-toggle]");
    const megaMenu = document.querySelector("[data-mega-menu]");

    if (megaToggle && megaMenu) {
      megaMenu.setAttribute(
        "aria-hidden",
        megaMenu.classList.contains("open") ? "false" : "true",
      );
      const closeMega = () => {
        megaMenu.classList.remove("open");
        megaToggle.setAttribute("aria-expanded", "false");
        megaMenu.setAttribute("aria-hidden", "true");
      };

      megaToggle.addEventListener("click", () => {
        const nextExpanded = megaToggle.getAttribute("aria-expanded") !== "true";
        megaToggle.setAttribute("aria-expanded", nextExpanded.toString());
        megaMenu.classList.toggle("open", nextExpanded);
        megaMenu.setAttribute("aria-hidden", (!nextExpanded).toString());
      });

      megaToggle.addEventListener("keydown", (event) => {
        if (event.key === "ArrowDown") {
          event.preventDefault();
          megaMenu.classList.add("open");
          megaToggle.setAttribute("aria-expanded", "true");
          megaMenu.setAttribute("aria-hidden", "false");
          const firstLink = megaMenu.querySelector("a");
          if (firstLink) firstLink.focus();
        }
      });

      megaMenu.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          closeMega();
          megaToggle.focus();
        }
      });

      document.addEventListener("click", (event) => {
        if (!megaMenu.contains(event.target) && event.target !== megaToggle) {
          closeMega();
        }
      });
    }
  };

  const setupConsentBanner = () => {
    const banner = document.querySelector("[data-consent-banner]");
    if (!banner) return;

    const storageKey = "brahmand-consent";
    const storedValue = localStorage.getItem(storageKey);
    if (!storedValue) {
      banner.classList.add("visible");
    }

    banner.addEventListener("click", (event) => {
      const action = event.target.getAttribute("data-consent-action");
      if (!action) return;

      localStorage.setItem(storageKey, action);
      banner.classList.remove("visible");
    });
  };

  const setupStickyAds = () => {
    document.querySelectorAll("[data-sticky-ad]").forEach((slot) => {
      if (slot.dataset.enriched === "true") return;
      slot.dataset.enriched = "true";
      slot.innerHTML = `
        <div class="ad-slot">
          <p>AdSense Smart Slot</p>
          <small>Serve 300x600 / 160x600 creative</small>
        </div>
      `;
    });
  };

  onReady(() => {
    setupNav();
    setupConsentBanner();
    setupStickyAds();
  });
})();
