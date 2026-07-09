// ScriptVideo.js
import React from "react";
import PageHeader from "../../common/PageHeader";
import { EmergencyRecording } from "@mui/icons-material";
import AddNewProduct from "./components/AddNewProduct";
import { GlobalContext } from "../../context/GlobalContext";
import ProductContentList from "./components/ProductContentList";

const ScriptVideo = ({ lang }) => {
  const [inf, setInf] = React.useState([]);
  const { hitAxios } = React.useContext(GlobalContext);
  const [contents, setContents] = React.useState([]);

  const fetchContents = React.useCallback(async () => {
    const res = await hitAxios({
      path: "/api/content/get_all_product_content",
      post: false,
      admin: false,
      showLoading: false,
    });

    if (res.data.success) {
      setContents(res.data.data);
    }
  }, [hitAxios]);

  const handleGetInf = React.useCallback(async () => {
    const res = await hitAxios({
      path: "/api/inf/get_models",
      post: false,
      admin: false,
      showLoading: false,
    });
    if (res.data.success) {
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

    const intervalId = setInterval(fetchContents, 10000);
    return () => clearInterval(intervalId);
  }, [contents, fetchContents]);

  return (
    <div>
      <PageHeader
        icon={EmergencyRecording}
        primaryAction={
          <AddNewProduct
            fetchContents={fetchContents}
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
    </div>
  );
};

export default ScriptVideo;
