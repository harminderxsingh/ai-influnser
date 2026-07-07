import { Button, Stack, TextField, Typography } from "@mui/material";
import React from "react";
import CommonDialog from "../../common/CommonDialog";
import { ForwardToInbox, Send } from "@mui/icons-material";
import { GlobalContext } from "../../context/GlobalContext";

const ForgotPassword = ({ lang }) => {
  const { hitAxios } = React.useContext(GlobalContext);
  const [state, setState] = React.useState({
    dialog: false,
    email: "",
  });

  async function sendRecovery() {
    const res = await hitAxios({
      path: "/api/user/send_recovery_email",
      post: true,
      admin: false,
      obj: {
        email: state.email,
      },
    });
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
            onChange={(e) => setState({ ...state, email: e.target.value })}
            label={lang?.email || "Email"}
          />
          <Button
            onClick={sendRecovery}
            startIcon={<Send />}
            variant="contained"
          >
            {lang?.send || "Send"}
          </Button>
        </Stack>
      </CommonDialog>
    </div>
  );
};

export default ForgotPassword;
