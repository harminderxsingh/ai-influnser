import React from "react";
import PageHeader from "../../common/PageHeader";
import {
  Logout as LogoutIcon,
  WarningAmberOutlined,
} from "@mui/icons-material";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Button,
  alpha,
  useTheme,
  Avatar,
} from "@mui/material";
import { useHistory } from "react-router-dom";

const Logout = ({ lang }) => {
  const theme = useTheme();
  const history = useHistory();

  const handleLogout = () => {
    localStorage.removeItem(process.env.REACT_APP_TOKEN + "_user");
    history.push("/user");
  };

  return (
    <Box>
      <PageHeader
        icon={LogoutIcon}
        primaryAction={null}
        title={lang?.logout || "Logout"}
        subtitle={lang?.logoutSub || "Logout from your app"}
      />

      <Card
        sx={{
          borderRadius: 3,
          border: `1px solid ${alpha("#EF4444", 0.2)}`,
          bgcolor: alpha("#EF4444", 0.02),
        }}
      >
        <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
          <Stack spacing={3} alignItems="center" textAlign="center">
            {/* Icon */}
            <Avatar
              sx={{
                width: 56,
                height: 56,
                bgcolor: alpha("#EF4444", 0.1),
                color: "#EF4444",
              }}
            >
              <WarningAmberOutlined sx={{ fontSize: 28 }} />
            </Avatar>

            {/* Text */}
            <Box>
              <Typography
                variant="body1"
                fontWeight={700}
                color="text.primary"
                mb={0.8}
              >
                {lang?.logoutConfirmTitle || "Are you sure you want to logout?"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {lang?.logoutConfirmDesc ||
                  "You will be signed out of your account and redirected to the login page."}
              </Typography>
            </Box>

            {/* Button */}
            <Button
              fullWidth
              variant="contained"
              onClick={handleLogout}
              startIcon={<LogoutIcon sx={{ fontSize: 16 }} />}
              sx={{
                bgcolor: "#EF4444",
                color: "#fff",
                fontWeight: 700,
                py: 1.2,
                boxShadow: "none",
                "&:hover": {
                  bgcolor: "#DC2626",
                  boxShadow: "0 4px 14px 0 rgba(239, 68, 68, 0.3)",
                  transform: "translateY(-1px)",
                },
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              {lang?.logoutBtn || "Logout"}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Logout;
