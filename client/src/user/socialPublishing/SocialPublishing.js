import React, { useState, useEffect, useContext } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Stack,
  Chip,
  Avatar,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tab,
  Tabs,
  Grid,
  CircularProgress,
  Divider,
  alpha,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stepper,
  Step,
  StepLabel,
  Alert,
  InputAdornment,
  Autocomplete,
} from "@mui/material";
import {
  Campaign,
  Instagram,
  Schedule,
  Send,
  Image,
  VideoLibrary,
  Check,
  CalendarMonth,
  AccessTime,
  Public,
  Refresh,
  AddOutlined,
} from "@mui/icons-material";
import PageHeader from "../../common/PageHeader";
import CommonDialog from "../../common/CommonDialog";
import { GlobalContext } from "../../context/GlobalContext";
import TikTokIcon from "../../common/TikTokIcon";
import moment from "moment-timezone";

const TIMEZONES = moment.tz.names();

function resolveMedia(item, sourceType, backendUrl) {
  const base = `${backendUrl}/media/`;
  switch (sourceType) {
    case "influencer":
      return {
        url: item.photo_url ? `${base}${item.photo_url}` : null,
        type: "IMAGE",
        label: item.name,
      };
    case "gallery":
      return {
        url: item.generated_photo ? `${base}${item.generated_photo}` : null,
        type: "IMAGE",
        label: item.prompt?.substring(0, 40) + "...",
      };
    case "content":
      return {
        url: item.generated_video ? `${base}${item.generated_video}` : null,
        type: "VIDEO",
        label: item.prompt?.substring(0, 40) + "...",
      };
    case "product":
      return {
        url: item.generated_video ? `${base}${item.generated_video}` : null,
        type: "VIDEO",
        label: item.prompt?.substring(0, 40) + "...",
      };
    default:
      return { url: null, type: "IMAGE", label: "" };
  }
}

const SocialPublishing = ({ lang }) => {
  const theme = useTheme();
  const { hitAxios } = useContext(GlobalContext);
  const backendUrl = process.env.REACT_APP_BACKEND_URL || "";

  const STEPS = [
    lang?.stepSelectMedia || "Select Media",
    lang?.stepConfigurePost || "Configure Post",
    lang?.stepReviewPublish || "Review & Publish",
  ];

  const [activeStep, setActiveStep] = useState(0);
  const [mediaTab, setMediaTab] = useState("influencer");
  const [medias, setMedias] = useState({
    influencersPhotos: [],
    gallaryPhotos: [],
    contentVideos: [],
    productVideos: [],
  });
  const [accounts, setAccounts] = useState([]);
  const [myPosts, setMyPosts] = useState([]);
  const [loadingMedias, setLoadingMedias] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [selectedMedia, setSelectedMedia] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [caption, setCaption] = useState("");
  const [hashtagInput, setHashtagInput] = useState("");
  const [hashtagList, setHashtagList] = useState([]); // array of strings
  const [postMode, setPostMode] = useState("now");
  const [scheduledAt, setScheduledAt] = useState(
    moment().add(1, "hour").format("YYYY-MM-DDTHH:mm"),
  );
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  );

  // result dialog state
  const [resultDialog, setResultDialog] = useState({
    open: false,
    success: false,
    msg: "",
  });

  // ── Fetch ─────────────────────────────────────────────
  async function fetchMedias() {
    setLoadingMedias(true);
    const res = await hitAxios({
      path: "/api/social-publishing/get_medias",
      post: false,
      admin: false,
    });
    if (res?.data?.success) setMedias(res.data.data);
    setLoadingMedias(false);
  }

  async function fetchAccounts() {
    setLoadingAccounts(true);
    const res = await hitAxios({
      path: "/api/social-publishing/accounts",
      post: false,
      admin: false,
    });
    if (res?.data?.success) setAccounts(res.data.accounts);
    setLoadingAccounts(false);
  }

  async function fetchMyPosts() {
    const res = await hitAxios({
      path: "/api/social-publishing/my_posts",
      post: false,
      admin: false,
    });
    if (res?.data?.success) setMyPosts(res.data.posts);
  }

  useEffect(() => {
    fetchMedias();
    fetchAccounts();
    fetchMyPosts();
  }, []);

  const tabSourceMap = {
    influencer: medias.influencersPhotos,
    gallery: medias.gallaryPhotos,
    content: medias.contentVideos,
    product: medias.productVideos,
  };

  // ── Hashtag input handler ─────────────────────────────
  function handleHashtagKeyDown(e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      addHashtag(hashtagInput);
    }
  }

  function addHashtag(raw) {
    const cleaned = raw.trim().replace(/^#+/, ""); // strip leading #
    if (!cleaned) return;
    const tag = `#${cleaned}`;
    if (!hashtagList.includes(tag)) {
      setHashtagList((prev) => [...prev, tag]);
    }
    setHashtagInput("");
  }

  function removeHashtag(tag) {
    setHashtagList((prev) => prev.filter((t) => t !== tag));
  }

  // ── Media select ──────────────────────────────────────
  function handleSelectMedia(item, sourceType) {
    const resolved = resolveMedia(item, sourceType, backendUrl);
    if (!resolved.url) return;
    setSelectedMedia({ item, sourceType, resolved });
    setActiveStep(1);
  }

  // ── Submit ────────────────────────────────────────────
  async function handleSubmit() {
    if (!selectedMedia || !selectedAccount) return;
    setSubmitting(true);

    const hashtags = hashtagList.join(" ");

    const res = await hitAxios({
      path: "/api/social-publishing/create_post",
      post: true,
      admin: false,
      obj: {
        platform: selectedAccount.platform,
        account_id: selectedAccount.id,
        source_type: selectedMedia.sourceType,
        source_id: selectedMedia.item.id,
        media_url: selectedMedia.resolved.url,
        media_type: selectedMedia.resolved.type,
        caption,
        hashtags,
        post_now: postMode === "now",
        scheduled_at: postMode === "schedule" ? scheduledAt : null,
        timezone,
      },
    });

    setSubmitting(false);
    setResultDialog({
      open: true,
      success: res?.data?.success,
      msg: res?.data?.msg || "Something went wrong",
    });

    if (res?.data?.success) {
      fetchMyPosts();
      setActiveStep(0);
      setSelectedMedia(null);
      setSelectedAccount(null);
      setCaption("");
      setHashtagList([]);
      setHashtagInput("");
      setPostMode("now");
    }
  }

  async function handleDeletePost(id) {
    await hitAxios({
      path: `/api/social-publishing/delete_post/${id}`,
      post: false,
      admin: false,
      method: "DELETE",
    });
    fetchMyPosts();
  }

  return (
    <Box>
      <PageHeader
        title={lang?.socialPublishing || "Social Publishing"}
        subtitle={
          lang?.socialPublishingSubtitle ||
          "Publish your AI content to Instagram & TikTok"
        }
        icon={Campaign}
        primaryAction={
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => {
              fetchMedias();
              fetchAccounts();
              fetchMyPosts();
            }}
            sx={{ textTransform: "none", borderRadius: 2 }}
          >
            {lang?.refresh || "Refresh"}
          </Button>
        }
      />

      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {/* ── Stepper ── */}
        <Card
          elevation={0}
          sx={{ border: "1px solid", borderColor: "divider" }}
        >
          <CardContent sx={{ py: 2 }}>
            <Stepper activeStep={activeStep} alternativeLabel>
              {STEPS.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </CardContent>
        </Card>

        {/* ══ STEP 0 — Select Media ══ */}
        {activeStep === 0 && (
          <Card
            elevation={0}
            sx={{ border: "1px solid", borderColor: "divider" }}
          >
            <Box
              sx={{
                px: 3,
                py: 2,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}18, ${theme.palette.primary.main}08)`,
                borderBottom: "1px solid",
                borderColor: "divider",
              }}
            >
              <Typography variant="subtitle1" fontWeight={700}>
                {lang?.selectMedia || "Select Media to Publish"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {lang?.selectMediaHint ||
                  "Only successfully generated media is shown"}
              </Typography>
            </Box>
            <CardContent>
              <Tabs
                value={mediaTab}
                onChange={(_, v) => setMediaTab(v)}
                sx={{
                  mb: 2,
                  borderBottom: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Tab
                  value="influencer"
                  label={`${lang?.influencers || "Influencers"} (${medias.influencersPhotos.length})`}
                  icon={<Image fontSize="small" />}
                  iconPosition="start"
                />
                <Tab
                  value="gallery"
                  label={`${lang?.gallery || "Gallery"} (${medias.gallaryPhotos.filter((i) => i.generated_photo).length})`}
                  icon={<Image fontSize="small" />}
                  iconPosition="start"
                />
                <Tab
                  value="content"
                  label={`${lang?.contentVideos || "Content Videos"} (${medias.contentVideos.filter((i) => i.generated_video).length})`}
                  icon={<VideoLibrary fontSize="small" />}
                  iconPosition="start"
                />
                <Tab
                  value="product"
                  label={`${lang?.productVideos || "Product Videos"} (${medias.productVideos.filter((i) => i.generated_video).length})`}
                  icon={<VideoLibrary fontSize="small" />}
                  iconPosition="start"
                />
              </Tabs>

              {loadingMedias ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {tabSourceMap[mediaTab]?.map((item) => {
                    const resolved = resolveMedia(item, mediaTab, backendUrl);
                    if (!resolved.url) return null;
                    const isSelected =
                      selectedMedia?.item?.id === item.id &&
                      selectedMedia?.sourceType === mediaTab;
                    return (
                      <Grid item xs={6} sm={4} md={3} key={item.id}>
                        <Card
                          elevation={0}
                          onClick={() => handleSelectMedia(item, mediaTab)}
                          sx={{
                            cursor: "pointer",
                            border: "2px solid",
                            borderColor: isSelected
                              ? "primary.main"
                              : "divider",
                            borderRadius: 2,
                            overflow: "hidden",
                            transition: "all 0.2s",
                            "&:hover": {
                              borderColor: "primary.main",
                              transform: "translateY(-2px)",
                              boxShadow: `0 4px 20px ${theme.palette.primary.main}30`,
                            },
                          }}
                        >
                          <Box
                            sx={{
                              position: "relative",
                              aspectRatio: "9/16",
                              bgcolor: "grey.100",
                            }}
                          >
                            {resolved.type === "VIDEO" ? (
                              <Box
                                component="video"
                                src={resolved.url}
                                sx={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                                muted
                                preload="metadata"
                              />
                            ) : (
                              <Box
                                component="img"
                                src={resolved.url}
                                alt={resolved.label}
                                sx={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                              />
                            )}
                            <Chip
                              label={resolved.type}
                              size="small"
                              color={
                                resolved.type === "VIDEO"
                                  ? "secondary"
                                  : "primary"
                              }
                              sx={{
                                position: "absolute",
                                top: 6,
                                left: 6,
                                fontSize: 10,
                              }}
                            />
                            {isSelected && (
                              <Box
                                sx={{
                                  position: "absolute",
                                  inset: 0,
                                  bgcolor: alpha(
                                    theme.palette.primary.main,
                                    0.3,
                                  ),
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <Check sx={{ color: "#fff", fontSize: 40 }} />
                              </Box>
                            )}
                          </Box>
                          <Box sx={{ p: 1 }}>
                            <Typography
                              variant="caption"
                              noWrap
                              display="block"
                              fontWeight={600}
                            >
                              {mediaTab === "influencer"
                                ? item.name
                                : `#${item.id}`}
                            </Typography>
                          </Box>
                        </Card>
                      </Grid>
                    );
                  })}
                  {tabSourceMap[mediaTab]?.filter((i) =>
                    mediaTab === "influencer"
                      ? i.photo_url
                      : mediaTab === "gallery"
                        ? i.generated_photo
                        : i.generated_video,
                  ).length === 0 && (
                    <Grid item xs={12}>
                      <Box sx={{ py: 6, textAlign: "center" }}>
                        <Typography color="text.secondary">
                          {lang?.noMediaFound ||
                            "No generated media found in this category"}
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              )}
            </CardContent>
          </Card>
        )}

        {/* ══ STEP 1 — Configure Post ══ */}
        {activeStep === 1 && selectedMedia && (
          <Grid container spacing={2}>
            {/* Preview */}
            <Grid item xs={12} md={4}>
              <Card
                elevation={0}
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  position: "sticky",
                  top: 80,
                }}
              >
                <Box
                  sx={{
                    px: 2,
                    py: 1.5,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Typography variant="subtitle2" fontWeight={700}>
                    {lang?.preview || "Selected Media"}
                  </Typography>
                </Box>
                <Box sx={{ aspectRatio: "9/16", bgcolor: "grey.100" }}>
                  {selectedMedia.resolved.type === "VIDEO" ? (
                    <Box
                      component="video"
                      src={selectedMedia.resolved.url}
                      controls
                      sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <Box
                      component="img"
                      src={selectedMedia.resolved.url}
                      sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  )}
                </Box>
                <Box sx={{ p: 1.5 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    onClick={() => setActiveStep(0)}
                    sx={{ textTransform: "none", borderRadius: 2 }}
                  >
                    {lang?.changeMedia || "Change Media"}
                  </Button>
                </Box>
              </Card>
            </Grid>

            {/* Config */}
            <Grid item xs={12} md={8}>
              <Card
                elevation={0}
                sx={{ border: "1px solid", borderColor: "divider" }}
              >
                <Box
                  sx={{
                    px: 3,
                    py: 2,
                    background: `linear-gradient(135deg, ${theme.palette.secondary.main}18, ${theme.palette.secondary.main}08)`,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={700}>
                    {lang?.configurePost || "Configure Your Post"}
                  </Typography>
                </Box>
                <CardContent
                  sx={{ display: "flex", flexDirection: "column", gap: 3 }}
                >
                  {/* Account selector */}
                  <Box>
                    <Typography
                      variant="caption"
                      fontWeight={600}
                      color="text.secondary"
                      sx={{ mb: 1, display: "block" }}
                    >
                      {lang?.selectAccount || "Select Account"}
                    </Typography>
                    {loadingAccounts ? (
                      <CircularProgress size={24} />
                    ) : accounts.length === 0 ? (
                      <Alert severity="warning">
                        {lang?.noAccountsConnected ||
                          "No accounts connected. Please connect Instagram or TikTok first."}
                      </Alert>
                    ) : (
                      <Stack direction="row" flexWrap="wrap" gap={1}>
                        {accounts.map((acc) => (
                          <Chip
                            key={`${acc.platform}-${acc.id}`}
                            avatar={
                              <Avatar
                                src={acc.profile_pic}
                                sx={{ width: 24, height: 24 }}
                              >
                                {acc.platform === "instagram" ? (
                                  <Instagram sx={{ fontSize: 14 }} />
                                ) : (
                                  <TikTokIcon sx={{ fontSize: 14 }} />
                                )}
                              </Avatar>
                            }
                            label={`@${acc.username || acc.name}`}
                            icon={
                              acc.platform === "instagram" ? (
                                <Instagram
                                  sx={{
                                    fontSize: 16,
                                    color: "#E1306C !important",
                                  }}
                                />
                              ) : (
                                <TikTokIcon sx={{ fontSize: 16 }} />
                              )
                            }
                            onClick={() => setSelectedAccount(acc)}
                            variant={
                              selectedAccount?.id === acc.id &&
                              selectedAccount?.platform === acc.platform
                                ? "filled"
                                : "outlined"
                            }
                            color={
                              selectedAccount?.id === acc.id &&
                              selectedAccount?.platform === acc.platform
                                ? "primary"
                                : "default"
                            }
                            sx={{ cursor: "pointer", fontWeight: 600 }}
                          />
                        ))}
                      </Stack>
                    )}
                  </Box>

                  <Divider />

                  {/* Caption */}
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label={lang?.caption || "Caption"}
                    placeholder={
                      lang?.captionPlaceholder || "Write your caption here..."
                    }
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    inputProps={{ maxLength: 2200 }}
                    helperText={`${caption.length}/2200`}
                  />

                  {/* Hashtags — chip input */}
                  <Box>
                    <Typography
                      variant="caption"
                      fontWeight={600}
                      color="text.secondary"
                      sx={{ mb: 1, display: "block" }}
                    >
                      {lang?.hashtags || "Hashtags"}
                    </Typography>

                    {/* Chip display */}
                    {hashtagList.length > 0 && (
                      <Stack
                        direction="row"
                        flexWrap="wrap"
                        gap={0.8}
                        sx={{ mb: 1.5 }}
                      >
                        {hashtagList.map((tag) => (
                          <Chip
                            key={tag}
                            label={tag}
                            size="small"
                            color="primary"
                            variant="outlined"
                            onDelete={() => removeHashtag(tag)}
                            sx={{ fontWeight: 600, fontSize: 12 }}
                          />
                        ))}
                      </Stack>
                    )}

                    {/* Input */}
                    <TextField
                      fullWidth
                      size="small"
                      placeholder={
                        lang?.hashtagPlaceholder ||
                        "Type a hashtag and press Enter..."
                      }
                      value={hashtagInput}
                      onChange={(e) => setHashtagInput(e.target.value)}
                      onKeyDown={handleHashtagKeyDown}
                      onBlur={() => addHashtag(hashtagInput)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Typography color="primary" fontWeight={700}>
                              #
                            </Typography>
                          </InputAdornment>
                        ),
                      }}
                      helperText={
                        lang?.hashtagsHelper ||
                        "Press Enter or Space after each hashtag"
                      }
                    />
                  </Box>

                  <Divider />

                  {/* Post mode */}
                  <Box>
                    <Typography
                      variant="caption"
                      fontWeight={600}
                      color="text.secondary"
                      sx={{ mb: 1, display: "block" }}
                    >
                      {lang?.postMode || "When to Post"}
                    </Typography>
                    <ToggleButtonGroup
                      value={postMode}
                      exclusive
                      onChange={(_, v) => v && setPostMode(v)}
                      size="small"
                    >
                      <ToggleButton
                        value="now"
                        sx={{ textTransform: "none", px: 3 }}
                      >
                        <Send sx={{ fontSize: 16, mr: 0.5 }} />
                        {lang?.postNow || "Post Now"}
                      </ToggleButton>
                      <ToggleButton
                        value="schedule"
                        sx={{ textTransform: "none", px: 3 }}
                      >
                        <Schedule sx={{ fontSize: 16, mr: 0.5 }} />
                        {lang?.schedule || "Schedule"}
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </Box>

                  {/* Schedule options */}
                  {postMode === "schedule" && (
                    <Stack spacing={2}>
                      <TextField
                        fullWidth
                        label={lang?.scheduleDateTime || "Date & Time"}
                        type="datetime-local"
                        value={scheduledAt}
                        onChange={(e) => setScheduledAt(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        inputProps={{
                          min: moment()
                            .add(5, "minutes")
                            .format("YYYY-MM-DDTHH:mm"),
                        }}
                        InputProps={{
                          startAdornment: (
                            <CalendarMonth
                              sx={{
                                color: "primary.main",
                                mr: 1,
                                fontSize: 20,
                              }}
                            />
                          ),
                        }}
                      />
                      <Autocomplete
                        options={TIMEZONES}
                        value={timezone}
                        onChange={(_, newValue) =>
                          newValue && setTimezone(newValue)
                        }
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label={lang?.timezone || "Timezone"}
                            InputProps={{
                              ...params.InputProps,
                              startAdornment: (
                                <>
                                  <Public
                                    sx={{
                                      color: "text.secondary",
                                      ml: 1,
                                      mr: 0.5,
                                      fontSize: 20,
                                    }}
                                  />
                                  {params.InputProps.startAdornment}
                                </>
                              ),
                            }}
                          />
                        )}
                        renderOption={(props, option) => (
                          <MenuItem {...props} key={option}>
                            <Typography variant="body2">{option}</Typography>
                          </MenuItem>
                        )}
                        ListboxProps={{ style: { maxHeight: 260 } }}
                        disableClearable
                        fullWidth
                      />

                      {scheduledAt && timezone && (
                        <Alert severity="info" icon={<AccessTime />}>
                          {lang?.willPostAt || "Will post at:"}{" "}
                          <strong>
                            {moment
                              .tz(scheduledAt, timezone)
                              .format("MMM D, YYYY [at] h:mm A")}{" "}
                            ({timezone})
                          </strong>
                          {" — "}
                          {moment.tz(scheduledAt, timezone).fromNow()}
                        </Alert>
                      )}
                    </Stack>
                  )}

                  <Stack direction="row" spacing={2} justifyContent="flex-end">
                    <Button
                      variant="outlined"
                      onClick={() => setActiveStep(0)}
                      sx={{ textTransform: "none", borderRadius: 2 }}
                    >
                      {lang?.back || "Back"}
                    </Button>
                    <Button
                      variant="contained"
                      onClick={() => setActiveStep(2)}
                      disabled={!selectedAccount}
                      sx={{ textTransform: "none", borderRadius: 2, px: 4 }}
                    >
                      {lang?.next || "Review Post"} →
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* ══ STEP 2 — Review & Publish ══ */}
        {activeStep === 2 && selectedMedia && selectedAccount && (
          <Card
            elevation={0}
            sx={{ border: "1px solid", borderColor: "divider" }}
          >
            <Box
              sx={{
                px: 3,
                py: 2,
                background: `linear-gradient(135deg, ${theme.palette.success.main}18, ${theme.palette.success.main}08)`,
                borderBottom: "1px solid",
                borderColor: "divider",
              }}
            >
              <Typography variant="subtitle1" fontWeight={700}>
                {lang?.reviewPost || "Review & Confirm"}
              </Typography>
            </Box>
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Box
                    sx={{
                      aspectRatio: "9/16",
                      borderRadius: 2,
                      overflow: "hidden",
                      bgcolor: "grey.100",
                    }}
                  >
                    {selectedMedia.resolved.type === "VIDEO" ? (
                      <Box
                        component="video"
                        src={selectedMedia.resolved.url}
                        controls
                        sx={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <Box
                        component="img"
                        src={selectedMedia.resolved.url}
                        sx={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    )}
                  </Box>
                </Grid>
                <Grid item xs={12} md={8}>
                  <Stack spacing={2}>
                    {/* Platform */}
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        border: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        fontWeight={600}
                      >
                        {lang?.platformAndAccount || "PLATFORM & ACCOUNT"}
                      </Typography>
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1}
                        sx={{ mt: 1 }}
                      >
                        {selectedAccount.platform === "instagram" ? (
                          <Instagram sx={{ color: "#E1306C" }} />
                        ) : (
                          <TikTokIcon />
                        )}
                        <Typography fontWeight={700}>
                          @{selectedAccount.username || selectedAccount.name}
                        </Typography>
                        <Chip
                          label={selectedAccount.platform}
                          size="small"
                          color={
                            selectedAccount.platform === "instagram"
                              ? "error"
                              : "default"
                          }
                        />
                      </Stack>
                    </Box>

                    {/* Media type */}
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        border: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        fontWeight={600}
                      >
                        {lang?.mediaTypeLabel || "MEDIA TYPE"}
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                        <Chip
                          label={selectedMedia.resolved.type}
                          color="primary"
                          size="small"
                        />
                        <Chip
                          label={selectedMedia.sourceType.toUpperCase()}
                          variant="outlined"
                          size="small"
                        />
                      </Stack>
                    </Box>

                    {/* Caption preview */}
                    {(caption || hashtagList.length > 0) && (
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          border: "1px solid",
                          borderColor: "divider",
                        }}
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          fontWeight={600}
                        >
                          {lang?.captionLabel || "CAPTION"}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ mt: 1, whiteSpace: "pre-wrap" }}
                        >
                          {caption}
                          {hashtagList.length > 0 && (
                            <>
                              <br />
                              <br />
                              <span
                                style={{ color: theme.palette.primary.main }}
                              >
                                {hashtagList.join(" ")}
                              </span>
                            </>
                          )}
                        </Typography>
                      </Box>
                    )}

                    {/* Schedule */}
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        border: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        fontWeight={600}
                      >
                        {lang?.postingTime || "POSTING TIME"}
                      </Typography>
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1}
                        sx={{ mt: 1 }}
                      >
                        {postMode === "now" ? (
                          <>
                            <Send
                              sx={{ color: "success.main", fontSize: 18 }}
                            />
                            <Typography fontWeight={600} color="success.main">
                              {lang?.postImmediately || "Post Immediately"}
                            </Typography>
                          </>
                        ) : (
                          <>
                            <Schedule
                              sx={{ color: "warning.main", fontSize: 18 }}
                            />
                            <Typography fontWeight={600}>
                              {moment
                                .tz(scheduledAt, timezone)
                                .format("MMM D, YYYY [at] h:mm A")}{" "}
                              ({timezone})
                            </Typography>
                          </>
                        )}
                      </Stack>
                    </Box>

                    <Stack
                      direction="row"
                      spacing={2}
                      justifyContent="flex-end"
                    >
                      <Button
                        variant="outlined"
                        onClick={() => setActiveStep(1)}
                        sx={{ textTransform: "none", borderRadius: 2 }}
                      >
                        {lang?.back || "Back"}
                      </Button>
                      <Button
                        variant="contained"
                        color={postMode === "now" ? "success" : "primary"}
                        startIcon={
                          submitting ? (
                            <CircularProgress size={16} color="inherit" />
                          ) : postMode === "now" ? (
                            <Send />
                          ) : (
                            <Schedule />
                          )
                        }
                        onClick={handleSubmit}
                        disabled={submitting}
                        sx={{
                          textTransform: "none",
                          borderRadius: 2,
                          px: 4,
                          fontWeight: 700,
                        }}
                      >
                        {submitting
                          ? lang?.publishing || "Publishing..."
                          : postMode === "now"
                            ? lang?.publishNow || "Publish Now"
                            : lang?.schedulePost || "Schedule Post"}
                      </Button>
                    </Stack>
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}
      </Box>

      {/* ── Result Dialog (CommonDialog) ── */}
      <CommonDialog
        open={resultDialog.open}
        onClose={() => setResultDialog({ ...resultDialog, open: false })}
        title={
          resultDialog.success
            ? lang?.success || "Success"
            : lang?.error || "Error"
        }
        icon={AddOutlined}
        maxWidth="xs"
        fullWidth
      >
        <Box sx={{ py: 1 }}>
          <Alert
            severity={resultDialog.success ? "success" : "error"}
            sx={{ borderRadius: 2 }}
          >
            {resultDialog.msg}
          </Alert>
          <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
            <Button
              variant="contained"
              onClick={() => setResultDialog({ ...resultDialog, open: false })}
              sx={{ textTransform: "none", borderRadius: 2 }}
            >
              {lang?.ok || "OK"}
            </Button>
          </Stack>
        </Box>
      </CommonDialog>
    </Box>
  );
};

export default SocialPublishing;
