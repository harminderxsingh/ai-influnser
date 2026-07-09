import React from "react";
import PageHeader from "../../common/PageHeader";
import {
  PriceCheck,
  PersonAddAltOutlined,
  RecordVoiceOverOutlined,
  VideoLibraryOutlined,
  ShoppingBagOutlined,
  SaveOutlined,
  TokenOutlined,
  VideoCameraFrontOutlined,
  TipsAndUpdatesOutlined,
} from "@mui/icons-material";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  TextField,
  Button,
  Avatar,
  alpha,
  useTheme,
  Divider,
  InputAdornment,
} from "@mui/material";
import { GlobalContext } from "../../context/GlobalContext";

const TASK_TYPES = (lang) => [
  {
    key: "inf_maker",
    icon: PersonAddAltOutlined,
    color: "#8B5CF6",
    title: lang?.tpCreateInfluencer || "Create Influencer",
    desc:
      lang?.tpCreateInfluencerDesc ||
      "Credits required to generate a new AI influencer",
  },
  {
    key: "inf_var_maker",
    icon: RecordVoiceOverOutlined,
    color: "#3B82F6",
    title: lang?.tpCreateVariable || "Create Influencer Variable",
    desc:
      lang?.tpCreateVariableDesc ||
      "Credits required to create a variable of an existing influencer",
  },
  {
    key: "content_video_maker",
    icon: VideoLibraryOutlined,
    color: "#059669",
    title: lang?.tpContentVideo || "Content Video Maker",
    desc:
      lang?.tpContentVideoDesc ||
      "Credits required to generate video from an existing template",
  },
  {
    key: "product_showcase_maker",
    icon: ShoppingBagOutlined,
    color: "#F59E0B",
    title: lang?.tpProductShowcase || "Product Showcase Video",
    desc:
      lang?.tpProductShowcaseDesc ||
      "Credits required to create a product showcase video",
  },
  {
    key: "talking_video_maker",
    icon: VideoCameraFrontOutlined,
    color: "#267983",
    title: lang?.newTalkingVideo || "New Talking Video",
    desc:
      lang?.talkingVideoSub ||
      "Pick the influencer whose face will appear in the talking video.",
  },
  {
    key: "prompt_recommend_maker",
    icon: TipsAndUpdatesOutlined,
    color: "#EC4899",
    title: lang?.promptRecommendation || "Prompt Recommendations",
    desc:
      lang?.promptRecommendationDesc ||
      "Credits required to generate recommended prompt ideas",
  },
];

// ── Task Row ──────────────────────────────────────────────
const TaskRow = ({ item, value, onChange, theme }) => (
  <Stack
    direction={{ xs: "column", sm: "row" }}
    alignItems={{ xs: "flex-start", sm: "center" }}
    spacing={2}
    px={2.5}
    py={2.5}
  >
    <Avatar
      sx={{
        width: 46,
        height: 46,
        bgcolor: alpha(item.color, 0.12),
        color: item.color,
        flexShrink: 0,
      }}
    >
      <item.icon sx={{ fontSize: 22 }} />
    </Avatar>

    <Box flex={1} minWidth={0}>
      <Typography variant="body2" fontWeight={700} color="text.primary">
        {item.title}
      </Typography>
      <Typography
        variant="caption"
        color="text.disabled"
        display="block"
        mt={0.3}
      >
        {item.desc}
      </Typography>
    </Box>

    <TextField
      type="number"
      value={value}
      onChange={(e) => onChange(item.key, e.target.value)}
      size="small"
      inputProps={{ min: 1, step: 1 }}
      sx={{
        width: 150,
        flexShrink: 0,
        "& .MuiOutlinedInput-root": {
          borderRadius: 2,
          fontWeight: 700,
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: item.color,
          },
        },
        "& .MuiOutlinedInput-notchedOutline": {
          borderColor: alpha(item.color, 0.3),
        },
        "&:hover .MuiOutlinedInput-notchedOutline": {
          borderColor: alpha(item.color, 0.6),
        },
      }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <TokenOutlined sx={{ fontSize: 16, color: item.color }} />
          </InputAdornment>
        ),
      }}
    />
  </Stack>
);

// ── Main Component ────────────────────────────────────────
const TaskPricing = ({ lang }) => {
  const { hitAxios } = React.useContext(GlobalContext);
  const theme = useTheme();

  const [credits, setCredits] = React.useState({
    inf_maker: "",
    inf_var_maker: "",
    content_video_maker: "",
    product_showcase_maker: "",
    talking_video_maker: "",
    prompt_recommend_maker: "",
  });

  // ── Fetch existing values on mount
  const getWebPvt = React.useCallback(async () => {
    const res = await hitAxios({
      path: "/api/web/get_web_pvt",
      post: false,
      admin: true,
    });
    if (res?.data?.success) {
      const d = res.data.data;
      setCredits({
        inf_maker: Number(d.inf_maker),
        inf_var_maker: Number(d.inf_var_maker),
        content_video_maker: Number(d.content_video_maker),
        product_showcase_maker: Number(d.product_showcase_maker),
        talking_video_maker: Number(d.talking_video_maker),
        prompt_recommend_maker: Number(d.prompt_recommend_maker || 5),
      });
    }
  }, [hitAxios]);

  // ── Save updated credits
  async function handleSaveData() {
    await hitAxios({
      path: "/api/web/update_credit_set",
      post: true,
      admin: true,
      obj: {
        inf_maker: credits.inf_maker,
        inf_var_maker: credits.inf_var_maker,
        content_video_maker: credits.content_video_maker,
        product_showcase_maker: credits.product_showcase_maker,
        talking_video_maker: credits.talking_video_maker,
        prompt_recommend_maker: credits.prompt_recommend_maker,
      },
    });
  }

  const handleChange = (key, value) => {
    setCredits((prev) => ({
      ...prev,
      [key]: value === "" ? "" : Number(value),
    }));
  };

  React.useEffect(() => {
    getWebPvt();
  }, [getWebPvt]);

  const tasks = TASK_TYPES(lang);

  return (
    <Box>
      <PageHeader
        icon={PriceCheck}
        title={lang?.taskPricing || "Task Pricing"}
        subtitle={lang?.tpSub || "Manage credit requirement for each task"}
        primaryAction={
          <Button
            size="large"
            variant="contained"
            startIcon={<SaveOutlined />}
            onClick={handleSaveData}
          >
            {lang?.saveChanges || "Save Changes"}
          </Button>
        }
      />

      <Card
        sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}
      >
        <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
          {/* Task Rows */}
          {tasks.map((item, i) => (
            <React.Fragment key={item.key}>
              <TaskRow
                item={item}
                value={credits[item.key]}
                onChange={handleChange}
                theme={theme}
              />
              {i < tasks.length - 1 && (
                <Divider sx={{ mx: 2.5, opacity: 0.5 }} />
              )}
            </React.Fragment>
          ))}
        </CardContent>
      </Card>
    </Box>
  );
};

export default TaskPricing;
