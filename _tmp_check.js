const { db } = require("./database/init");
const { getActiveProvider } = require("./utils/aiProvider");

(async () => {
  const c = await db.getConnection();
  const [rows] = await c.query(
    `SELECT id, provider_key, is_active, is_default,
            txt2img_enabled, img2img_enabled,
            txt2img_base_url, txt2img_create_endpoint,
            img2img_base_url, img2img_create_endpoint
     FROM ai_providers`,
  );
  console.log("DB:", JSON.stringify(rows, null, 2));

  for (const f of ["txt2img", "img2img"]) {
    const p = await getActiveProvider(f);
    console.log(
      f,
      "=>",
      p
        ? {
            key: p.provider_key,
            base: p[`${f}_base_url`],
            ep: p[`${f}_create_endpoint`],
            enabled: p[`${f}_enabled`],
          }
        : null,
    );
  }
  c.release();
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
