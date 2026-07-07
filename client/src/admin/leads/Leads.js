import React from "react";
import PageHeader from "../../common/PageHeader";
import {
  ContactPhone,
  DeleteOutlined,
  EmailOutlined,
  PhoneOutlined,
  MessageOutlined,
} from "@mui/icons-material";
import { GlobalContext } from "../../context/GlobalContext";
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Skeleton,
  useTheme,
  alpha,
  Chip,
  Stack,
} from "@mui/material";
import { useCustomTheme } from "../../utils/useCustomTheme";

const Leads = ({ lang }) => {
  const [con, setCon] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [deletingId, setDeletingId] = React.useState(null);
  const { hitAxios } = React.useContext(GlobalContext);
  const theme = useTheme();
  const { config, isDark } = useCustomTheme();

  const textPrimary = isDark
    ? config.text_primary_dark
    : config.text_primary_light;
  const textSecondary = isDark
    ? config.text_secondary_dark
    : config.text_secondary_light;
  const borderColor = isDark ? config.border_dark : config.border_light;

  async function hangleGetContact() {
    const res = await hitAxios({
      path: "/api/admin/get_contact_us_leads",
      post: false,
      admin: true,
    });
    if (res.data.success) {
      setCon(res.data.data);
    }
    setLoading(false);
  }

  async function handleDelete(id) {
    setDeletingId(id);
    const res = await hitAxios({
      path: `/api/admin/delete_contact_lead/${id}`,
      post: false,
      admin: true,
      method: "DELETE",
    });
    if (res.data.success) {
      setCon((prev) => prev.filter((item) => item.id !== id));
    }
    setDeletingId(null);
  }

  React.useEffect(() => {
    hangleGetContact();
  }, []);

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <Box>
      <PageHeader
        title={lang?.leads || "Leads"}
        subtitle={lang?.leadsSub || "All contact us leads will appear here"}
        icon={ContactPhone}
        primaryAction={null}
      />

      <Box mt={3} display="flex" flexDirection="column" gap={2}>
        {/* ── Loading Skeletons ── */}
        {loading &&
          [...Array(4)].map((_, i) => (
            <Skeleton
              key={i}
              variant="rounded"
              height={130}
              sx={{ borderRadius: `${config.box.defaultBorderRadius}px` }}
            />
          ))}

        {/* ── Empty State ── */}
        {!loading && con.length === 0 && (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            py={10}
            gap={2}
            sx={{
              bgcolor: "background.paper",
              border: `1px solid ${borderColor}`,
              borderRadius: `${config.box.defaultBorderRadius}px`,
            }}
          >
            <ContactPhone
              sx={{
                fontSize: 52,
                color: alpha(theme.palette.text.secondary, 0.15),
              }}
            />
            <Typography
              variant="body2"
              color={textSecondary}
              fontFamily={config.font_family}
              fontWeight={500}
            >
              {lang?.noLeads ||
                "No leads yet. Submissions from the contact form will appear here."}
            </Typography>
          </Box>
        )}

        {/* ── Lead Cards ── */}
        {!loading &&
          con.map((item) => (
            <Box
              key={item.id}
              sx={{
                bgcolor: "background.paper",
                border: `1px solid ${borderColor}`,
                borderRadius: `${config.box.defaultBorderRadius}px`,
                p: { xs: 2.5, md: 3 },
                transition: "box-shadow 0.2s",
                "&:hover": {
                  boxShadow: `0 4px 24px ${alpha(theme.palette.primary.main, 0.08)}`,
                },
              }}
            >
              {/* ── Top Row: Name + Date + Delete ── */}
              <Box
                display="flex"
                alignItems="flex-start"
                justifyContent="space-between"
                mb={2}
              >
                <Box display="flex" alignItems="center" gap={1.5}>
                  {/* Avatar circle */}
                  <Box
                    sx={{
                      width: 38,
                      height: 38,
                      borderRadius: "50%",
                      background: isDark
                        ? config.gradient_primary_dark
                        : config.gradient_primary_light,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Typography
                      fontFamily={config.font_family}
                      fontWeight={700}
                      fontSize={15}
                      color={isDark ? "#000" : "#fff"}
                    >
                      {item.name?.charAt(0).toUpperCase()}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography
                      fontFamily={config.font_family}
                      fontWeight={config.font_weight_bold || 700}
                      fontSize={15}
                      color={textPrimary}
                    >
                      {item.name}
                    </Typography>
                    <Typography
                      fontFamily={config.font_family}
                      fontSize={12}
                      color={textSecondary}
                    >
                      {formatDate(item.createdAt)}
                    </Typography>
                  </Box>
                </Box>

                {/* Delete button */}
                <Tooltip title={lang?.delete || "Delete"}>
                  <IconButton
                    size="small"
                    disabled={deletingId === item.id}
                    onClick={() => handleDelete(item.id)}
                    sx={{
                      color: theme.palette.error.main,
                      border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                      borderRadius: `${config.box.defaultBorderRadius}px`,
                      width: 32,
                      height: 32,
                      "&:hover": {
                        bgcolor: alpha(theme.palette.error.main, 0.08),
                      },
                    }}
                  >
                    <DeleteOutlined sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              </Box>

              {/* ── Info Chips Row ── */}
              <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                <Chip
                  icon={<EmailOutlined sx={{ fontSize: "14px !important" }} />}
                  label={item.email}
                  size="small"
                  sx={{
                    fontFamily: config.font_family,
                    fontSize: 12,
                    color: textSecondary,
                    bgcolor: alpha(theme.palette.primary.main, 0.06),
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                    "& .MuiChip-icon": { color: theme.palette.primary.main },
                  }}
                />
                {item.phone && (
                  <Chip
                    icon={
                      <PhoneOutlined sx={{ fontSize: "14px !important" }} />
                    }
                    label={item.phone}
                    size="small"
                    sx={{
                      fontFamily: config.font_family,
                      fontSize: 12,
                      color: textSecondary,
                      bgcolor: alpha(theme.palette.primary.main, 0.06),
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                      "& .MuiChip-icon": { color: theme.palette.primary.main },
                    }}
                  />
                )}
              </Box>

              {/* ── Message ── */}
              <Box
                sx={{
                  bgcolor: isDark
                    ? alpha(theme.palette.common.white, 0.03)
                    : alpha(theme.palette.common.black, 0.02),
                  border: `1px solid ${borderColor}`,
                  borderRadius: `${config.box.defaultBorderRadius}px`,
                  p: 2,
                  display: "flex",
                  gap: 1.5,
                  alignItems: "center",
                }}
              >
                <MessageOutlined
                  sx={{
                    fontSize: 16,
                    color: textSecondary,
                    mt: 0.3,
                    flexShrink: 0,
                  }}
                />
                <Typography
                  fontFamily={config.font_family}
                  fontSize={13.5}
                  color={textSecondary}
                  lineHeight={1.7}
                >
                  {item.message}
                </Typography>
              </Box>
            </Box>
          ))}
      </Box>
    </Box>
  );
};

export default Leads;
