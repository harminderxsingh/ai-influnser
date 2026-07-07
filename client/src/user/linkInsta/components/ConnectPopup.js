import React, { useEffect, useRef } from "react";

const ConnectPopup = ({ url, onConnected }) => {
  const popupRef = useRef(null);

  useEffect(() => {
    if (!url) return;

    const left = window.screenX + (window.outerWidth - 500) / 2;
    const top = window.screenY + (window.outerHeight - 700) / 2;

    popupRef.current = window.open(
      url,
      "InstaLogin",
      `width=500,height=700,left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes`,
    );

    // Listen for postMessage from callback page
    const handleMsg = (e) => {
      if (e.data?.type === "INSTA_CONNECTED") {
        onConnected();
      }
    };
    window.addEventListener("message", handleMsg);

    // Fallback: poll for popup close
    const iv = setInterval(() => {
      if (popupRef.current?.closed) {
        clearInterval(iv);
        onConnected();
      }
    }, 1000);

    return () => {
      window.removeEventListener("message", handleMsg);
      clearInterval(iv);
    };
  }, [url]);

  return null; // no UI, just opens popup
};

export default ConnectPopup;
