const fetch = require("node-fetch");
const { API_VERSION } = require("./insta");

// IMAGE post
async function publishImageToInstagram({ account, mediaUrl, caption }) {
  // Step 1: Create container
  const containerRes = await fetch(
    `https://graph.instagram.com/${API_VERSION}/${account.ig_graph_id}/media`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        image_url: mediaUrl,
        caption,
        access_token: account.access_token,
      }),
    },
  );
  const container = await containerRes.json();
  if (!container.id) return container; // return error

  // Step 2: Publish container
  const publishRes = await fetch(
    `https://graph.instagram.com/${API_VERSION}/${account.ig_graph_id}/media_publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        creation_id: container.id,
        access_token: account.access_token,
      }),
    },
  );
  return publishRes.json();
}

// VIDEO / REEL post
async function publishVideoToInstagram({ account, mediaUrl, caption }) {
  // Step 1: Create container
  const containerRes = await fetch(
    `https://graph.instagram.com/${API_VERSION}/${account.ig_graph_id}/media`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        media_type: "REELS",
        video_url: mediaUrl,
        caption,
        access_token: account.access_token,
      }),
    },
  );
  const container = await containerRes.json();
  if (!container.id) return container;

  // Step 2: Poll until ready (Instagram needs time to process video)
  let status = "IN_PROGRESS";
  let attempts = 0;
  while (status === "IN_PROGRESS" && attempts < 20) {
    await new Promise((r) => setTimeout(r, 5000)); // wait 5s
    const statusRes = await fetch(
      `https://graph.instagram.com/${API_VERSION}/${container.id}?fields=status_code&access_token=${account.access_token}`,
    );
    const statusData = await statusRes.json();
    status = statusData.status_code;
    attempts++;
  }

  if (status !== "FINISHED") {
    return {
      error: { message: `Video processing failed with status: ${status}` },
    };
  }

  // Step 3: Publish
  const publishRes = await fetch(
    `https://graph.instagram.com/${API_VERSION}/${account.ig_graph_id}/media_publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        creation_id: container.id,
        access_token: account.access_token,
      }),
    },
  );
  return publishRes.json();
}

async function publishToInstagram({ account, mediaUrl, mediaType, caption }) {
  if (mediaType === "VIDEO" || mediaType === "REEL") {
    return publishVideoToInstagram({ account, mediaUrl, caption });
  }
  return publishImageToInstagram({ account, mediaUrl, caption });
}

module.exports = { publishToInstagram };
