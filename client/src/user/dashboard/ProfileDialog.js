import {
  AccountCircle,
  Logout,
  PersonOutlined,
  Save,
} from "@mui/icons-material";
import {
  Box,
  Button,
  LinearProgress,
  ListItemIcon,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";
import React from "react";
import CommonDialog from "../../common/CommonDialog";
import { UserContext } from "../../context/UserContext";
import { GlobalContext } from "../../context/GlobalContext";

const ProfileDialog = ({ lang }) => {
  const { hitAxios } = React.useContext(GlobalContext);
  const { getUserData, userData, setUserData } = React.useContext(UserContext);
  const [state, setState] = React.useState({
    dialog: false,
  });

  async function handleUpdate(params) {
    const res = await hitAxios({
      path: "/api/user/update_profile",
      post: true,
      admin: false,
      obj: userData,
    });
    if (res.data.success) {
      getUserData();
    }
  }

  return (
    <div>
      <MenuItem onClick={() => setState({ ...state, dialog: true })}>
        <ListItemIcon>
          <PersonOutlined sx={{ fontSize: 16 }} />
        </ListItemIcon>
        {lang?.profileSettings || "Profile Settings"}
      </MenuItem>

      <CommonDialog
        maxWidth="sm"
        open={state.dialog}
        onClose={() => setState({ ...state, dialog: false })}
        icon={AccountCircle}
        title={lang?.profileSettings || "Profile Settings"}
      >
        {userData?.id ? (
          <Box mt={3}>
            <Stack direction={"column"} spacing={2}>
              <TextField
                value={userData?.name}
                onChange={(e) =>
                  setUserData({ ...userData, name: e.target.value })
                }
                label={lang?.name || "Name"}
              />
              <TextField
                value={userData?.email}
                onChange={(e) =>
                  setUserData({ ...userData, email: e.target.value })
                }
                label={lang?.email || "Email"}
              />
              <TextField
                onChange={(e) =>
                  setUserData({ ...userData, newPassword: e.target.value })
                }
                label={lang?.passwordPlaceholder || "Password"}
                helperText={
                  lang?.passwordHelper ||
                  "Leave blank if you don't want to change password"
                }
              />

              <Button
                onClick={handleUpdate}
                startIcon={<Save />}
                variant="contained"
              >
                {lang?.save || "Save"}
              </Button>
            </Stack>
          </Box>
        ) : (
          <Box mt={2}>
            <LinearProgress />
          </Box>
        )}
      </CommonDialog>
    </div>
  );
};

export default ProfileDialog;
