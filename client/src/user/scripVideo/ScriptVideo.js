// ScriptVideo.js
import React from "react";
import PageHeader from "../../common/PageHeader";
import { EmergencyRecording } from "@mui/icons-material";
import AddNewProduct from "./components/AddNewProduct";
import { GlobalContext } from "../../context/GlobalContext";
import ProductContentList from "./components/ProductContentList";
import { Snackbar, Alert } from "@mui/material";

const ScriptVideo = ({ lang }) => {
  const [inf, setInf] = React.useState([]);
  const { hitAxios } = React.useContext(GlobalContext);
  const [contents, setContents] = React.useState([]);
  const prevStatusRef = React.useRef({});
  const [snackbar, setSnackbar] = React.useState({
    open: false,
    message: "",
    severity: "success",
  });

  const fetchContents = React.useCallback(async () => {
    const res = await hitAxios({
      path: "/api/content/get_all_product_content",
      post: false,
      admin: false,
      showLoading: false,
      showSnackbar: false,
    });

    if (res?.data?.success) {
      const nextList = res.data.data || [];

      const prev = prevStatusRef.current || {};
      nextList.forEach((item) => {
        const wasBusy =
          prev[item.id] === "processing" || prev[item.id] === "submitting";
        if (
          wasBusy &&
          (item.status === "active" || item.status === "completed") &&
          item.generated_video
        ) {
          setSnackbar({
            open: true,
            message: lang?.showcaseReady || "Your product showcase video is ready",
            severity: "success",
          });
        }
      });
      prevStatusRef.current = Object.fromEntries(
        nextList.map((item) => [item.id, item.status]),
      );

      setContents(nextList);
    }
  }, [hitAxios, lang?.showcaseReady]);

  const handleCreated = React.useCallback((item) => {
    if (!item?.id) return;
    prevStatusRef.current = {
      ...prevStatusRef.current,
      [item.id]: item.status || "processing",
    };
    setContents((prev) => {
      if (prev.some((row) => row.id === item.id)) return prev;
      return [item, ...prev];
    });
  }, []);

  const handleGetInf = React.useCallback(async () => {
    const res = await hitAxios({
      path: "/api/inf/get_models",
      post: false,
      admin: false,
      showLoading: false,
      showSnackbar: false,
    });
    if (res?.data?.success) {
      setInf(res.data.data);
    }
  }, [hitAxios]);

  React.useEffect(() => {
    handleGetInf();
    fetchContents();
  }, [fetchContents, handleGetInf]);

  React.useEffect(() => {
    const hasProcessingContent = contents.some(
      (item) => item.status === "processing" || item.status === "submitting",
    );

    if (!hasProcessingContent) return undefined;

    const intervalId = setInterval(fetchContents, 2500);
    return () => clearInterval(intervalId);
  }, [contents, fetchContents]);

  return (
    <div>
      <PageHeader
        icon={EmergencyRecording}
        primaryAction={
          <AddNewProduct
            fetchContents={fetchContents}
            onCreated={handleCreated}
            lang={lang}
            inf={inf}
            hitAxios={hitAxios}
          />
        }
        title={lang.productShowcase || "Product Showcase"}
        subtitle={
          lang.productShowcaseSub ||
          "Create videos with your products and influencers"
        }
      />

      <ProductContentList
        hitAxios={hitAxios}
        lang={lang}
        fetchContents={fetchContents}
        contents={contents}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default ScriptVideo;
