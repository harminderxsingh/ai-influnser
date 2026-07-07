import React from "react";
import PageHeader from "../../common/PageHeader";
import { SlowMotionVideo } from "@mui/icons-material";
import AddNew from "./addNew/AddNew";
import { GlobalContext } from "../../context/GlobalContext";
import ListContent from "./listCon/ListContent";

const Content = ({ lang }) => {
  const [inf, setInf] = React.useState([]);
  const { hitAxios } = React.useContext(GlobalContext);
  const [content, setContent] = React.useState([]);

  async function getContent(params) {
    const res = await hitAxios({
      path: "/api/content/get_all",
      post: false,
      admin: false,
    });
    if (res.data.success) {
      setContent(res.data.data);
    }
  }

  async function hangleGetInf(params) {
    const res = await hitAxios({
      path: "/api/inf/get_models",
      post: false,
      admin: false,
    });
    if (res.data.success) {
      setInf(res.data.data);
    }
  }

  React.useEffect(() => {
    hangleGetInf();
    getContent();
  }, []);

  return (
    <div>
      <PageHeader
        icon={SlowMotionVideo}
        primaryAction={
          <AddNew
            getContent={getContent}
            lang={lang}
            inf={inf}
            hitAxios={hitAxios}
          />
        }
        title={lang.content || "Content"}
        subtitle={
          lang.generateInfluencervideos ||
          "Let your influencer work for you. Generate videos dance & more"
        }
      />

      <ListContent
        getContent={getContent}
        content={content}
        hitAxios={hitAxios}
        lang={lang}
      />
    </div>
  );
};

export default Content;
