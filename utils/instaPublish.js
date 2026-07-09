const fetch = require("./fetch");
const { API_VERSION } = require("./insta");

async function waitForContainerReady({ containerId, accessToken, attempts = 30 }) {
  let lastStatus = "UNKNOWN";
  let lastResponse = null;

  for (let attempt = 0; attempt < attempts; attempt++) {
    if (attempt > 0) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    const statusRes = await fetch(
      `https://graph.instagram.com/${API_VERSION}/${containerId}?fields=status_code&access_token=${accessToken}`,
    );
    const statusData = await statusRes.json();
    lastResponse = statusData;
    lastStatus = statusData.status_code || lastStatus;

    if (statusData.error) {
      return {
        ready: false,
        error: statusData.error,
        status: lastStatus,
        response: statusData,
      };
    }

    if (lastStatus === "FINISHED") {
      return { ready: true, status: lastStatus, response: statusData };
    }

    if (lastStatus === "ERROR" || lastStatus === "EXPIRED") {
      return {
        ready: false,
        error: {
          message: `Instagram media container failed with status: ${lastStatus}`,
        },
        status: lastStatus,
        response: statusData,
      };
    }
  }

  return {
    ready: false,
    error: {
      message: `Instagram media container was not ready after ${attempts} attempts. Last status: ${lastStatus}`,
    },
    status: lastStatus,
    response: lastResponse,
  };
}

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

  // Step 2: Wait until Instagram has processed the container.
  const containerStatus = await waitForContainerReady({
    containerId: container.id,
    accessToken: account.access_token,
  });

  if (!containerStatus.ready) {
    return {
      error: containerStatus.error,
      container,
      container_status: containerStatus.status,
      container_status_response: containerStatus.response,
    };
  }

  // Step 3: Publish container
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
  const containerStatus = await waitForContainerReady({
    containerId: container.id,
    accessToken: account.access_token,
    attempts: 40,
  });

  if (!containerStatus.ready) {
    return {
      error: containerStatus.error,
      container,
      container_status: containerStatus.status,
      container_status_response: containerStatus.response,
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
