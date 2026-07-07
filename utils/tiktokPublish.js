const fetch = require("node-fetch");

async function publishToTiktok({ account, mediaUrl, mediaType, caption }) {
  // TikTok Content Posting API — Direct Post
  const body = {
    post_info: {
      title: caption?.substring(0, 150) || "",
      privacy_level: "PUBLIC_TO_EVERYONE",
      disable_duet: false,
      disable_comment: false,
      disable_stitch: false,
    },
    source_info: {
      source: "PULL_FROM_URL",
      video_url: mediaUrl,
    },
  };

  const res = await fetch(
    "https://open.tiktokapis.com/v2/post/publish/video/init/",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${account.access_token}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify(body),
    },
  );

  const data = await res.json();

  // data.data.publish_id on success
  if (data?.data?.publish_id) {
    return { publish_id: data.data.publish_id };
  }

  return {
    error: { message: data?.error?.message || "TikTok publish failed" },
  };
}

module.exports = { publishToTiktok };
