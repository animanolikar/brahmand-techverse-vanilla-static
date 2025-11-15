(() => {
  const onReady = (fn) => {
    if (document.readyState !== "loading") {
      fn();
    } else {
      document.addEventListener("DOMContentLoaded", fn);
    }
  };

  const hydrateMenus = (data) => {
    if (!data) return;
    const navList = document.querySelector(".navbar nav ul");
    if (navList && Array.isArray(data.header) && data.header.length) {
      navList.innerHTML = "";
      data.header.forEach((item) => {
        const li = document.createElement("li");
        const link = document.createElement("a");
        link.href = item.url;
        link.textContent = item.label;
        li.appendChild(link);
        navList.appendChild(li);
      });
      const exploreLi = document.createElement("li");
      const exploreBtn = document.createElement("button");
      exploreBtn.className = "button-secondary";
      exploreBtn.type = "button";
      exploreBtn.textContent = "Explore";
      exploreBtn.setAttribute("data-mega-toggle", "");
      exploreBtn.setAttribute("aria-expanded", "false");
      exploreBtn.setAttribute("aria-haspopup", "true");
      exploreBtn.setAttribute("aria-controls", "mega-menu");
      exploreLi.appendChild(exploreBtn);
      navList.appendChild(exploreLi);
    }

    const megaMenu = document.querySelector("[data-mega-menu] .mega-grid");
    if (megaMenu && Array.isArray(data.mega) && data.mega.length) {
      megaMenu.innerHTML = "";
      data.mega.forEach((section) => {
        const col = document.createElement("div");
        col.className = "mega-column";
        col.innerHTML = `<h4>${section.title}</h4>`;
        const list = document.createElement("ul");
        (section.links || []).forEach((link) => {
          const li = document.createElement("li");
          const anchor = document.createElement("a");
          anchor.href = link.url;
          anchor.textContent = link.label;
          li.appendChild(anchor);
          list.appendChild(li);
        });
        col.appendChild(list);
        megaMenu.appendChild(col);
      });
    }
  };

  const loadMenus = async () => {
    try {
      const response = await fetch("/assets/data/menus.json", { cache: "no-store" });
      if (!response.ok) return null;
      const data = await response.json();
      hydrateMenus(data);
      return data;
    } catch {
      return null;
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

  const setupThemeToggle = () => {
    const toggle = document.querySelector("[data-theme-toggle]");
    if (!toggle) return;

    const storageKey = "brahmand-theme";
    const storage = (() => {
      try {
        const testKey = "__brahmand-theme-test";
        window.localStorage.setItem(testKey, "1");
        window.localStorage.removeItem(testKey);
        return window.localStorage;
      } catch (error) {
        return null;
      }
    })();

    const root = document.documentElement;
    const getStoredTheme = () => (storage ? storage.getItem(storageKey) : null);
    const setStoredTheme = (value) => {
      if (!storage) return;
      storage.setItem(storageKey, value);
    };

    const mediaQuery = window.matchMedia
      ? window.matchMedia("(prefers-color-scheme: light)")
      : null;
    const systemPreference = () =>
      mediaQuery && mediaQuery.matches ? "light" : "dark";

    const savedTheme = getStoredTheme();
    let manualOverride = Boolean(savedTheme);
    let currentTheme = savedTheme || systemPreference();

    const applyTheme = (theme, persist = true) => {
      root.setAttribute("data-theme", theme);
      document.body.classList.toggle("theme-light", theme === "light");
      toggle.textContent = theme === "light" ? "☀" : "☾";
      toggle.setAttribute("aria-pressed", theme === "light" ? "true" : "false");
      if (persist) setStoredTheme(theme);
    };

    applyTheme(currentTheme, manualOverride);

    toggle.addEventListener("click", () => {
      currentTheme = document.body.classList.contains("theme-light") ? "dark" : "light";
      manualOverride = true;
      applyTheme(currentTheme);
    });

    if (mediaQuery) {
      const handleChange = (event) => {
        if (manualOverride) return;
        currentTheme = event.matches ? "light" : "dark";
        applyTheme(currentTheme, false);
      };
      if (typeof mediaQuery.addEventListener === "function") {
        mediaQuery.addEventListener("change", handleChange);
      } else if (typeof mediaQuery.addListener === "function") {
        mediaQuery.addListener(handleChange);
      }
    }
  };

  onReady(async () => {
    await loadMenus();
    setupNav();
    setupConsentBanner();
    setupStickyAds();
    setupThemeToggle();
  });
})();
