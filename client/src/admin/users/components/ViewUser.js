import { Group, Visibility, Save, Cancel } from "@mui/icons-material";
import {
  Container,
  IconButton,
  Tooltip,
  Box,
  Grid,
  Typography,
  Chip,
  Divider,
  TextField,
  Button,
  Avatar,
  Stack,
  alpha,
  useTheme,
} from "@mui/material";
import React from "react";
import CommonDialog from "../../../common/CommonDialog";
import moment from "moment";

const ViewUser = ({ lang, params, hitAxios, hangleGetUsers }) => {
  const theme = useTheme();
  const [state, setState] = React.useState({
    dialog: false,
    formData: {
      name: "",
      email: "",
      password: "",
      newPassword: "",
      uid: "",
    },
  });

  React.useEffect(() => {
    if (params?.row) {
      setState((prev) => ({
        ...prev,
        formData: {
          name: params.row.name || "",
          email: params.row.email || "",
          uid: params.row.uid || "",
          password: "",
        },
      }));
    }
  }, [params]);

  const handleCancel = () => {
    setState({
      ...state,
      dialog: false,
      formData: {
        name: params.row.name || "",
        email: params.row.email || "",
        password: "",
      },
    });
  };

  const handleSave = async () => {
    const res = await hitAxios({
      path: "/api/admin/update_user",
      post: true,
      admin: true,
      obj: state?.formData,
    });
    if (res.data.success) {
      hangleGetUsers();
    }
  };

  const handleChange = (field, value) => {
    setState({
      ...state,
      formData: {
        ...state.formData,
        [field]: value,
      },
    });
  };

  const InfoCard = ({ label, value, color = "primary" }) => (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        bgcolor: alpha(theme.palette[color].main, 0.08),
        border: `1px solid ${alpha(theme.palette[color].main, 0.2)}`,
      }}
    >
      <Typography
        variant="caption"
        sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}
      >
        {label}
      </Typography>
      <Typography
        variant="h6"
        sx={{ color: theme.palette.text.primary, fontWeight: 600, mt: 0.5 }}
      >
        {value}
      </Typography>
    </Box>
  );

  return (
    <div>
      <Tooltip title={lang.view || "View"}>
        <IconButton
          size="small"
          color="primary"
          onClick={(event) => setState({ ...state, dialog: true })}
        >
          <Visibility fontSize="small" />
        </IconButton>
      </Tooltip>

      <CommonDialog
        open={state.dialog}
        onClose={handleCancel}
        title={lang.editUser || "Edit User"}
        icon={Group}
      >
        <Container maxWidth="lg" sx={{ py: 2 }}>
          {/* Header Section */}
          <Box
            sx={{
              mb: 3,
              p: 2,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    bgcolor: theme.palette.primary.main,
                    fontSize: 32,
                    fontWeight: 600,
                  }}
                >
                  {params?.row?.name
                    ? params.row.name.charAt(0).toUpperCase()
                    : params?.row?.email?.charAt(0).toUpperCase() || "U"}
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight={600}>
                    {params?.row?.name || lang.noName || "No Name"}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.5 }}
                  >
                    {params?.row?.email || "N/A"}
                  </Typography>
                  <Box sx={{ mt: 1, display: "flex", gap: 1 }}>
                    <Chip
                      label={params?.row?.status || "active"}
                      size="small"
                      color={
                        params?.row?.status === "active" ? "success" : "error"
                      }
                    />
                    <Chip
                      label={params?.row?.role || "user"}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </Box>
              </Box>

              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  startIcon={<Cancel />}
                  onClick={handleCancel}
                  sx={{ borderRadius: 2 }}
                >
                  {lang.cancel || "Cancel"}
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Save />}
                  onClick={handleSave}
                  sx={{ borderRadius: 2 }}
                >
                  {lang.save || "Save"}
                </Button>
              </Stack>
            </Box>
          </Box>

          {/* Edit Form - Always Visible */}
          <Box
            sx={{
              mb: 3,
              p: 3,
              borderRadius: 2,
              bgcolor: theme.palette.action.hover,
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              {lang.editInfo || "Edit Information"}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={lang.name || "Name"}
                  value={state.formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={lang.email || "Email"}
                  type="email"
                  value={state.formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={lang.newPassword || "New Password"}
                  type="password"
                  value={state.formData?.newPassword}
                  onChange={(e) => handleChange("newPassword", e.target.value)}
                  placeholder={
                    lang.leaveBlank || "Leave blank to keep current password"
                  }
                  variant="outlined"
                  helperText={
                    lang.passwordHelper ||
                    "Leave blank if you don't want to change password"
                  }
                />
              </Grid>
            </Grid>
          </Box>

          {/* Details Section */}
          <Box
            sx={{
              p: 3,
              borderRadius: 2,
              bgcolor: theme.palette.action.hover,
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              {lang.accountDetails || "Account Details"}
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={500}
                  >
                    {lang.email || "Email"}
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 0.5 }}>
                    {params?.row?.email || "N/A"}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={500}
                  >
                    {lang.role || "Role"}
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 0.5 }}>
                    {params?.row?.role || "user"}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={500}
                  >
                    {lang.status || "Status"}
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 0.5 }}>
                    {params?.row?.status || "active"}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={500}
                  >
                    {lang.createdAt || "Created At"}
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 0.5 }}>
                    {params?.row?.createdAt
                      ? moment(params.row.createdAt).format(
                          "DD MMM YYYY, hh:mm A",
                        )
                      : "N/A"}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={500}
                  >
                    {lang.lastLogin || "Last Login"}
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 0.5 }}>
                    {params?.row?.last_login
                      ? moment(params.row.last_login).format(
                          "DD MMM YYYY, hh:mm A",
                        )
                      : lang.never || "Never"}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={500}
                  >
                    {lang.planEnding || "Plan Ending"}
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 0.5 }}>
                    {params?.row?.plan_ending
                      ? moment(params.row.plan_ending).format("DD MMM YYYY")
                      : lang.na || "N/A"}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Container>
      </CommonDialog>
    </div>
  );
};

export default ViewUser;
