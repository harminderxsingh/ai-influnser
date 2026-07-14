/**
 * Merge google_veo + google_gemini → single provider_key = google
 */
const GOOGLE_BASE = "https://generativelanguage.googleapis.com";

function pickKey(...vals) {
  for (const v of vals) {
    const s = String(v || "").trim();
    if (s && s !== "YOUR_API_KEY" && s !== "YOUR_VSK_KEY") return s;
  }
  return "YOUR_API_KEY";
}

async function mergeGoogleProviders(db) {
  const c = await db.getConnection();
  try {
    const [rows] = await c.query(
      `SELECT * FROM ai_providers WHERE provider_key IN ('google','google_veo','google_gemini')`,
    );
    const byKey = Object.fromEntries(
      (rows || []).map((r) => [r.provider_key, r]),
    );

    let google = byKey.google;
    const veo = byKey.google_veo;
    const gemini = byKey.google_gemini;

    if (!veo && !gemini) {
      // Already merged (or fresh google-only) — do not overwrite live config
      return { merged: false, reason: "no_legacy" };
    }

    if (!google && !veo && !gemini) {
      return { merged: false, reason: "no_legacy" };
    }

    if (!google && veo) {
      await c.query(
        `UPDATE ai_providers SET provider_key = 'google', name = 'Google AI' WHERE id = ?`,
        [veo.id],
      );
      console.log("Renamed google_veo → google");
    } else if (!google && gemini) {
      await c.query(
        `UPDATE ai_providers SET provider_key = 'google', name = 'Google AI' WHERE id = ?`,
        [gemini.id],
      );
      console.log("Renamed google_gemini → google");
    }

    const [all] = await c.query(
      `SELECT * FROM ai_providers WHERE provider_key IN ('google','google_veo','google_gemini')`,
    );
    const map = Object.fromEntries(all.map((r) => [r.provider_key, r]));
    google = map.google;

    if (!google) {
      await c.query(
        `INSERT INTO ai_providers (name, provider_key, is_active, is_default) VALUES ('Google AI', 'google', 1, 1)`,
      );
      const [fresh] = await c.query(
        `SELECT * FROM ai_providers WHERE provider_key = 'google' LIMIT 1`,
      );
      google = fresh[0];
      map.google = google;
    }

    const srcVeo = map.google_veo || google;
    const srcGem = map.google_gemini || google;

    const apiKey = pickKey(
      google.txt2txt_api_key,
      google.txt2img_api_key,
      google.reel_api_key,
      google.talking_api_key,
      srcGem.txt2txt_api_key,
      srcGem.txt2img_api_key,
      srcVeo.reel_api_key,
      srcVeo.talking_api_key,
      srcVeo.showcase_api_key,
    );

    const talkingPayload = {
      instances: [
        {
          prompt:
            'The person in the image talks directly to the camera and says: "{{text}}". Natural lip movement, clear speech, realistic talking-head, cinematic lighting, {{aspectRatio}} vertical framing.',
          image: {
            bytesBase64Encoded: "@url_to_b64:{{imageUrl}}",
            mimeType: "image/jpeg",
          },
        },
      ],
      parameters: {
        aspectRatio: "{{aspectRatio}}",
        durationSeconds: 8,
        personGeneration: "allow_adult",
      },
    };

    const reelPayload =
      srcVeo.reel_create_payload ||
      JSON.stringify({
        instances: [
          {
            prompt:
              "The character is performing the action from the reference video, cinematic motion, natural movement",
            image: {
              bytesBase64Encoded: "@url_to_b64:{{character_image_url}}",
              mimeType: "image/jpeg",
            },
          },
        ],
        parameters: {
          aspectRatio: "9:16",
          durationSeconds: 8,
          personGeneration: "allow_adult",
        },
      });

    const showcasePayload =
      srcVeo.showcase_create_payload ||
      JSON.stringify({
        instances: [
          {
            prompt: "{{text}}",
            image: {
              bytesBase64Encoded: "@url_to_b64:{{image_url_1}}",
              mimeType: "image/jpeg",
            },
            lastFrame: {
              bytesBase64Encoded: "@url_to_b64:{{image_url_2}}",
              mimeType: "image/jpeg",
            },
          },
        ],
        parameters: {
          aspectRatio: "{{aspect_ratio}}",
          durationSeconds: 8,
          personGeneration: "allow_adult",
        },
      });

    await c.query(
      `UPDATE ai_providers SET
        name = 'Google AI',
        is_active = 1,
        txt2txt_enabled = 1,
        txt2txt_base_url = ?,
        txt2txt_api_key = ?,
        txt2txt_auth_type = 'custom_header',
        txt2txt_auth_header_key = 'x-goog-api-key',
        txt2txt_auth_header_prefix = '',
        txt2txt_create_endpoint = '/v1beta/models/gemini-2.0-flash:generateContent',
        txt2txt_create_method = 'POST',
        txt2txt_create_payload = ?,
        txt2txt_result_path = 'candidates[0].content.parts[0].text',
        // Imagen needs paid Google billing — keep OFF; use xAI Grok for images
        txt2img_enabled = 0,
        txt2img_base_url = ?,
        txt2img_api_key = ?,
        txt2img_auth_type = 'custom_header',
        txt2img_auth_header_key = 'x-goog-api-key',
        txt2img_auth_header_prefix = '',
        txt2img_create_endpoint = '/v1beta/models/imagen-4.0-fast-generate-001:predict',
        txt2img_create_method = 'POST',
        txt2img_create_payload = ?,
        txt2img_job_id_path = 'predictions[0].bytesBase64Encoded',
        txt2img_status_endpoint = '',
        txt2img_result_path = '@b64data(predictions[0].bytesBase64Encoded)',
        img2img_enabled = 0,
        img2img_base_url = ?,
        img2img_api_key = ?,
        img2img_auth_type = 'custom_header',
        img2img_auth_header_key = 'x-goog-api-key',
        img2img_auth_header_prefix = '',
        img2img_create_endpoint = '/v1beta/models/imagen-3.0-capability-001:predict',
        img2img_create_method = 'POST',
        img2img_create_payload = ?,
        img2img_job_id_path = 'predictions[0].bytesBase64Encoded',
        img2img_status_endpoint = '',
        img2img_result_path = '@b64data(predictions[0].bytesBase64Encoded)',
        reel_enabled = 1,
        reel_base_url = ?,
        reel_api_key = ?,
        reel_auth_type = 'custom_header',
        reel_auth_header_key = 'x-goog-api-key',
        reel_auth_header_prefix = '',
        reel_create_endpoint = '/v1beta/models/veo-3.1-fast-generate-preview:predictLongRunning',
        reel_create_method = 'POST',
        reel_create_payload = ?,
        reel_job_id_path = 'name',
        reel_status_endpoint = '/v1beta/{{taskId}}',
        reel_status_method = 'GET',
        reel_state_path = 'done',
        reel_success_state = 'true',
        reel_failed_state = 'error',
        reel_result_path = 'response.generateVideoResponse.generatedSamples[0].video.uri',
        showcase_enabled = 1,
        showcase_base_url = ?,
        showcase_api_key = ?,
        showcase_auth_type = 'custom_header',
        showcase_auth_header_key = 'x-goog-api-key',
        showcase_auth_header_prefix = '',
        showcase_create_endpoint = '/v1beta/models/veo-3.1-fast-generate-preview:predictLongRunning',
        showcase_create_method = 'POST',
        showcase_create_payload = ?,
        showcase_job_id_path = 'name',
        showcase_status_endpoint = '/v1beta/{{taskId}}',
        showcase_status_method = 'GET',
        showcase_state_path = 'done',
        showcase_success_state = 'true',
        showcase_failed_state = 'error',
        showcase_result_path = 'response.generateVideoResponse.generatedSamples[0].video.uri',
        talking_enabled = 1,
        talking_base_url = ?,
        talking_api_key = ?,
        talking_auth_type = 'custom_header',
        talking_auth_header_key = 'x-goog-api-key',
        talking_auth_header_prefix = '',
        talking_create_endpoint = '/v1beta/models/veo-3.1-fast-generate-preview:predictLongRunning',
        talking_create_method = 'POST',
        talking_create_payload = ?,
        talking_job_id_path = 'name',
        talking_status_endpoint = '/v1beta/{{taskId}}',
        talking_status_method = 'GET',
        talking_state_path = 'done',
        talking_success_state = 'true',
        talking_failed_state = 'error',
        talking_result_path = 'response.generateVideoResponse.generatedSamples[0].video.uri'
      WHERE provider_key = 'google'`,
      [
        GOOGLE_BASE,
        apiKey,
        JSON.stringify({ model: "gemini-2.0-flash" }),
        GOOGLE_BASE,
        apiKey,
        JSON.stringify({
          instances: [{ prompt: "{{prompt}}" }],
          parameters: { sampleCount: 1, aspectRatio: "9:16" },
        }),
        GOOGLE_BASE,
        apiKey,
        JSON.stringify({
          instances: [
            {
              prompt: "{{prompt}}",
              referenceImages: [
                {
                  referenceType: "REFERENCE_TYPE_SUBJECT",
                  referenceId: 1,
                  referenceImage: {
                    bytesBase64Encoded: "@url_to_b64:{{reference_url}}",
                  },
                },
              ],
            },
          ],
          parameters: { sampleCount: 1, aspectRatio: "9:16" },
        }),
        GOOGLE_BASE,
        apiKey,
        typeof reelPayload === "string"
          ? reelPayload
          : JSON.stringify(reelPayload),
        GOOGLE_BASE,
        apiKey,
        typeof showcasePayload === "string"
          ? showcasePayload
          : JSON.stringify(showcasePayload),
        GOOGLE_BASE,
        apiKey,
        JSON.stringify(talkingPayload),
      ],
    );

    // Do not force Google as default — Grok may already be the active image provider
    await c.query(
      `DELETE FROM ai_providers WHERE provider_key IN ('google_veo', 'google_gemini')`,
    );

    return { merged: true };
  } finally {
    c.release();
  }
}

module.exports = { mergeGoogleProviders };

if (require.main === module) {
  const { db } = require("../database/init");
  mergeGoogleProviders(db)
    .then(async (result) => {
      console.log("Merge result:", result);
      const c = await db.getConnection();
      const [final] = await c.query(
        `SELECT provider_key, name, is_active, is_default,
                txt2txt_enabled, txt2img_enabled, img2img_enabled,
                reel_enabled, showcase_enabled, talking_enabled
         FROM ai_providers ORDER BY id`,
      );
      c.release();
      console.log(JSON.stringify(final, null, 2));
      process.exit(0);
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
