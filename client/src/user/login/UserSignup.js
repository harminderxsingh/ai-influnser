import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  Stack,
  Grid,
} from "@mui/material";
import {
  EmailOutlined,
  Visibility,
  VisibilityOff,
  LockOutlined,
  PersonOutline,
  BadgeOutlined,
} from "@mui/icons-material";
import { GlobalContext } from "../../context/GlobalContext";
import { useHistory } from "react-router-dom/cjs/react-router-dom";
import AuthLayout from "./AuthLayout";

const UserSignup = () => {
  const history = useHistory();
  const { hitAxios } = React.useContext(GlobalContext);
  const [showPassword, setShowPassword] = useState(false);
  const [state, setState] = React.useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    referral_code: "",
  });

  React.useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    const storedRef = localStorage.getItem("referral_code");
    const referral_code = (ref || storedRef || "").trim().toUpperCase();
    if (referral_code) {
      localStorage.setItem("referral_code", referral_code);
      setState((prev) => ({ ...prev, referral_code }));
    }
  }, []);

  const set = (key, value) => setState((prev) => ({ ...prev, [key]: value }));

  async function handleSignup() {
    const res = await hitAxios({
      path: "/api/user/signup",
      admin: false,
      post: true,
      obj: state,
    });

    if (res?.data?.needsLogin) {
      history.push("/user/login");
      return;
    }

    if (res?.data?.emailVerificationRequired) {
      const verifyEmail = res.data.email || state.email;
      history.push(`/verify-email?email=${encodeURIComponent(verifyEmail)}`);
      return;
    }

    if (res?.data?.success && res.data.token) {
      localStorage.setItem(
        process.env.REACT_APP_TOKEN + "_user",
        res.data.token,
      );
      history.push("/user");
    }
  }

  return (
    <AuthLayout>
      {({ siteName, lang, web }) => (
        <>
          <Box mb={4}>
            <Typography
              variant="h4"
              color="text.primary"
              fontWeight={400}
              fontSize={{ xs: "1.75rem", md: "2.125rem" }}
              gutterBottom
            >
              {lang?.createAccount || "Create your account"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {lang?.signupTo || "Sign up to get started with"}{" "}
              <Box
                component="span"
                sx={{ color: "primary.main", fontWeight: 600 }}
              >
                {siteName}
              </Box>
            </Typography>
          </Box>

          <Stack spacing={2.5}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  value={state.first_name}
                  onChange={(e) => set("first_name", e.target.value)}
                  fullWidth
                  placeholder={lang?.firstName || "First name"}
                  onKeyDown={(e) => e.key === "Enter" && handleSignup()}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonOutline fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  value={state.last_name}
                  onChange={(e) => set("last_name", e.target.value)}
                  fullWidth
                  placeholder={lang?.lastName || "Last name"}
                  onKeyDown={(e) => e.key === "Enter" && handleSignup()}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BadgeOutlined fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>

            <TextField
              value={state.email}
              onChange={(e) => set("email", e.target.value)}
              fullWidth
              placeholder={lang?.email || "Email"}
              type="email"
              onKeyDown={(e) => e.key === "Enter" && handleSignup()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailOutlined fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              value={state.password}
              onChange={(e) => set("password", e.target.value)}
              fullWidth
              placeholder={lang?.password || "Password"}
              type={showPassword ? "text" : "password"}
              onKeyDown={(e) => e.key === "Enter" && handleSignup()}
              helperText={
                lang?.passwordMinHint || "At least 6 characters"
              }
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlined fontSize="small" color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      size="small"
                    >
                      {showPassword ? (
                        <VisibilityOff fontSize="small" />
                      ) : (
                        <Visibility fontSize="small" />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              value={state.referral_code}
              onChange={(e) => set("referral_code", e.target.value.toUpperCase())}
              fullWidth
              placeholder={lang?.referralCode || "Referral code (optional)"}
              onKeyDown={(e) => e.key === "Enter" && handleSignup()}
              helperText={
                state.referral_code
                  ? lang?.referralCodeApplied ||
                    "Referral code will be applied on signup"
                  : ""
              }
            />

            <Button
              onClick={handleSignup}
              fullWidth
              variant="contained"
              size="large"
              sx={{ py: 1.5, fontWeight: 600 }}
            >
              {lang?.createAccountBtn || "Create account"}
            </Button>
          </Stack>

          <Typography
            variant="body2"
            color="text.secondary"
            textAlign="center"
            mt={3}
          >
            {lang?.alreadyHaveAccount || "Already have an account?"}{" "}
            <Box
              component="span"
              onClick={() => history.push("/user/login")}
              sx={{
                color: "primary.main",
                fontWeight: 600,
                cursor: "pointer",
                "&:hover": { textDecoration: "underline" },
              }}
            >
              {lang?.login || "Login"}
            </Box>
          </Typography>

          <Typography
            variant="caption"
            color="text.secondary"
            textAlign="center"
            display="block"
            mt={4}
            fontSize="0.75rem"
            lineHeight={1.6}
          >
            {lang?.byContinuing || "By continuing, you agree to our"}{" "}
            <Box
              onClick={() => window.open("/terms-and-conditions")}
              component="span"
              sx={{
                color: "primary.main",
                cursor: "pointer",
                "&:hover": { textDecoration: "underline" },
              }}
            >
              {lang?.termsOfService || "Terms of Service"}
            </Box>{" "}
            {lang?.and || "and"}{" "}
            <Box
              onClick={() => window.open("/privacy-policy")}
              component="span"
              sx={{
                color: "primary.main",
                cursor: "pointer",
                "&:hover": { textDecoration: "underline" },
              }}
            >
              {lang?.privacyPolicy || "Privacy Policy"}
            </Box>
          </Typography>
        </>
      )}
    </AuthLayout>
  );
};

export default UserSignup;
