const { query } = require("../database/connection");
const { runContent } = require("./content");
const { runMakeInf } = require("./inf");
const { runInfVariation } = require("./infVariation");
const { productShowcase } = require("./productShow");
const { runTalkingVideo } = require("./talkingVideo");
const { withJobLock } = require("./jobLock");

const AI_LOOP_LOCK = "extract_ai_main_loop";
const AI_LOOP_LOCK_SECONDS = 120;

async function getApiKeys() {
  try {
    const [data] = await query(
      `SELECT * FROM ai_providers WHERE is_active = ? ORDER BY is_default DESC, id ASC LIMIT 1`,
      [1],
    );
    return data || null;
  } catch {
    return null;
  }
}

async function loop() {
  console.log("🔁 Main loop started");

  while (true) {
    try {
      const aiProvider = await getApiKeys();

      if (aiProvider) {
        await withJobLock(AI_LOOP_LOCK, AI_LOOP_LOCK_SECONDS, async () => {
          await runMakeInf({ provider: aiProvider });
          await runInfVariation({ provider: aiProvider });
          await runContent({ provider: aiProvider });
          await productShowcase({ provider: aiProvider });
          await runTalkingVideo({ provider: aiProvider });
        });
      } else {
        console.log("⚠️  No active provider found, skipping...");
      }
    } catch (err) {
      console.error("❌ Loop error:", err.message);
    }

    await new Promise((res) => setTimeout(res, 2000));
  }
}

function mainLoop() {
  loop().catch((err) => console.error("❌ Fatal loop crash:", err.message));
}

module.exports = { mainLoop };
