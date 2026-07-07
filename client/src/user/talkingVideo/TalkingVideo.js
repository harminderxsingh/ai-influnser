import React from "react";
import PageHeader from "../../common/PageHeader";
import { RecordVoiceOver } from "@mui/icons-material";
import AddNew from "./components/AddNew";
import TalkingVideoData from "./components/TalkingVideoData";
import { GlobalContext } from "../../context/GlobalContext";

const TalkingVideo = ({ lang }) => {
  const [videos, setVideos] = React.useState([]);
  const [inf, setInf] = React.useState([]);
  const { hitAxios } = React.useContext(GlobalContext);

  async function getInfluencers() {
    const res = await hitAxios({
      path: "/api/inf/get_models",
      post: false,
      admin: false,
    });
    if (res?.data?.success) setInf(res.data.data || []);
  }

  async function getVideos() {
    const res = await hitAxios({
      path: "/api/talking/get_all",
      post: false,
      admin: false,
    });
    if (res?.data?.success) setVideos(res.data.data || []);
  }

  React.useEffect(() => {
    getInfluencers();
    getVideos();
  }, []);

  return (
    <div>
      <PageHeader
        icon={RecordVoiceOver}
        primaryAction={<AddNew inf={inf} lang={lang} getVideos={getVideos} />}
        title={lang?.talkingVideo || "Talking Video"}
        subtitle={
          lang?.talkingVideoSub ||
          "Generate AI talking videos with any voice and language"
        }
      />

      <TalkingVideoData
        videos={videos}
        getVideos={getVideos}
        hitAxios={hitAxios}
        lang={lang}
      />
    </div>
  );
};

export default TalkingVideo;
