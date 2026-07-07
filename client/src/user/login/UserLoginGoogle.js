import React from "react";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { Box, Button, Stack } from "@mui/material";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";

const UserLoginGoogle = ({ hitAxios, data, web, referralCode }) => {
  const history = useHistory();

  async function runLogin(token) {
    const res = await hitAxios({
      path: "/api/user/login_with_google",
      post: true,
      admin: false,
      obj: { token, referral_code: referralCode },
    });
    if (res.data.success) {
      localStorage.setItem(
        process.env.REACT_APP_TOKEN + "_user",
        res.data.token,
      );
      history.push("/user");
      return;
    }
  }

  return (
    web?.google_login_id && (
      <GoogleOAuthProvider clientId={web?.google_login_id}>
        <Stack direction={"column"}>
          <GoogleLogin
            text="continue_with"
            onSuccess={(creds) => {
              console.log(creds);
              if (creds.credential) {
                runLogin(creds.credential);
              } else {
                alert("tulli", JSON.stringify(creds));
              }
            }}
            onError={() => {
              console.log("Login Failed");
            }}
          />
        </Stack>
      </GoogleOAuthProvider>
    )
  );
};

export default UserLoginGoogle;
