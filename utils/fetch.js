const axios = require("axios");

let cachedFetch = null;

async function loadFetch() {
  if (cachedFetch) return cachedFetch;

  if (typeof globalThis.fetch === "function") {
    cachedFetch = globalThis.fetch.bind(globalThis);
    return cachedFetch;
  }

  cachedFetch = async (url, options = {}) => {
    const response = await axios({
      url,
      method: options.method || "GET",
      headers: options.headers,
      data: options.body,
      validateStatus: () => true,
    });

    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      json: async () => response.data,
      text: async () =>
        typeof response.data === "string"
          ? response.data
          : JSON.stringify(response.data),
    };
  };
  return cachedFetch;
}

async function fetchCompat(...args) {
  const fetch = await loadFetch();
  return fetch(...args);
}

module.exports = fetchCompat;
