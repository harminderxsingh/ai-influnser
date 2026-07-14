import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  Stack,
} from "@mui/material";
import {
  EmailOutlined,
  Visibility,
  VisibilityOff,
  LockOutlined,
} from "@mui/icons-material";
import { GlobalContext } from "../../context/GlobalContext";
import { useHistory } from "react-router-dom/cjs/react-router-dom";
import ForgotPassword from "./ForgotPassword";
import AuthLayout from "./AuthLayout";

const UserLogin = () => {
  const history = useHistory();
  const { hitAxios } = React.useContext(GlobalContext);
  const [showPassword, setShowPassword] = useState(false);
  const [state, setState] = React.useState({
    email: "",
    password: "",
  });

  async function handleLogin() {
    const res = await hitAxios({
      path: "/api/user/login",
      admin: false,
      post: true,
      obj: state,
    });

    if (res?.data?.needsSignup) {
      history.push("/user/signup");
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
      {({ siteName, lang }) => (
        <>
          <Box mb={4}>
            <Typography
              variant="h4"
              color="text.primary"
              fontWeight={400}
              fontSize={{ xs: "1.75rem", md: "2.125rem" }}
              gutterBottom
            >
              {lang?.welcomeBack || "Welcome back"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {lang?.loginTo || "Sign in to continue to"}{" "}
              <Box
                component="span"
                sx={{ color: "primary.main", fontWeight: 600 }}
              >
                {siteName}
              </Box>
            </Typography>
          </Box>

          <Stack spacing={2.5}>
            <TextField
              value={state.email}
              onChange={(e) => setState({ ...state, email: e.target.value })}
              fullWidth
              placeholder={lang?.email || "Email"}
              type="email"
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
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
              onChange={(e) => setState({ ...state, password: e.target.value })}
              fullWidth
              placeholder={lang?.password || "Password"}
              type={showPassword ? "text" : "password"}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
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

            <Button
              onClick={handleLogin}
              fullWidth
              variant="contained"
              size="large"
              sx={{ py: 1.5, fontWeight: 600 }}
            >
              {lang?.signIn || lang?.login || "Sign in"}
            </Button>
          </Stack>

          <ForgotPassword lang={lang} />

          <Typography
            variant="body2"
            color="text.secondary"
            textAlign="center"
            mt={3}
          >
            {lang?.noAccountYet || "Don't have an account?"}{" "}
            <Box
              component="span"
              onClick={() => history.push("/user/signup")}
              sx={{
                color: "primary.main",
                fontWeight: 600,
                cursor: "pointer",
                "&:hover": { textDecoration: "underline" },
              }}
            >
              {lang?.signUp || "Sign up"}
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

export default UserLogin;
