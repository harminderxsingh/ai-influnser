import React from "react";
import PageHeader from "../../common/PageHeader";
import {
  NotificationsActive,
  CampaignOutlined,
  WarningAmberOutlined,
  TaskAltOutlined,
  EmailOutlined,
} from "@mui/icons-material";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Switch,
  alpha,
  useTheme,
  Avatar,
  Divider,
} from "@mui/material";
import { UserContext } from "../../context/UserContext";
import { GlobalContext } from "../../context/GlobalContext";

const NOTIFICATION_TYPES = (lang) => [
  {
    key: "marketing",
    icon: CampaignOutlined,
    color: "#8B5CF6",
    title: lang?.notiMarketingTitle || "Email Marketing",
    desc:
      lang?.notiMarketingDesc ||
      "Receive promotional updates, new features, and product announcements",
  },
  {
    key: "alert",
    icon: WarningAmberOutlined,
    color: "#EF4444",
    title: lang?.notiAlertTitle || "Email Alerts",
    desc:
      lang?.notiAlertDesc ||
      "Get notified about critical issues, failures, and system warnings",
  },
  {
    key: "task",
    icon: TaskAltOutlined,
    color: "#059669",
    title: lang?.notiTaskTitle || "Task Complete",
    desc:
      lang?.notiTaskDesc ||
      "Receive an email when your video generation or task finishes",
  },
  {
    key: "other",
    icon: EmailOutlined,
    color: "#D97706",
    title: lang?.notiOtherTitle || "Other Emails",
    desc:
      lang?.notiOtherDesc ||
      "Miscellaneous emails including tips, surveys, and account updates",
  },
];

// ── Notification Row ──────────────────────────────────────
const NotifRow = ({ item, enabled, onChange, theme, loading }) => (
  <Stack direction="row" alignItems="center" spacing={2} px={2} py={2}>
    <Avatar
      sx={{
        width: 42,
        height: 42,
        bgcolor: alpha(item.color, 0.1),
        color: item.color,
        flexShrink: 0,
      }}
    >
      <item.icon sx={{ fontSize: 20 }} />
    </Avatar>

    <Box flex={1} minWidth={0}>
      <Typography variant="body2" fontWeight={700} color="text.primary">
        {item.title}
      </Typography>
      <Typography
        variant="caption"
        color="text.disabled"
        display="block"
        mt={0.2}
      >
        {item.desc}
      </Typography>
    </Box>

    <Switch
      checked={!!enabled}
      disabled={loading}
      onChange={(e) => onChange(item.key, e.target.checked)}
      sx={{
        flexShrink: 0,
        "& .MuiSwitch-switchBase.Mui-checked": { color: item.color },
        "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
          bgcolor: alpha(item.color, 0.5),
        },
      }}
    />
  </Stack>
);

// ── Main Component ────────────────────────────────────────
const Notification = ({ lang }) => {
  const theme = useTheme();
  const { getUserData, userData, setUserData } = React.useContext(UserContext);
  const { hitAxios } = React.useContext(GlobalContext);
  const [loading, setLoading] = React.useState(false);

  // ── Parse email_notification from userData (typo in key is from API)
  const getInitialSettings = () => {
    try {
      const raw = userData?.email_notification;
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      return {
        marketing: parsed?.marketing ?? true,
        alert: parsed?.alert ?? true,
        task: parsed?.task ?? true,
        other: parsed?.other ?? false,
      };
    } catch {
      return { marketing: true, alert: true, task: true, other: false };
    }
  };

  const [settings, setSettings] = React.useState(getInitialSettings);

  // Re-sync if userData loads after mount
  React.useEffect(() => {
    if (userData?.email_notification) {
      setSettings(getInitialSettings());
    }
  }, [userData]);

  // ── Save to API + optimistic update via setUserData
  const saveSettings = async (updatedSettings) => {
    setLoading(true);

    // 1️⃣ Optimistic — update context immediately so UI feels instant
    setUserData((prev) => ({
      ...prev,
      email_notification: updatedSettings,
    }));

    // 2️⃣ Persist to backend
    const res = await hitAxios({
      path: "/api/user/update_email",
      post: true,
      admin: false,
      obj: { json: updatedSettings }, // backend: req.body.json
    });

    // 3️⃣ Re-fetch fresh data from server to confirm sync
    if (res?.data?.success) {
      await getUserData();
    } else {
      // Rollback optimistic update on failure
      setUserData((prev) => ({
        ...prev,
        email_notification: settings, // revert to old settings
      }));
    }

    setLoading(false);
  };

  // ── Single toggle
  const handleToggle = (key, value) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    saveSettings(updated);
  };

  // ── Toggle all
  const allEnabled = Object.values(settings).every(Boolean);
  const noneEnabled = Object.values(settings).every((v) => !v);

  const handleToggleAll = () => {
    const updated = Object.fromEntries(
      Object.keys(settings).map((k) => [k, !allEnabled]),
    );
    setSettings(updated);
    saveSettings(updated);
  };

  const types = NOTIFICATION_TYPES(lang);

  return (
    <Box>
      <PageHeader
        icon={NotificationsActive}
        primaryAction={null}
        title={lang?.notification || "Notification"}
        subtitle={lang?.notiSub || "Manage email notifications"}
      />

      <Card
        sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}
      >
        <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
          {/* Header — toggle all */}
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            px={2.5}
            py={2}
            sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}
          >
            <Box>
              <Typography variant="body2" fontWeight={700}>
                {lang?.emailNotifications || "Email Notifications"}
              </Typography>
              <Typography variant="caption" color="text.disabled">
                {allEnabled
                  ? lang?.allEnabled || "All notifications enabled"
                  : noneEnabled
                    ? lang?.allDisabled || "All notifications disabled"
                    : lang?.someEnabled || "Some notifications enabled"}
              </Typography>
            </Box>
            <Switch
              checked={allEnabled}
              disabled={loading}
              onChange={handleToggleAll}
              sx={{
                "& .MuiSwitch-switchBase.Mui-checked": { color: "#6366F1" },
                "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                  bgcolor: alpha("#6366F1", 0.5),
                },
              }}
            />
          </Stack>

          {/* Rows */}
          {types.map((item, i) => (
            <React.Fragment key={item.key}>
              <NotifRow
                item={item}
                enabled={settings[item.key]}
                onChange={handleToggle}
                theme={theme}
                loading={loading}
              />
              {i < types.length - 1 && <Divider sx={{ mx: 2, opacity: 0.5 }} />}
            </React.Fragment>
          ))}
        </CardContent>
      </Card>
    </Box>
  );
};

export default Notification;
