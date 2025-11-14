"use strict";

function parseCookies(cookieHeader = "") {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader.split(";").reduce((acc, part) => {
    const [name, ...rest] = part.split("=");
    if (!name) {
      return acc;
    }
    const value = rest.join("=");
    acc[name.trim()] = decodeURIComponent(value.trim());
    return acc;
  }, {});
}

function serializeCookie(name, value, options = {}) {
  if (!name) {
    throw new Error("Cookie name required");
  }

  const encodedValue = encodeURIComponent(value ?? "");
  let cookie = `${name}=${encodedValue}`;

  if (options.maxAge) {
    cookie += `; Max-Age=${Math.floor(options.maxAge / 1000)}`;
  }

  if (options.expires) {
    cookie += `; Expires=${options.expires.toUTCString()}`;
  }

  cookie += `; Path=${options.path || "/"}`;

  if (options.httpOnly !== false) {
    cookie += "; HttpOnly";
  }

  if (options.secure) {
    cookie += "; Secure";
  }

  if (options.sameSite) {
    cookie += `; SameSite=${options.sameSite}`;
  }

  return cookie;
}

module.exports = {
  parseCookies,
  serializeCookie,
};

