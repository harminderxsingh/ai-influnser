import {
  Avatar,
  Box,
  Button,
  LinearProgress,
  Stack,
  TextField,
} from "@mui/material";
import React from "react";
import { GlobalContext } from "../../context/GlobalContext";
import CommonDialog from "../../common/CommonDialog";
import { AccountCircle, Logout, Save } from "@mui/icons-material";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";

const ProfileDialog = ({ lang }) => {
  const history = useHistory();
  const [state, setState] = React.useState({
    dialog: false,
  });
  const [profile, setProfile] = React.useState({});
  const { hitAxios } = React.useContext(GlobalContext);

  async function handleLogout(params) {
    if (window.confirm(lang.aus)) {
      localStorage.removeItem(process.env.REACT_APP_TOKEN + "_admin");
      history.push("/admin");
    }
  }

  async function getMe(params) {
    const res = await hitAxios({
      path: "/api/admin/get_me",
      post: false,
      admin: true,
    });
    if (res.data.success) {
      setProfile(res.data.data);
    }
  }

  async function updateProfile(params) {
    const res = await hitAxios({
      path: "/api/admin/update_me",
      post: true,
      admin: true,
      obj: profile,
    });
    if (res.data.success) {
      getMe();
    }
  }

  React.useEffect(() => {
    getMe();
  }, []);

  return (
    <div>
      <Avatar
        onClick={() => setState({ ...state, dialog: true })}
        sx={{
          width: 34,
          height: 34,
          bgcolor: "primary.main",
          fontSize: "0.8rem",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        {profile?.email?.charAt(0)?.toUpperCase()}
      </Avatar>

      <CommonDialog
        maxWidth="sm"
        title={lang?.profileSettings}
        open={state.dialog}
        onClose={() => setState({ ...state, dialog: false })}
        icon={AccountCircle}
      >
        <Box mt={3}>
          {profile?.id ? (
            <Stack direction={"column"} spacing={2}>
              <TextField
                onChange={(e) =>
                  setProfile({ ...profile, email: e.target.value })
                }
                value={profile?.email}
                label={lang.email || "Email"}
              />
              <TextField
                onChange={(e) =>
                  setProfile({ ...profile, newPassword: e.target.value })
                }
                value={profile?.newPassword}
                helperText={
                  lang?.passwordHelper ||
                  "Leave blank if you don't want to change password"
                }
                label={lang.passwordPlaceholder || "Password"}
              />

              <Button
                onClick={updateProfile}
                startIcon={<Save />}
                variant="contained"
              >
                {lang.save || "Save"}
              </Button>

              <Button
                sx={{
                  bgcolor: (t) => t.palette.error.main,
                }}
                onClick={handleLogout}
                startIcon={<Logout />}
                variant="contained"
              >
                {lang?.logout || "Logout?"}
              </Button>
            </Stack>
          ) : (
            <LinearProgress />
          )}
        </Box>
      </CommonDialog>
    </div>
  );
};

export default ProfileDialog;
