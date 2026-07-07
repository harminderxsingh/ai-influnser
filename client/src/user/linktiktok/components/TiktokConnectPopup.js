import React, { useEffect, useRef } from "react";

const TiktokConnectPopup = ({ url, onConnected }) => {
  const popupRef = useRef(null);

  useEffect(() => {
    if (!url) return;

    const left = window.screenX + (window.outerWidth - 500) / 2;
    const top = window.screenY + (window.outerHeight - 700) / 2;

    popupRef.current = window.open(
      url,
      "TiktokLogin",
      `width=500,height=700,left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes`,
    );

    const handleMsg = (e) => {
      if (e.data?.type === "TIKTOK_CONNECTED") {
        onConnected();
      }
    };
    window.addEventListener("message", handleMsg);

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

  return null;
};

export default TiktokConnectPopup;
