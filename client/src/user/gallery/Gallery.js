import React from "react";
import PageHeader from "../../common/PageHeader";
import { Collections } from "@mui/icons-material";
import AddNew from "./components/AddNew";
import { GlobalContext } from "../../context/GlobalContext";
import GalleryData from "./components/GalleryData";

const Gallery = ({ lang }) => {
  const [gal, setGal] = React.useState([]);
  const [inf, setInf] = React.useState([]);
  const { hitAxios } = React.useContext(GlobalContext);

  async function getMyInf(params) {
    const res = await hitAxios({
      path: "/api/inf/get_models",
      post: false,
      admin: false,
    });
    if (res.data.success) {
      setInf(res.data.data);
    }
  }

  async function getGallery(params) {
    const res = await hitAxios({
      path: "/api/gallery/get_all",
      post: false,
      admin: false,
    });
    if (res.data.success) {
      setGal(res.data.data);
    }
  }

  React.useEffect(() => {
    getGallery();
  }, []);

  React.useEffect(() => {
    getMyInf();
    getGallery();
  }, []);

  return (
    <div>
      <PageHeader
        icon={Collections}
        primaryAction={<AddNew getGallery={getGallery} inf={inf} lang={lang} />}
        title={lang.gallery || "Gallery"}
        subtitle={
          lang.galSub || "Generate stunning visuals with your influencers"
        }
      />

      <GalleryData
        getGallery={getGallery}
        hitAxios={hitAxios}
        lang={lang}
        gal={gal}
      />
    </div>
  );
};

export default Gallery;
