/**
 * Official AI model catalog (no third-party aggregators like Kie/Fal).
 * Each model maps to an app feature and ships ready HTTP job config.
 */

export const CATALOG_PROVIDERS = [
  { id: "google", name: "Google", color: "#F4B400" },
  { id: "openai", name: "OpenAI", color: "#10A37F" },
  { id: "alibaba", name: "Alibaba", color: "#FF6A00" },
  { id: "wan", name: "Wan", color: "#52C41A" },
  { id: "grok", name: "Grok", color: "#8B5CF6" },
  { id: "bytedance", name: "ByteDance", color: "#FE2C55" },
  { id: "kling", name: "Kling", color: "#3B82F6" },
  { id: "bfl", name: "Black Forest Labs", color: "#06B6D4" },
  { id: "runway", name: "Runway", color: "#6366F1" },
  { id: "luma", name: "Luma", color: "#F97316" },
  { id: "elevenlabs", name: "ElevenLabs", color: "#22D3EE" },
  { id: "d_id", name: "D-ID", color: "#0EA5E9" },
];

/** Tasks shown in the library (mapped to app feature keys where applicable) */
export const CATALOG_TASKS = [
  { id: "text_to_image", name: "Text to Image", feature: "txt2img" },
  { id: "image_to_image", name: "Image to Image", feature: "img2img" },
  { id: "image_to_video", name: "Image to Video", feature: "reel" },
  { id: "text_to_video", name: "Text to Video", feature: "showcase" },
  { id: "video_to_video", name: "Video to Video", feature: "reel" },
  { id: "first_last_frame", name: "First–Last Frame Video", feature: "showcase" },
  { id: "lip_sync", name: "Lip Sync / Talking", feature: "talking" },
  { id: "text_to_speech", name: "Text to Speech", feature: "talking" },
];

function featureBlock(feature, cfg) {
  const out = {};
  Object.entries(cfg).forEach(([k, v]) => {
    out[`${feature}_${k}`] = typeof v === "object" ? JSON.stringify(v, null, 2) : v;
  });
  out[`${feature}_enabled`] = true;
  return out;
}

const googleAuth = {
  auth_type: "custom_header",
  auth_header_key: "x-goog-api-key",
  auth_header_prefix: "",
  api_key: "",
  base_url: "https://generativelanguage.googleapis.com",
};

const bearer = (base_url) => ({
  auth_type: "bearer",
  auth_header_key: "Authorization",
  auth_header_prefix: "Bearer",
  api_key: "",
  base_url,
});

/** @type {Array<{id:string,name:string,provider:string,tasks:string[],feature:string,desc?:string,config:object}>} */
export const CATALOG_MODELS = [
  // ── Google ──────────────────────────────────────────────
  {
    id: "google-imagen-4-fast",
    name: "Imagen 4 Fast",
    provider: "google",
    tasks: ["text_to_image"],
    feature: "txt2img",
    desc: "Official Google text-to-image",
    config: featureBlock("txt2img", {
      ...googleAuth,
      create_endpoint: "/v1beta/models/imagen-4.0-fast-generate-001:predict",
      create_method: "POST",
      create_payload: {
        instances: [{ prompt: "{{prompt}}" }],
        parameters: { sampleCount: 1, aspectRatio: "9:16" },
      },
      job_id_path: "predictions[0].bytesBase64Encoded",
      status_endpoint: "",
      status_method: "GET",
      state_path: "",
      success_state: "",
      failed_state: "",
      result_path: "@b64data(predictions[0].bytesBase64Encoded)",
    }),
  },
  {
    id: "google-veo-3.1-fast-i2v",
    name: "Veo 3.1 Fast (Image→Video)",
    provider: "google",
    tasks: ["image_to_video"],
    feature: "reel",
    desc: "Official Google Veo — animate a still",
    config: featureBlock("reel", {
      ...googleAuth,
      create_endpoint:
        "/v1beta/models/veo-3.1-fast-generate-preview:predictLongRunning",
      create_method: "POST",
      create_payload: {
        instances: [
          {
            prompt:
              "The character is performing the action from the reference video, cinematic motion",
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
      },
      job_id_path: "name",
      status_endpoint: "/v1beta/{{taskId}}",
      status_method: "GET",
      state_path: "done",
      success_state: "true",
      failed_state: "error",
      result_path:
        "response.generateVideoResponse.generatedSamples[0].video.uri",
    }),
  },
  {
    id: "google-veo-3.1-fast-showcase",
    name: "Veo 3.1 Fast (First–Last Frame)",
    provider: "google",
    tasks: ["first_last_frame", "text_to_video"],
    feature: "showcase",
    desc: "Official Google Veo product showcase video",
    config: featureBlock("showcase", {
      ...googleAuth,
      create_endpoint:
        "/v1beta/models/veo-3.1-fast-generate-preview:predictLongRunning",
      create_method: "POST",
      create_payload: {
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
      },
      job_id_path: "name",
      status_endpoint: "/v1beta/{{taskId}}",
      status_method: "GET",
      state_path: "done",
      success_state: "true",
      failed_state: "error",
      result_path:
        "response.generateVideoResponse.generatedSamples[0].video.uri",
    }),
  },

  // ── OpenAI ──────────────────────────────────────────────
  {
    id: "openai-gpt-image-1",
    name: "GPT Image 1",
    provider: "openai",
    tasks: ["text_to_image"],
    feature: "txt2img",
    desc: "Official OpenAI image generation",
    config: featureBlock("txt2img", {
      ...bearer("https://api.openai.com"),
      create_endpoint: "/v1/images/generations",
      create_method: "POST",
      create_payload: {
        model: "gpt-image-1",
        prompt: "{{prompt}}",
        size: "1024x1536",
        n: 1,
      },
      job_id_path: "data[0].url",
      status_endpoint: "",
      status_method: "GET",
      state_path: "",
      success_state: "",
      failed_state: "",
      result_path: "data[0].url",
    }),
  },
  {
    id: "openai-gpt-image-1-edit",
    name: "GPT Image 1 Edit",
    provider: "openai",
    tasks: ["image_to_image", "image_editing"],
    feature: "img2img",
    desc: "Official OpenAI image edit",
    config: featureBlock("img2img", {
      ...bearer("https://api.openai.com"),
      create_endpoint: "/v1/images/edits",
      create_method: "POST",
      create_payload: {
        model: "gpt-image-1",
        prompt: "{{prompt}}",
        image: ["{{reference_url}}"],
        n: 1,
      },
      job_id_path: "data[0].url",
      status_endpoint: "",
      status_method: "GET",
      state_path: "",
      success_state: "",
      failed_state: "",
      result_path: "data[0].url",
    }),
  },
  {
    id: "openai-sora-2",
    name: "Sora 2",
    provider: "openai",
    tasks: ["text_to_video", "image_to_video"],
    feature: "showcase",
    desc: "Official OpenAI Sora video",
    config: featureBlock("showcase", {
      ...bearer("https://api.openai.com"),
      create_endpoint: "/v1/videos",
      create_method: "POST",
      create_payload: {
        model: "sora-2",
        prompt: "{{text}}",
        size: "720x1280",
        seconds: 8,
      },
      job_id_path: "id",
      status_endpoint: "/v1/videos/{{taskId}}",
      status_method: "GET",
      state_path: "status",
      success_state: "completed",
      failed_state: "failed",
      result_path: "url",
    }),
  },

  // ── Alibaba / Wan (DashScope) ───────────────────────────
  {
    id: "alibaba-wan-t2i",
    name: "Wan 2.2 T2I Flash",
    provider: "wan",
    tasks: ["text_to_image"],
    feature: "txt2img",
    desc: "Alibaba DashScope Wan text-to-image",
    config: featureBlock("txt2img", {
      ...bearer("https://dashscope-intl.aliyuncs.com"),
      create_endpoint: "/api/v1/services/aigc/text2image/image-synthesis",
      create_method: "POST",
      create_payload: {
        __headers: { "X-DashScope-Async": "enable" },
        model: "wan2.2-t2i-flash",
        input: { prompt: "{{prompt}}" },
        parameters: { size: "768*1344", n: 1 },
      },
      job_id_path: "output.task_id",
      status_endpoint: "/api/v1/tasks/{{taskId}}",
      status_method: "GET",
      state_path: "output.task_status",
      success_state: "SUCCEEDED",
      failed_state: "FAILED",
      result_path: "output.results[0].url",
    }),
  },
  {
    id: "alibaba-wan-i2i",
    name: "Wan Style Repaint",
    provider: "alibaba",
    tasks: ["image_to_image", "image_editing"],
    feature: "img2img",
    desc: "Alibaba DashScope image-to-image",
    config: featureBlock("img2img", {
      ...bearer("https://dashscope-intl.aliyuncs.com"),
      create_endpoint: "/api/v1/services/aigc/image2image/image-synthesis",
      create_method: "POST",
      create_payload: {
        __headers: { "X-DashScope-Async": "enable" },
        model: "wanx-style-repaint-v1",
        input: {
          prompt: "{{prompt}}",
          images: [{ image_url: "{{reference_url}}" }],
        },
        parameters: { n: 1 },
      },
      job_id_path: "output.task_id",
      status_endpoint: "/api/v1/tasks/{{taskId}}",
      status_method: "GET",
      state_path: "output.task_status",
      success_state: "SUCCEEDED",
      failed_state: "FAILED",
      result_path: "output.results[0].url",
    }),
  },
  {
    id: "alibaba-wan-i2v",
    name: "Wan 2.2 I2V Flash",
    provider: "wan",
    tasks: ["image_to_video"],
    feature: "reel",
    desc: "Alibaba Wan image-to-video",
    config: featureBlock("reel", {
      ...bearer("https://dashscope-intl.aliyuncs.com"),
      create_endpoint: "/api/v1/services/aigc/video-generation/video-synthesis",
      create_method: "POST",
      create_payload: {
        __headers: { "X-DashScope-Async": "enable" },
        model: "wan2.2-i2v-flash",
        input: {
          prompt: "Natural cinematic motion of the character",
          img_url: "{{character_image_url}}",
        },
        parameters: { resolution: "720P", prompt_extend: true },
      },
      job_id_path: "output.task_id",
      status_endpoint: "/api/v1/tasks/{{taskId}}",
      status_method: "GET",
      state_path: "output.task_status",
      success_state: "SUCCEEDED",
      failed_state: "FAILED",
      result_path: "output.video_url",
    }),
  },
  {
    id: "alibaba-wan-kf2v",
    name: "Wan 2.2 KF2V Flash",
    provider: "wan",
    tasks: ["first_last_frame", "text_to_video"],
    feature: "showcase",
    desc: "Alibaba Wan first + last frame video",
    config: featureBlock("showcase", {
      ...bearer("https://dashscope-intl.aliyuncs.com"),
      create_endpoint: "/api/v1/services/aigc/image2video/video-synthesis",
      create_method: "POST",
      create_payload: {
        __headers: { "X-DashScope-Async": "enable" },
        model: "wan2.2-kf2v-flash",
        input: {
          prompt: "{{text}}",
          first_frame_url: "{{image_url_1}}",
          last_frame_url: "{{image_url_2}}",
        },
        parameters: { resolution: "720P", prompt_extend: true },
      },
      job_id_path: "output.task_id",
      status_endpoint: "/api/v1/tasks/{{taskId}}",
      status_method: "GET",
      state_path: "output.task_status",
      success_state: "SUCCEEDED",
      failed_state: "FAILED",
      result_path: "output.video_url",
    }),
  },

  // ── xAI Grok ────────────────────────────────────────────
  {
    id: "grok-imagine-image",
    name: "Grok Imagine Image",
    provider: "grok",
    tasks: ["text_to_image"],
    feature: "txt2img",
    desc: "xAI Grok Imagine text-to-image",
    config: featureBlock("txt2img", {
      ...bearer("https://api.x.ai"),
      create_endpoint: "/v1/images/generations",
      create_method: "POST",
      create_payload: {
        model: "grok-imagine-image",
        prompt: "{{prompt}}",
        aspect_ratio: "9:16",
        n: 1,
      },
      job_id_path: "data[0].url",
      status_endpoint: "",
      status_method: "GET",
      state_path: "",
      success_state: "",
      failed_state: "",
      result_path: "data[0].url",
    }),
  },
  {
    id: "grok-imagine-edit",
    name: "Grok Imagine Edit",
    provider: "grok",
    tasks: ["image_to_image", "image_editing"],
    feature: "img2img",
    desc: "xAI Grok Imagine image edit",
    config: featureBlock("img2img", {
      ...bearer("https://api.x.ai"),
      create_endpoint: "/v1/images/edits",
      create_method: "POST",
      create_payload: {
        model: "grok-imagine-image",
        prompt: "{{prompt}}",
        image: { url: "{{reference_url}}", type: "image_url" },
        n: 1,
      },
      job_id_path: "data[0].url",
      status_endpoint: "",
      status_method: "GET",
      state_path: "",
      success_state: "",
      failed_state: "",
      result_path: "data[0].url",
    }),
  },
  {
    id: "grok-imagine-video",
    name: "Grok Imagine Video",
    provider: "grok",
    tasks: ["image_to_video", "text_to_video"],
    feature: "reel",
    desc: "xAI Grok Imagine video",
    config: featureBlock("reel", {
      ...bearer("https://api.x.ai"),
      create_endpoint: "/v1/videos/generations",
      create_method: "POST",
      create_payload: {
        model: "grok-imagine-video",
        prompt: "Natural cinematic motion of the character",
        image: { url: "{{character_image_url}}" },
        duration: 8,
        aspect_ratio: "9:16",
        resolution: "720p",
      },
      job_id_path: "request_id",
      status_endpoint: "/v1/videos/{{taskId}}",
      status_method: "GET",
      state_path: "status",
      success_state: "done",
      failed_state: "failed",
      result_path: "video.url",
    }),
  },
  {
    id: "grok-imagine-video-showcase",
    name: "Grok Imagine Video (Showcase)",
    provider: "grok",
    tasks: ["first_last_frame", "text_to_video"],
    feature: "showcase",
    desc: "xAI Grok product showcase from first frame",
    config: featureBlock("showcase", {
      ...bearer("https://api.x.ai"),
      create_endpoint: "/v1/videos/generations",
      create_method: "POST",
      create_payload: {
        model: "grok-imagine-video",
        prompt: "{{text}}",
        image: { url: "{{image_url_1}}" },
        duration: 8,
        aspect_ratio: "9:16",
        resolution: "720p",
      },
      job_id_path: "request_id",
      status_endpoint: "/v1/videos/{{taskId}}",
      status_method: "GET",
      state_path: "status",
      success_state: "done",
      failed_state: "failed",
      result_path: "video.url",
    }),
  },

  // ── Black Forest Labs (Flux) ────────────────────────────
  {
    id: "bfl-flux-pro",
    name: "FLUX.1 Pro",
    provider: "bfl",
    tasks: ["text_to_image"],
    feature: "txt2img",
    desc: "Official Black Forest Labs Flux",
    config: featureBlock("txt2img", {
      auth_type: "custom_header",
      auth_header_key: "x-key",
      auth_header_prefix: "",
      api_key: "",
      base_url: "https://api.bfl.ai",
      create_endpoint: "/v1/flux-pro-1.1",
      create_method: "POST",
      create_payload: {
        prompt: "{{prompt}}",
        width: 768,
        height: 1344,
        prompt_upsampling: false,
      },
      job_id_path: "id",
      status_endpoint: "/v1/get_result?id={{taskId}}",
      status_method: "GET",
      state_path: "status",
      success_state: "Ready",
      failed_state: "Error",
      result_path: "result.sample",
    }),
  },

  // ── Kling (official) ────────────────────────────────────
  {
    id: "kling-v2-i2v",
    name: "Kling V2 Image-to-Video",
    provider: "kling",
    tasks: ["image_to_video"],
    feature: "reel",
    desc: "Official Kling AI image-to-video",
    config: featureBlock("reel", {
      ...bearer("https://api.klingai.com"),
      create_endpoint: "/v1/videos/image2video",
      create_method: "POST",
      create_payload: {
        model_name: "kling-v2-1",
        image: "{{character_image_url}}",
        prompt: "Natural motion matching the reference performance",
        mode: "std",
        duration: "5",
        aspect_ratio: "9:16",
      },
      job_id_path: "data.task_id",
      status_endpoint: "/v1/videos/image2video/{{taskId}}",
      status_method: "GET",
      state_path: "data.task_status",
      success_state: "succeed",
      failed_state: "failed",
      result_path: "data.task_result.videos[0].url",
    }),
  },

  // ── Runway ──────────────────────────────────────────────
  {
    id: "runway-gen4-turbo",
    name: "Runway Gen-4 Turbo",
    provider: "runway",
    tasks: ["image_to_video"],
    feature: "reel",
    desc: "Official Runway image-to-video",
    config: featureBlock("reel", {
      ...bearer("https://api.dev.runwayml.com"),
      create_endpoint: "/v1/image_to_video",
      create_method: "POST",
      create_payload: {
        model: "gen4_turbo",
        promptImage: "{{character_image_url}}",
        promptText: "Natural cinematic character motion",
        ratio: "720:1280",
        duration: 5,
      },
      job_id_path: "id",
      status_endpoint: "/v1/tasks/{{taskId}}",
      status_method: "GET",
      state_path: "status",
      success_state: "SUCCEEDED",
      failed_state: "FAILED",
      result_path: "output[0]",
    }),
  },

  // ── Luma ────────────────────────────────────────────────
  {
    id: "luma-ray-2",
    name: "Luma Ray 2",
    provider: "luma",
    tasks: ["image_to_video", "text_to_video"],
    feature: "showcase",
    desc: "Official Luma Dream Machine",
    config: featureBlock("showcase", {
      ...bearer("https://api.lumalabs.ai"),
      create_endpoint: "/dream-machine/v1/generations",
      create_method: "POST",
      create_payload: {
        model: "ray-2",
        prompt: "{{text}}",
        aspect_ratio: "9:16",
        keyframes: {
          frame0: { type: "image", url: "{{image_url_1}}" },
          frame1: { type: "image", url: "{{image_url_2}}" },
        },
      },
      job_id_path: "id",
      status_endpoint: "/dream-machine/v1/generations/{{taskId}}",
      status_method: "GET",
      state_path: "state",
      success_state: "completed",
      failed_state: "failed",
      result_path: "assets.video",
    }),
  },

  // ── ByteDance Seedance (via Volcengine Ark-style) ───────
  {
    id: "bytedance-seedream",
    name: "Seedream 3.0",
    provider: "bytedance",
    tasks: ["text_to_image"],
    feature: "txt2img",
    desc: "ByteDance Seedream text-to-image (Volcengine)",
    config: featureBlock("txt2img", {
      ...bearer("https://ark.ap-southeast.bytepluses.com"),
      create_endpoint: "/api/v3/images/generations",
      create_method: "POST",
      create_payload: {
        model: "seedream-3-0-t2i-250415",
        prompt: "{{prompt}}",
        size: "768x1344",
        response_format: "url",
      },
      job_id_path: "data[0].url",
      status_endpoint: "",
      status_method: "GET",
      state_path: "",
      success_state: "",
      failed_state: "",
      result_path: "data[0].url",
    }),
  },

  // ── D-ID Talks (fast lip-sync) ───────────────────────────
  {
    id: "d-id-talks",
    name: "D-ID Talks (Lip Sync)",
    provider: "d_id",
    tasks: ["lip_sync", "text_to_speech"],
    feature: "talking",
    desc: "Photo + TTS lip-sync talking video in seconds (not full generative video)",
    config: {
      provider_key: "d_id",
      name: "D-ID Lip Sync",
      ...featureBlock("talking", {
        base_url: "https://api.d-id.com",
        auth_type: "basic",
        auth_header_key: "Authorization",
        auth_header_prefix: "",
        create_endpoint: "/talks",
        create_method: "POST",
        create_payload: {
          source_url: "{{imageUrl}}",
          script: {
            type: "text",
            input: "{{text}}",
            provider: { type: "microsoft", voice_id: "{{voice}}" },
          },
          config: { stitch: true },
        },
        job_id_path: "id",
        status_endpoint: "/talks/{{taskId}}",
        status_method: "GET",
        state_path: "status",
        success_state: "done",
        failed_state: "error,rejected",
        result_path: "result_url",
      }),
    },
  },

];

export function getProviderMeta(id) {
  return CATALOG_PROVIDERS.find((p) => p.id === id) || null;
}

export function getTaskMeta(id) {
  return CATALOG_TASKS.find((t) => t.id === id) || null;
}

export function filterCatalogModels({ provider, task, q } = {}) {
  const query = String(q || "")
    .trim()
    .toLowerCase();
  return CATALOG_MODELS.filter((m) => {
    if (provider && m.provider !== provider) return false;
    if (task && !m.tasks.includes(task)) return false;
    if (!query) return true;
    return (
      m.name.toLowerCase().includes(query) ||
      m.id.toLowerCase().includes(query) ||
      (m.desc || "").toLowerCase().includes(query) ||
      m.provider.toLowerCase().includes(query)
    );
  });
}

/** Merge a catalog model into a provider form (keeps existing API keys). */
export function applyCatalogModelToForm(form, model) {
  if (!model?.config) return form;
  const next = { ...form, ...model.config };

  // Preserve API keys already typed for this feature
  const f = model.feature;
  const existingKey = form[`${f}_api_key`];
  if (existingKey) next[`${f}_api_key`] = existingKey;

  // Suggest provider name/key if empty
  if (!form.name) {
    const meta = getProviderMeta(model.provider);
    next.name = meta?.name || model.provider;
  }
  if (!form.provider_key) {
    next.provider_key = String(model.provider || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_");
  }

  return next;
}
