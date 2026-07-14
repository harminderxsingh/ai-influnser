const { runContent } = require("./content");
const { runMakeInf } = require("./inf");
const { runInfVariation } = require("./infVariation");
const { productShowcase } = require("./productShow");
const { runTalkingVideo } = require("./talkingVideo");
const { withJobLock } = require("./jobLock");
const { getActiveProvider } = require("../utils/aiProvider");

const AI_LOOP_LOCK = "extract_ai_main_loop";
const AI_LOOP_LOCK_SECONDS = 120;

async function loop() {
  console.log("🔁 Main loop started");

  while (true) {
    try {
      // Resolve per feature so Gemini (images/text) and Veo (video) can both be active
      const [txt2img, img2img, reel, showcase, talking] = await Promise.all([
        getActiveProvider("txt2img"),
        getActiveProvider("img2img"),
        getActiveProvider("reel"),
        getActiveProvider("showcase"),
        getActiveProvider("talking"),
      ]);

      if (!txt2img && !img2img && !reel && !showcase && !talking) {
        console.log("⚠️  No active provider found, skipping...");
      } else {
        await withJobLock(AI_LOOP_LOCK, AI_LOOP_LOCK_SECONDS, async () => {
          if (txt2img) {
            console.log(`[loop] txt2img provider: ${txt2img.provider_key}`);
            await runMakeInf({ provider: txt2img });
          }
          if (img2img) {
            console.log(`[loop] img2img provider: ${img2img.provider_key}`);
            await runInfVariation({ provider: img2img });
          }
          if (reel) await runContent({ provider: reel });
          if (showcase) await productShowcase({ provider: showcase });
          if (talking) {
            console.log(`[loop] talking provider: ${talking.provider_key}`);
            await runTalkingVideo({ provider: talking });
          }
        });
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
