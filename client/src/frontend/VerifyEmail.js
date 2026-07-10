import React from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import MarkEmailReadOutlinedIcon from "@mui/icons-material/MarkEmailReadOutlined";
import { useHistory, useLocation } from "react-router-dom";
import { GlobalContext } from "../context/GlobalContext";

const VerifyEmail = () => {
  const { hitAxios } = React.useContext(GlobalContext);
  const history = useHistory();
  const location = useLocation();
  const params = React.useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );
  const token = params.get("token") || "";
  const initialEmail = params.get("email") || "";

  const [email, setEmail] = React.useState(initialEmail);
  const [message, setMessage] = React.useState(
    token
      ? "Verifying your email..."
      : "Please check your inbox and verify your email before logging in.",
  );
  const [verified, setVerified] = React.useState(false);

  React.useEffect(() => {
    if (!token) return;

    async function verify() {
      const res = await hitAxios({
        path: "/api/user/verify_email",
        post: true,
        admin: false,
        obj: { token },
      });
      setVerified(Boolean(res?.data?.success));
      setMessage(
        res?.data?.msg ||
          (res?.data?.success
            ? "Email verified successfully."
            : "Verification failed."),
      );
    }

    verify();
  }, [hitAxios, token]);

  async function resendVerification() {
    const res = await hitAxios({
      path: "/api/user/resend_verification_email",
      post: true,
      admin: false,
      obj: { email },
    });
    setMessage(res?.data?.msg || "If the email exists, a verification link was sent.");
    if (res?.data?.alreadyVerified) setVerified(true);
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 3,
      }}
    >
      <Card sx={{ width: "100%", maxWidth: 460 }}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Stack spacing={2.5} alignItems="center" textAlign="center">
            <MarkEmailReadOutlinedIcon color="primary" sx={{ fontSize: 54 }} />
            <Box>
              <Typography variant="h4" fontWeight={700} gutterBottom>
                Verify your email
              </Typography>
              <Typography color="text.secondary">{message}</Typography>
            </Box>

            {!token && !verified && (
              <TextField
                fullWidth
                type="email"
                label="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            )}

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} width="100%">
              {!token && !verified && (
                <Button
                  fullWidth
                  variant="contained"
                  onClick={resendVerification}
                  disabled={!email}
                >
                  Resend verification email
                </Button>
              )}
              <Button
                fullWidth
                variant={verified ? "contained" : "outlined"}
                onClick={() => history.push("/user/login")}
              >
                Go to login
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default VerifyEmail;
