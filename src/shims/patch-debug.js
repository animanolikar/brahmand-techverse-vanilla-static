"use strict";

const Module = require("module");

if (!global.__BRAHMAND_DEBUG_PATCHED__) {
  const originalLoad = Module._load;

  Module._load = function patchedLoad(request, parent, isMain) {
    const exported = originalLoad.apply(this, arguments);

    if (
      request === "debug" &&
      exported &&
      typeof exported !== "function" &&
      typeof exported.default === "function"
    ) {
      const debugFn = exported.default;
      Object.assign(debugFn, exported);

      try {
        const resolved = Module._resolveFilename(request, parent, isMain);
        const cached = Module._cache?.[resolved];
        if (cached) {
          cached.exports = debugFn;
        }
      } catch {
        // noop
      }

      return debugFn;
    }

    return exported;
  };

  global.__BRAHMAND_DEBUG_PATCHED__ = true;
}

