import React from "react";
import PageHeader from "../../common/PageHeader";
import CommonDialog from "../../common/CommonDialog";
import { GlobalContext } from "../../context/GlobalContext";
import {
  AutoFixHigh,
  AddOutlined,
  EditOutlined,
  DeleteOutlined,
  SaveOutlined,
  PersonOutlined,
  TuneOutlined,
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
  Chip,
  IconButton,
  Tooltip,
  Grid,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";

const TYPE_CONFIG = {
  new: { label: "New Influencer", color: "#8B5CF6", icon: PersonOutlined },
  variation: { label: "Variation", color: "#3B82F6", icon: TuneOutlined },
};

// ── Prompt Card ───────────────────────────────────────────
const PromptCard = ({ item, onEdit, onDelete, theme }) => {
  const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.new;
  return (
    <Card
      sx={{
        height: "100%",
        borderRadius: 2.5,
        border: `1px solid ${theme.palette.divider}`,
        transition: "all 0.25s ease",
        "&:hover": {
          borderColor: alpha(cfg.color, 0.4),
          boxShadow: `0 4px 20px ${alpha(cfg.color, 0.12)}`,
          transform: "translateY(-2px)",
        },
      }}
    >
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Stack spacing={1.5}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Chip
              icon={<cfg.icon sx={{ fontSize: "14px !important" }} />}
              label={cfg.label}
              size="small"
              sx={{
                bgcolor: alpha(cfg.color, 0.1),
                color: cfg.color,
                fontWeight: 700,
                fontSize: "0.65rem",
                height: 22,
                "& .MuiChip-icon": { color: cfg.color },
              }}
            />
            <Stack direction="row" spacing={0.5}>
              <Tooltip title="Edit">
                <IconButton
                  size="small"
                  onClick={() => onEdit(item)}
                  sx={{
                    color: "text.disabled",
                    "&:hover": {
                      color: "#3B82F6",
                      bgcolor: alpha("#3B82F6", 0.08),
                    },
                  }}
                >
                  <EditOutlined sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <IconButton
                  size="small"
                  onClick={() => onDelete(item.id)}
                  sx={{
                    color: "text.disabled",
                    "&:hover": {
                      color: "#EF4444",
                      bgcolor: alpha("#EF4444", 0.08),
                    },
                  }}
                >
                  <DeleteOutlined sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              lineHeight: 1.7,
              fontSize: "0.82rem",
              display: "-webkit-box",
              WebkitLineClamp: 4,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {item.prompt}
          </Typography>

          <Typography variant="caption" color="text.disabled">
            #{item.id}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
};

// ── Main Component ────────────────────────────────────────
const PromptTemplate = ({ lang }) => {
  const { hitAxios } = React.useContext(GlobalContext);
  const theme = useTheme();

  const [templates, setTemplates] = React.useState([]);
  const [filterType, setFilterType] = React.useState("all");

  const initState = {
    dialog: false,
    editMode: false,
    editData: null,
    prompt: "",
    type: "new",
  };
  const [state, setState] = React.useState(initState);

  const set = (patch) => setState((p) => ({ ...p, ...patch }));

  // ── API calls
  async function getTemplates() {
    const res = await hitAxios({
      path: "/api/admin/get_prompt_t",
      post: false,
      admin: true,
    });
    if (res?.data?.success) setTemplates(res.data.data);
  }

  async function handleSave() {
    const path = state.editMode
      ? "/api/admin/update_prompt_t"
      : "/api/admin/add_prmpt_temp";
    const obj = state.editMode
      ? { id: state.editData.id, prompt: state.prompt }
      : { prompt: state.prompt, type: state.type };

    const res = await hitAxios({ path, post: true, admin: true, obj });
    if (res?.data?.success) {
      setState(initState);
      getTemplates();
    }
  }

  async function handleDelete(id) {
    const res = await hitAxios({
      path: "/api/admin/del_prompt_t",
      post: true,
      admin: true,
      obj: { id },
    });
    if (res?.data?.success) getTemplates();
  }

  // ── Dialog helpers
  const openAdd = () =>
    set({ dialog: true, editMode: false, prompt: "", type: "new" });
  const openEdit = (item) =>
    set({
      dialog: true,
      editMode: true,
      editData: item,
      prompt: item.prompt,
      type: item.type,
    });

  const filtered =
    filterType === "all"
      ? templates
      : templates.filter((t) => t.type === filterType);

  React.useEffect(() => {
    getTemplates();
  }, []);

  return (
    <Box>
      <PageHeader
        icon={AutoFixHigh}
        title={lang?.promptTe || "Prompt Templates"}
        subtitle={
          lang?.promptTSub || "Manage pre-made prompt templates for users"
        }
        primaryAction={
          <Button
            variant="contained"
            size="large"
            startIcon={<AddOutlined />}
            onClick={openAdd}
          >
            {lang?.addTemplate || "Add Template"}
          </Button>
        }
      />

      {/* Filter Chips */}
      <Stack direction="row" spacing={1} mb={3}>
        {["all", "new", "variation"].map((f) => {
          const color = f === "all" ? "#6366F1" : TYPE_CONFIG[f].color;
          const count =
            f === "all"
              ? templates.length
              : templates.filter((t) => t.type === f).length;
          return (
            <Chip
              key={f}
              label={`${f === "all" ? lang?.all || "All" : TYPE_CONFIG[f].label} (${count})`}
              onClick={() => setFilterType(f)}
              sx={{
                fontWeight: 700,
                fontSize: "0.75rem",
                cursor: "pointer",
                bgcolor: filterType === f ? alpha(color, 0.12) : "transparent",
                color: filterType === f ? color : "text.disabled",
                border: `1px solid ${filterType === f ? alpha(color, 0.4) : theme.palette.divider}`,
                "&:hover": { bgcolor: alpha(color, 0.08) },
              }}
            />
          );
        })}
      </Stack>

      {/* Empty State */}
      {filtered.length === 0 ? (
        <Card
          sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}
        >
          <Stack alignItems="center" py={8} spacing={2}>
            <Avatar
              sx={{
                width: 64,
                height: 64,
                bgcolor: alpha("#8B5CF6", 0.1),
                color: "#8B5CF6",
              }}
            >
              <AutoFixHigh sx={{ fontSize: 32 }} />
            </Avatar>
            <Typography fontWeight={700}>
              {lang?.noTemplates || "No templates yet"}
            </Typography>
            <Typography variant="body2" color="text.disabled">
              {lang?.noTemplatesDesc ||
                "Add your first prompt template to get started"}
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddOutlined />}
              onClick={openAdd}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                borderRadius: 2,
                bgcolor: "#8B5CF6",
                "&:hover": { bgcolor: "#7C3AED" },
              }}
            >
              {lang?.addTemplate || "Add Template"}
            </Button>
          </Stack>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {filtered.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item.id}>
              <PromptCard
                item={item}
                onEdit={openEdit}
                onDelete={handleDelete}
                theme={theme}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Add / Edit Dialog */}
      <CommonDialog
        open={state.dialog}
        onClose={() => setState(initState)}
        title={
          state.editMode
            ? lang?.editTemplate || "Edit Template"
            : lang?.addTemplate || "Add Template"
        }
        icon={state.editMode ? EditOutlined : AddOutlined}
        maxWidth="sm"
        fullWidth
      >
        <Stack spacing={2.5} pt={1}>
          {/* Type toggle — add mode only */}
          {!state.editMode && (
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={600}
                mb={1}
                display="block"
              >
                {lang?.promptType || "Template Type"}
              </Typography>
              <ToggleButtonGroup
                value={state.type}
                exclusive
                fullWidth
                size="small"
                onChange={(_, val) => val && set({ type: val })}
              >
                {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                  <ToggleButton
                    key={key}
                    value={key}
                    sx={{
                      textTransform: "none",
                      fontWeight: 600,
                      borderRadius: "8px !important",
                      ml: key === "variation" ? "4px !important" : 0,
                      "&.Mui-selected": {
                        bgcolor: alpha(cfg.color, 0.12),
                        color: cfg.color,
                        borderColor: alpha(cfg.color, 0.4),
                      },
                    }}
                  >
                    <cfg.icon sx={{ fontSize: 16, mr: 0.8 }} />
                    {cfg.label}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>
          )}

          {/* Prompt textarea */}
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={600}
              mb={1}
              display="block"
            >
              {lang?.promptText || "Prompt Text"}
            </Typography>
            <TextField
              multiline
              rows={5}
              fullWidth
              value={state.prompt}
              onChange={(e) => set({ prompt: e.target.value })}
              placeholder={
                lang?.promptPlaceholder ||
                "e.g. Full body shot, professional 30-year-old woman, tailored suit, modern office..."
              }
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  fontSize: "0.875rem",
                },
              }}
            />
            <Typography
              variant="caption"
              color="text.disabled"
              mt={0.5}
              display="block"
            >
              {state.prompt.length} {lang?.characters || "characters"}
            </Typography>
          </Box>

          {/* Actions */}
          <Stack direction="row" justifyContent="flex-end" spacing={1.5}>
            <Button
              onClick={() => setState(initState)}
              variant="outlined"
              sx={{ textTransform: "none", borderRadius: 2 }}
            >
              {lang?.cancel || "Cancel"}
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveOutlined />}
              disabled={!state.prompt.trim()}
              onClick={handleSave}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                borderRadius: 2,
                bgcolor: "#8B5CF6",
                "&:hover": { bgcolor: "#7C3AED" },
              }}
            >
              {state.editMode ? lang?.update || "Update" : lang?.add || "Add"}
            </Button>
          </Stack>
        </Stack>
      </CommonDialog>
    </Box>
  );
};

export default PromptTemplate;
