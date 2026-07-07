import React from "react";
import PageHeader from "../../common/PageHeader";
import { PermMedia, VideoLibrary, Category } from "@mui/icons-material";
import { Box, Tabs, Tab, useTheme } from "@mui/material";
import AddVideo from "./components/AddVideo";
import AddCate from "./components/AddCate";
import { GlobalContext } from "../../context/GlobalContext";
import ListCate from "./components/ListCate";
import ListVideo from "./components/ListVideo";

const Templates = ({ lang }) => {
  const theme = useTheme();
  const { hitAxios } = React.useContext(GlobalContext);
  const [cate, setCate] = React.useState([]);
  const [tabValue, setTabValue] = React.useState(0);
  const [refreshVideos, setRefreshVideos] = React.useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  async function handleGetCate() {
    const res = await hitAxios({
      path: "/api/admin/get_t_care",
      post: false,
      admin: false,
    });
    if (res.data.success) {
      setCate(res.data.data);
    }
  }

  // Function to trigger video list refresh
  const handleGetVideos = () => {
    setRefreshVideos((prev) => prev + 1);
  };

  React.useEffect(() => {
    handleGetCate();
  }, []);

  return (
    <div>
      <PageHeader
        icon={PermMedia}
        title={lang.templates || "Templates"}
        subtitle={
          lang.templatesSb ||
          "Upload short videos. They will be visible to users."
        }
        gradientIcon={true}
        gradientBorder={true}
        primaryAction={
          tabValue === 0 ? (
            <AddVideo
              handleGetCate={handleGetCate}
              handleGetVideos={handleGetVideos}
              hitAxios={hitAxios}
              cate={cate}
              lang={lang}
            />
          ) : (
            <AddCate
              handleGetCate={handleGetCate}
              hitAxios={hitAxios}
              cate={cate}
              lang={lang}
            />
          )
        }
      />

      {/* Tabs */}
      <Box
        sx={{
          borderBottom: 1,
          borderColor: theme.palette.divider,
          mb: 3,
          bgcolor: theme.palette.background.paper,
          borderRadius: 2,
          p: 1,
        }}
      >
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{
            "& .MuiTab-root": {
              minHeight: 48,
              textTransform: "none",
              fontSize: "0.95rem",
              fontWeight: 500,
            },
          }}
        >
          <Tab
            icon={<VideoLibrary sx={{ fontSize: 20, mr: 1 }} />}
            iconPosition="start"
            label={lang.videos || "Videos"}
          />
          <Tab
            icon={<Category sx={{ fontSize: 20, mr: 1 }} />}
            iconPosition="start"
            label={lang.categories || "Categories"}
          />
        </Tabs>
      </Box>

      {/* Videos Tab */}
      {tabValue === 0 && (
        <ListVideo
          handleGetCate={handleGetCate}
          hitAxios={hitAxios}
          cate={cate}
          lang={lang}
          refreshVideos={refreshVideos}
        />
      )}

      {/* Categories Tab */}
      {tabValue === 1 && (
        <ListCate
          handleGetCate={handleGetCate}
          hitAxios={hitAxios}
          cate={cate}
          lang={lang}
        />
      )}
    </div>
  );
};

export default Templates;
