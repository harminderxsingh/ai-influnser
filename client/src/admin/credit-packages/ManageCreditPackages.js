import React from "react";
import PageHeader from "../../common/PageHeader";
import CommonDialog from "../../common/CommonDialog";
import { GlobalContext } from "../../context/GlobalContext";
import {
  AddOutlined,
  CheckCircle,
  DeleteOutlined,
  EditOutlined,
  TokenOutlined,
} from "@mui/icons-material";
import {
  alpha,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  Stack,
  Switch,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";

const emptyState = {
  dialog: false,
  editMode: false,
  selectedPackage: null,
  title: "",
  price: "",
  credits: "",
  popular: false,
  status: "active",
};

const ManageCreditPackages = ({ lang }) => {
  const { hitAxios } = React.useContext(GlobalContext);
  const theme = useTheme();
  const [state, setState] = React.useState(emptyState);
  const [packages, setPackages] = React.useState([]);

  const fetchPackages = React.useCallback(async () => {
    const res = await hitAxios({
      path: "/api/credit-package/admin/get_all",
      admin: true,
    });
    if (res?.data?.success) {
      setPackages(res.data.data || []);
      setState(emptyState);
    }
  }, [hitAxios]);

  React.useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  function handleOpenDialog(creditPackage = null) {
    if (creditPackage) {
      setState({
        dialog: true,
        editMode: true,
        selectedPackage: creditPackage,
        title: creditPackage.title || "",
        price: creditPackage.price || "",
        credits: creditPackage.credits || "",
        popular: creditPackage.popular === 1,
        status: creditPackage.status || "active",
      });
      return;
    }
    setState({ ...emptyState, dialog: true });
  }

  function handleCloseDialog() {
    setState(emptyState);
  }

  function payload() {
    return {
      title: state.title,
      price: state.price,
      credits: state.credits,
      popular: state.popular,
      status: state.status,
    };
  }

  async function savePackage() {
    const res = await hitAxios({
      path: state.editMode
        ? "/api/credit-package/edit"
        : "/api/credit-package/add_new",
      post: true,
      admin: true,
      obj: {
        ...(state.editMode ? { id: state.selectedPackage.id } : {}),
        ...payload(),
      },
    });
    if (res?.data?.success) fetchPackages();
  }

  async function deletePackage(id) {
    if (
      !window.confirm(
        lang?.confirmDelete || "Are you sure you want to delete this package?",
      )
    ) {
      return;
    }
    const res = await hitAxios({
      path: "/api/credit-package/delete",
      post: true,
      admin: true,
      obj: { id },
    });
    if (res?.data?.success) fetchPackages();
  }

  return (
    <div>
      <PageHeader
        title={lang?.creditPackages || "Credit Packages"}
        subtitle={
          lang?.manageCreditPackages ||
          "Create credit top-up packages users can purchase"
        }
        icon={TokenOutlined}
        primaryAction={
          <Button
            size="large"
            variant="contained"
            startIcon={<AddOutlined />}
            onClick={() => handleOpenDialog()}
          >
            {lang?.addNew || "Add New"}
          </Button>
        }
      />

      <Grid container spacing={3} mt={1}>
        {packages.map((creditPackage) => (
          <Grid item xs={12} sm={6} md={4} key={creditPackage.id}>
            <Card
              sx={{
                height: "100%",
                borderRadius: 3,
                border:
                  creditPackage.popular === 1
                    ? `2px solid ${theme.palette.primary.main}`
                    : `1px solid ${theme.palette.divider}`,
                bgcolor: "background.paper",
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" justifyContent="space-between" gap={1}>
                  <Typography variant="h6" fontWeight={700}>
                    {creditPackage.title}
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    {creditPackage.popular === 1 && (
                      <Chip size="small" color="primary" label="Popular" />
                    )}
                    <Chip
                      size="small"
                      color={
                        creditPackage.status === "active"
                          ? "success"
                          : "default"
                      }
                      label={creditPackage.status || "active"}
                    />
                  </Stack>
                </Stack>

                <Box mt={3}>
                  <Typography variant="h3" color="success.main" fontWeight={800}>
                    ${parseFloat(creditPackage.price || 0).toFixed(2)}
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    one-time credit top-up
                  </Typography>
                </Box>

                <Box
                  mt={3}
                  p={2}
                  borderRadius={2}
                  bgcolor={alpha(theme.palette.primary.main, 0.08)}
                  border={`1px solid ${alpha(theme.palette.primary.main, 0.16)}`}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <CheckCircle color="primary" fontSize="small" />
                    <Typography fontWeight={700}>
                      {Number(creditPackage.credits || 0).toLocaleString()}{" "}
                      {lang?.credits || "credits"}
                    </Typography>
                  </Stack>
                </Box>

                <Stack direction="row" spacing={1} mt={3}>
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(creditPackage)}
                    sx={{
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: "primary.main",
                    }}
                  >
                    <EditOutlined fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => deletePackage(creditPackage.id)}
                    sx={{
                      bgcolor: alpha(theme.palette.error.main, 0.1),
                      color: "error.main",
                    }}
                  >
                    <DeleteOutlined fontSize="small" />
                  </IconButton>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <CommonDialog
        open={state.dialog}
        onClose={handleCloseDialog}
        title={
          state.editMode
            ? lang?.editCreditPackage || "Edit Credit Package"
            : lang?.addCreditPackage || "Add Credit Package"
        }
        icon={state.editMode ? EditOutlined : AddOutlined}
        maxWidth="sm"
        fullWidth
      >
        <Box p={3}>
          <Grid container spacing={2.5}>
            <Grid item xs={12}>
              <TextField
                value={state.title}
                onChange={(e) => setState({ ...state, title: e.target.value })}
                fullWidth
                label={lang?.packageTitle || "Package Title"}
                placeholder="e.g., Starter Credits"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                value={state.price}
                onChange={(e) => setState({ ...state, price: e.target.value })}
                fullWidth
                label={lang?.price || "Price"}
                type="number"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">$</InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                value={state.credits}
                onChange={(e) =>
                  setState({ ...state, credits: e.target.value })
                }
                fullWidth
                label={lang?.credits || "Credits"}
                type="number"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={state.popular}
                    onChange={(e) =>
                      setState({ ...state, popular: e.target.checked })
                    }
                  />
                }
                label={lang?.markAsPopular || "Mark as Popular"}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={state.status === "active"}
                    onChange={(e) =>
                      setState({
                        ...state,
                        status: e.target.checked ? "active" : "inactive",
                      })
                    }
                  />
                }
                label={lang?.active || "Active"}
              />
            </Grid>
            <Grid item xs={12}>
              <Box display="flex" gap={2} justifyContent="flex-end" mt={2}>
                <Button variant="outlined" onClick={handleCloseDialog}>
                  {lang?.cancel || "Cancel"}
                </Button>
                <Button
                  onClick={savePackage}
                  variant="contained"
                  startIcon={state.editMode ? <EditOutlined /> : <AddOutlined />}
                >
                  {state.editMode ? lang?.update || "Update" : lang?.create || "Create"}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </CommonDialog>
    </div>
  );
};

export default ManageCreditPackages;
