import { Check, CreditScore } from "@mui/icons-material";
import { Box, Button, TextField, Typography } from "@mui/material";
import React from "react";
import CommonDialog from "../../../common/CommonDialog";

const UpdateCredit = ({ params, lang, hitAxios, hangleGetUsers }) => {
  const [dialog, setDialog] = React.useState(false);
  const [value, setValue] = React.useState(params.value);

  const handleSave = async () => {
    const res = await hitAxios({
      path: "/api/admin/update_user_credits",
      post: true,
      admin: true,
      obj: { credits: value, uid: params?.row?.uid },
    });
    if (res.data.success) {
      hangleGetUsers();
      setDialog(false);
    }
  };

  React.useEffect(() => {
    setValue(params?.value);
  }, [params?.value]);

  return (
    <div>
      <Box
        onClick={() => setDialog(true)}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          cursor: "pointer",
        }}
      >
        <Typography variant="body2" fontWeight={600} color="primary">
          {params.value}
        </Typography>
        <CreditScore sx={{ fontSize: 13, color: "text.disabled" }} />
      </Box>

      <CommonDialog
        open={dialog}
        onClose={() => setDialog(false)}
        title={lang?.updateCredits || "Update Credits"}
        icon={CreditScore}
        maxWidth="xs"
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 3,
            pt: 1,
            pb: 2,
          }}
        >
          <Box>
            <Typography variant="caption" color="text.secondary">
              {lang?.updatingFor || "Updating credits for"}
            </Typography>
            <Typography variant="body1" fontWeight={600}>
              {params?.row?.name || params?.row?.email}
            </Typography>
          </Box>

          <TextField
            fullWidth
            autoFocus
            type="number"
            label={lang?.credits || "Credits"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            variant="outlined"
          />

          <Button
            fullWidth
            variant="contained"
            startIcon={<Check />}
            onClick={handleSave}
          >
            {lang?.save || "Save"}
          </Button>
        </Box>
      </CommonDialog>
    </div>
  );
};

export default UpdateCredit;
