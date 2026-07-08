import React from "react";
import {
  Avatar,
  Box,
  Divider,
  ListItemIcon,
  Menu,
  MenuItem,
  Typography,
  alpha,
  Stack,
  LinearProgress,
  Chip,
} from "@mui/material";
import {
  LogoutOutlined,
  WorkspacePremiumOutlined,
  TokenOutlined,
} from "@mui/icons-material";
import { useHistory } from "react-router-dom";
import { UserContext } from "../../context/UserContext";
import ProfileDialog from "./ProfileDialog";

const ProfileComp = ({ theme, lang }) => {
  const history = useHistory();
  const [anchor, setAnchor] = React.useState(null);
  const { userData } = React.useContext(UserContext);

  const handleClose = () => setAnchor(null);

  const handleLogout = () => {
    handleClose();
    localStorage.removeItem(process.env.REACT_APP_TOKEN + "_user");
    history.push("/user");
  };

  const nav = (path) => {
    handleClose();
    history.push(path);
  };

  // ── Parse plan safely ─────────────────────────────────
  const plan = React.useMemo(() => {
    if (!userData?.plan) return null;
    try {
      return typeof userData.plan === "string"
        ? JSON.parse(userData.plan)
        : userData.plan;
    } catch {
      return null;
    }
  }, [userData?.plan]);

  const credits = Number(userData?.credits || 0);
  const maxCredits = Number(plan?.credits || 0);
  const creditPercent =
    maxCredits > 0 ? Math.min((credits / maxCredits) * 100, 100) : 0;

  const creditBarColor =
    creditPercent > 50
      ? theme.palette.success.main
      : creditPercent > 20
        ? theme.palette.warning.main
        : theme.palette.error.main;

  return (
    <>
      <Avatar
        onClick={(e) => setAnchor(e.currentTarget)}
        sx={{
          width: 34,
          height: 34,
          fontSize: "0.8rem",
          fontWeight: 700,
          cursor: "pointer",
          bgcolor: alpha(theme.palette.primary.main, 0.12),
          color: theme.palette.primary.main,
          border: `1.5px solid ${alpha(theme.palette.primary.main, 0.2)}`,
        }}
      >
        {userData?.name?.charAt(0)?.toUpperCase() || "U"}
      </Avatar>

      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={handleClose}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 230,
            borderRadius: 2.5,
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: "0 8px 32px 0 rgba(0,0,0,0.10)",
            "& .MuiMenuItem-root": {
              borderRadius: 1.5,
              mx: 0.5,
              px: 1.5,
              py: 0.9,
              fontSize: "0.8rem",
              fontWeight: 500,
              gap: 1,
            },
          },
        }}
      >
        {/* ── User Header ── */}
        <Box px={2} py={1.2}>
          <Stack direction="row" alignItems="center" spacing={1.2}>
            <Avatar
              sx={{
                width: 36,
                height: 36,
                fontSize: "0.85rem",
                fontWeight: 700,
                bgcolor: alpha(theme.palette.primary.main, 0.12),
                color: theme.palette.primary.main,
              }}
            >
              {userData?.name?.charAt(0)?.toUpperCase() || "U"}
            </Avatar>
            <Box minWidth={0}>
              <Typography variant="body2" fontWeight={700} noWrap>
                {userData?.name || "Guest"}
              </Typography>
              <Typography
                variant="caption"
                color="text.disabled"
                noWrap
                display="block"
              >
                {userData?.email || "—"}
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Divider sx={{ my: 0.5 }} />

        {/* ── Plan + Credits Block ── */}
        {plan && (
          <Box
            mx={1}
            mb={0.5}
            px={1.5}
            py={1.2}
            sx={{
              borderRadius: 2,
              bgcolor: alpha("#8B5CF6", 0.06),
              border: `1px solid ${alpha("#8B5CF6", 0.15)}`,
            }}
          >
            {/* Plan name + expiry chip */}
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              mb={1}
            >
              <Stack direction="row" spacing={0.6} alignItems="center">
                <WorkspacePremiumOutlined
                  sx={{ fontSize: 13, color: "#8B5CF6" }}
                />
                <Typography variant="caption" fontWeight={700} color="#8B5CF6">
                  {plan.title || "Plan"}
                </Typography>
              </Stack>

              <Chip
                size="small"
                label={lang?.lifetime || "Lifetime"}
                sx={{
                  height: 16,
                  fontSize: "0.58rem",
                  fontWeight: 700,
                  bgcolor: alpha(theme.palette.success.main, 0.1),
                  color: "success.main",
                  border: "none",
                }}
              />
            </Stack>

            {/* Credits bar */}
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              mb={0.5}
            >
              <Stack direction="row" spacing={0.5} alignItems="center">
                <TokenOutlined sx={{ fontSize: 11, color: "text.disabled" }} />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={600}
                >
                  {lang?.credits || "Credits"}
                </Typography>
              </Stack>
              <Typography
                variant="caption"
                fontWeight={700}
                color="text.primary"
              >
                {credits.toLocaleString()}
                {maxCredits > 0 && (
                  <Typography
                    component="span"
                    variant="caption"
                    color="text.disabled"
                  >
                    {" "}
                    / {maxCredits.toLocaleString()}
                  </Typography>
                )}
              </Typography>
            </Stack>

            <LinearProgress
              variant="determinate"
              value={creditPercent}
              sx={{
                height: 5,
                borderRadius: 99,
                bgcolor: alpha(creditBarColor, 0.12),
                "& .MuiLinearProgress-bar": {
                  bgcolor: creditBarColor,
                  borderRadius: 99,
                },
              }}
            />

            <Stack direction="row" spacing={0.5} alignItems="center" mt={0.8}>
              <WorkspacePremiumOutlined
                sx={{ fontSize: 10, color: "text.disabled" }}
              />
              <Typography variant="caption" color="text.disabled">
                {lang?.lifetimeAccess || "Lifetime access"}
              </Typography>
            </Stack>
          </Box>
        )}

        <Divider sx={{ my: 0.5 }} />

        <MenuItem onClick={() => nav("/#pricing")}>
          <ListItemIcon>
            <WorkspacePremiumOutlined sx={{ fontSize: 16 }} />
          </ListItemIcon>
          {lang?.upgradePlan || "Upgrade Plan"}
        </MenuItem>

        <MenuItem onClick={() => nav("/user?page=buy-credits")}>
          <ListItemIcon>
            <TokenOutlined sx={{ fontSize: 16 }} />
          </ListItemIcon>
          {lang?.buyCredits || "Buy Credits"}
        </MenuItem>

        <Divider sx={{ my: 0.5 }} />

        <ProfileDialog lang={lang} />

        <Divider sx={{ my: 0.5 }} />

        <MenuItem
          onClick={handleLogout}
          sx={{
            color: "error.main",
            "&:hover": { bgcolor: alpha("#EF4444", 0.06) },
          }}
        >
          <ListItemIcon>
            <LogoutOutlined sx={{ fontSize: 16, color: "error.main" }} />
          </ListItemIcon>
          {lang?.logout || "Logout"}
        </MenuItem>
      </Menu>
    </>
  );
};

export default ProfileComp;
