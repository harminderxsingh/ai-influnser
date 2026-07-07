import React from "react";
import {
  Button,
  Stack,
  TextField,
  Typography,
  InputAdornment,
} from "@mui/material";
import { EmailOutlined, Send } from "@mui/icons-material";
import { GlobalContext } from "../../context/GlobalContext";
import { TranslateContext } from "../../context/TranslateContext";
import CommonDialog from "../../common/CommonDialog";
import { ForwardToInbox } from "@mui/icons-material";

const ForgetPassAdmin = () => {
  const { lang } = React.useContext(TranslateContext);
  const { hitAxios } = React.useContext(GlobalContext);

  const [state, setState] = React.useState({
    dialog: false,
    email: "",
  });

  async function sendRecovery() {
    const res = await hitAxios({
      path: "/api/admin/send_recovery_email",
      post: true,
      admin: false,
      obj: { email: state.email },
    });
    if (res?.data?.success) {
      setState({ ...state, dialog: false, email: "" });
    }
  }

  return (
    <div>
      <Stack mt={1} alignItems={"flex-end"}>
        <Typography
          onClick={() => setState({ ...state, dialog: true })}
          sx={{ cursor: "pointer" }}
          variant="caption"
        >
          {lang?.forgotPass || "Forgot password?"}
        </Typography>
      </Stack>

      <CommonDialog
        open={state.dialog}
        onClose={() => setState({ ...state, dialog: false })}
        title={lang?.sendARecoveryLink || "Send recovery link"}
        icon={ForwardToInbox}
        maxWidth="sm"
      >
        <Stack mt={3} direction={"column"} spacing={2}>
          <TextField
            value={state.email}
            onChange={(e) => setState({ ...state, email: e.target.value })}
            label={lang?.adminEmail || "Admin Email"}
            type="email"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailOutlined fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
          />
          <Button
            onClick={sendRecovery}
            startIcon={<Send />}
            variant="contained"
            disabled={!state.email}
          >
            {lang?.send || "Send"}
          </Button>
        </Stack>
      </CommonDialog>
    </div>
  );
};

export default ForgetPassAdmin;
