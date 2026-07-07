import {
  AddAPhoto,
  AddOutlined,
  AutoAwesome,
  CheckCircle,
  ContentCopyOutlined,
  PersonOutlined,
  TuneOutlined,
} from "@mui/icons-material";
import {
  alpha,
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import React from "react";
import CommonDialog from "../../../common/CommonDialog";
import { GlobalContext } from "../../../context/GlobalContext";

const TYPE_CONFIG = {
  new: { label: "New Influencer", color: "#8B5CF6", icon: PersonOutlined },
  variation: { label: "Variation", color: "#3B82F6", icon: TuneOutlined },
};

const AddNew = ({ lang, inf, getGallery }) => {
  const [prompts, setPrompts] = React.useState([]);
  const { hitAxios } = React.useContext(GlobalContext);
  const [filterType, setFilterType] = React.useState("variation");

  const [state, setState] = React.useState({
    dialog: false,
    selectedModel: {},
    prompt: "",
  });

  const cs = (key, val) => setState((p) => ({ ...p, [key]: val }));
  const set = (patch) => setState((p) => ({ ...p, ...patch }));

  async function getPrompt() {
    const res = await hitAxios({
      path: "/api/admin/get_prompt_t",
      post: false,
      admin: false,
    });
    if (res?.data?.success) setPrompts(res.data.data);
  }

  async function handleAdd() {
    const res = await hitAxios({
      path: "/api/gallery/add_new_task",
      post: true,
      admin: false,
      obj: state,
    });
    if (res?.data?.success) {
      getGallery();
      set({ dialog: false, prompt: "", selectedModel: {} });
    }
  }

  const filtered = prompts.filter((p) => p.type === filterType);
  const copyToClipboard = (text) => navigator.clipboard.writeText(text);

  React.useEffect(() => {
    getPrompt();
  }, []);

  return (
    <div>
      <Button
        onClick={() => cs("dialog", true)}
        size="large"
        startIcon={<AddOutlined />}
        variant="contained"
      >
        {lang?.addNew || "Add New"}
      </Button>

      <CommonDialog
        icon={AddAPhoto}
        title={lang?.selectModel || "Select your model"}
        open={state.dialog}
        onClose={() => set({ dialog: false, prompt: "", selectedModel: {} })}
        fullWidth
      >
        <Stack direction="column" spacing={3} pt={1}>
          {/* ── Model Selector Grid ── */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
              gap: 1.5,
            }}
          >
            {inf
              ?.filter((i) => i?.status === "active")
              ?.map((i) => {
                const isSelected = state.selectedModel?.id === i?.id;
                return (
                  <Box
                    key={i.id}
                    onClick={() => cs("selectedModel", i)}
                    sx={{
                      position: "relative",
                      cursor: "pointer",
                      borderRadius: 3,
                      overflow: "hidden",
                      border: (theme) =>
                        `2px solid ${
                          isSelected
                            ? theme.palette.primary.main
                            : "transparent"
                        }`,
                      boxShadow: (theme) =>
                        isSelected
                          ? `0 0 0 3px ${alpha(theme.palette.primary.main, 0.2)}`
                          : "none",
                      transition: "all 0.2s ease",
                      aspectRatio: "3/4",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: (theme) =>
                          `0 8px 24px ${alpha(theme.palette.common.black, 0.15)}`,
                      },
                    }}
                  >
                    {/* Full cover image */}
                    <Box
                      component="img"
                      src={`/media/${i?.photo_url}`}
                      alt={i?.name}
                      sx={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        objectPosition: "top",
                        display: "block",
                      }}
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />

                    {/* Gradient overlay + name */}
                    <Box
                      sx={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background:
                          "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)",
                        px: 1,
                        pt: 3,
                        pb: 1,
                      }}
                    >
                      <Typography
                        variant="caption"
                        fontWeight={700}
                        color="white"
                        noWrap
                        display="block"
                      >
                        {i?.name}
                      </Typography>
                    </Box>

                    {/* Selected checkmark */}
                    {isSelected && (
                      <Box
                        sx={{
                          position: "absolute",
                          top: 6,
                          right: 6,
                        }}
                      >
                        <CheckCircle
                          sx={{
                            fontSize: 22,
                            color: (t) => t.palette.info.main,
                            bgcolor: "white",
                            borderRadius: "50%",
                            display: "block",
                          }}
                        />
                      </Box>
                    )}

                    {/* Fallback if no image */}
                    <Box
                      sx={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: (theme) =>
                          alpha(theme.palette.primary.main, 0.08),
                        zIndex: -1,
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 48,
                          height: 48,
                          mb: 1,
                          bgcolor: (theme) =>
                            alpha(theme.palette.primary.main, 0.15),
                          color: "primary.main",
                        }}
                      >
                        {i?.name?.charAt(0)?.toUpperCase()}
                      </Avatar>
                      <Typography
                        variant="caption"
                        fontWeight={700}
                        color="text.primary"
                        noWrap
                      >
                        {i?.name}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
          </Box>

          <Divider />

          {/* ── Prompt Textarea ── */}
          <TextField
            placeholder={
              lang?.selModelRefTex ||
              "wearing golden earrings sitting in coffee shop reading book"
            }
            multiline
            rows={3}
            value={state.prompt}
            onChange={(e) => cs("prompt", e.target.value)}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
          />

          {/* ── Prompt Templates Section ── */}
          <Box>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              mb={1.5}
            >
              <Typography
                variant="caption"
                fontWeight={700}
                color="text.secondary"
                sx={{ textTransform: "uppercase", letterSpacing: 0.8 }}
              >
                {lang?.promptTemplates || "💡 Prompt Templates"}
              </Typography>

              <ToggleButtonGroup
                value={filterType}
                exclusive
                size="small"
                onChange={(_, val) => val && setFilterType(val)}
              >
                {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                  <ToggleButton
                    key={key}
                    value={key}
                    sx={{
                      textTransform: "none",
                      fontWeight: 600,
                      fontSize: "0.68rem",
                      px: 1.2,
                      py: 0.4,
                      "&.Mui-selected": {
                        bgcolor: alpha(cfg.color, 0.12),
                        color: cfg.color,
                        borderColor: alpha(cfg.color, 0.4),
                      },
                    }}
                  >
                    <cfg.icon sx={{ fontSize: 13, mr: 0.5 }} />
                    {cfg.label}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Stack>

            <Stack
              spacing={1}
              sx={{
                maxHeight: 220,
                overflowY: "auto",
                pr: 0.5,
                "&::-webkit-scrollbar": { width: 4 },
                "&::-webkit-scrollbar-thumb": {
                  borderRadius: 4,
                  bgcolor: (theme) => alpha(theme.palette.divider, 0.8),
                },
              }}
            >
              {filtered.length === 0 ? (
                <Typography
                  variant="caption"
                  color="text.disabled"
                  textAlign="center"
                  py={2}
                  display="block"
                >
                  {lang?.noTemplates || "No templates available"}
                </Typography>
              ) : (
                filtered.map((item) => {
                  const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.new;
                  const isActive = state.prompt === item.prompt;
                  return (
                    <Paper
                      key={item.id}
                      onClick={() => cs("prompt", item.prompt)}
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        cursor: "pointer",
                        border: `1px solid`,
                        borderColor: isActive
                          ? alpha(cfg.color, 0.5)
                          : "divider",
                        bgcolor: isActive
                          ? alpha(cfg.color, 0.05)
                          : "transparent",
                        transition: "all 0.2s",
                        "&:hover": {
                          borderColor: alpha(cfg.color, 0.4),
                          bgcolor: alpha(cfg.color, 0.04),
                        },
                      }}
                    >
                      <Stack
                        direction="row"
                        alignItems="flex-start"
                        justifyContent="space-between"
                        spacing={1}
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            lineHeight: 1.6,
                            flex: 1,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {item.prompt}
                        </Typography>
                        <Tooltip title={lang?.copy || "Copy"}>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(item.prompt);
                            }}
                            sx={{
                              flexShrink: 0,
                              color: "text.disabled",
                              "&:hover": {
                                color: cfg.color,
                                bgcolor: alpha(cfg.color, 0.08),
                              },
                            }}
                          >
                            <ContentCopyOutlined sx={{ fontSize: 13 }} />
                          </IconButton>
                        </Tooltip>
                      </Stack>

                      {isActive && (
                        <Chip
                          label={lang?.selected || "Selected"}
                          size="small"
                          sx={{
                            mt: 0.8,
                            height: 18,
                            fontSize: "0.6rem",
                            fontWeight: 700,
                            bgcolor: alpha(cfg.color, 0.12),
                            color: cfg.color,
                          }}
                        />
                      )}
                    </Paper>
                  );
                })
              )}
            </Stack>
          </Box>

          <Divider />

          {/* ── Generate Button ── */}
          <Stack alignItems="flex-end">
            <Button
              onClick={handleAdd}
              size="large"
              variant="contained"
              startIcon={<AutoAwesome />}
              disabled={!state.selectedModel?.id}
            >
              {lang?.generate || "Generate"}
            </Button>
          </Stack>
        </Stack>
      </CommonDialog>
    </div>
  );
};

export default AddNew;
