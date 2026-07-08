import React from "react";
import { Box, CircularProgress, Container } from "@mui/material";
import { GlobalContext } from "../context/GlobalContext";
import NotFoundPage from "./NotFoundPage";

function parseEmbed(embedHtml = "") {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = embedHtml;
  const forge = wrapper.querySelector(".forgeContainer");
  const script = wrapper.querySelector("script[src]");

  return {
    attrs: forge
      ? Array.from(forge.attributes).reduce((acc, attr) => {
          acc[attr.name] = attr.value;
          return acc;
        }, {})
      : {},
    scriptSrc: script?.getAttribute("src") || "",
  };
}

function normalizePagePath(pathname) {
  const raw = String(pathname || "").replace(/^\/+|\/+$/g, "");
  if (!raw || raw === "launchpad") return "";
  if (raw.startsWith("launchpad/")) return raw.slice("launchpad/".length);
  return raw;
}

const LaunchpadPage = () => {
  const { hitAxios } = React.useContext(GlobalContext);
  const containerRef = React.useRef(null);
  const [loading, setLoading] = React.useState(true);
  const [settings, setSettings] = React.useState(null);
  const pagePath = normalizePagePath(window.location.pathname);

  React.useEffect(() => {
    (async () => {
      try {
        const res = await hitAxios({
          path: `/api/launchpad/public-settings?path=${encodeURIComponent(pagePath)}`,
          admin: false,
          post: false,
          showLoading: false,
          showSnackbar: false,
        });
        if (res?.data?.success) setSettings(res.data.data);
      } finally {
        setLoading(false);
      }
    })();
  }, [hitAxios, pagePath]);

  React.useEffect(() => {
    if (!settings?.active || !settings?.embed_html || !containerRef.current) {
      return undefined;
    }

    const { attrs, scriptSrc } = parseEmbed(settings.embed_html);
    containerRef.current.innerHTML = "";

    const forgeDiv = document.createElement("div");
    Object.entries(attrs).forEach(([key, value]) => {
      forgeDiv.setAttribute(key, value);
    });
    if (!forgeDiv.className) forgeDiv.className = "forgeContainer";
    containerRef.current.appendChild(forgeDiv);

    if (!scriptSrc) return undefined;

    const script = document.createElement("script");
    script.src = scriptSrc;
    script.async = true;
    document.body.appendChild(script);

    return () => {
      script.remove();
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, [settings]);

  if (loading) {
    return (
      <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center">
        <CircularProgress />
      </Box>
    );
  }

  if (!settings?.active || !settings?.embed_html) {
    return <NotFoundPage />;
  }

  return (
    <Box minHeight="100vh" bgcolor="background.default">
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 } }}>
        <Box ref={containerRef} />
      </Container>
    </Box>
  );
};

export default LaunchpadPage;
