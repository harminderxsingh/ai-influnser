const crypto = require("crypto");

function normalizeSubmissionKey(raw) {
  if (typeof raw === "string" && /^[a-zA-Z0-9_-]{12,64}$/.test(raw.trim())) {
    return raw.trim();
  }

  return crypto.randomUUID();
}

module.exports = { normalizeSubmissionKey };
