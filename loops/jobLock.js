const { query } = require("../database/connection");

async function acquireJobLock(name, timeoutSeconds = 90) {
  const [row] = await query(`SELECT GET_LOCK(?, ?) AS acquired`, [
    name,
    timeoutSeconds,
  ]);
  return row?.acquired === 1;
}

async function releaseJobLock(name) {
  await query(`SELECT RELEASE_LOCK(?)`, [name]);
}

async function withJobLock(name, timeoutSeconds, fn) {
  const acquired = await acquireJobLock(name, timeoutSeconds);
  if (!acquired) return false;

  try {
    await fn();
    return true;
  } finally {
    await releaseJobLock(name);
  }
}

module.exports = { acquireJobLock, releaseJobLock, withJobLock };
