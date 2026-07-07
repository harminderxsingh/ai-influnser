import React from "react";
import PageHeader from "../../common/PageHeader";
import {
  AddOutlined,
  Paid,
  EditOutlined,
  DeleteOutlined,
  CheckCircle,
  Person,
  AccessTime,
} from "@mui/icons-material";
import {
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
  Box,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Switch,
  FormControlLabel,
  Divider,
  alpha,
  useTheme,
  Stack,
} from "@mui/material";
import CommonDialog from "../../common/CommonDialog";
import { GlobalContext } from "../../context/GlobalContext";

const ManagePlans = ({ lang }) => {
  const { hitAxios } = React.useContext(GlobalContext);
  const theme = useTheme();
  const [state, setState] = React.useState({
    dialog: false,
    editMode: false,
    selectedPlan: null,
    title: "",
    price: "",
    monthly_price: "",
    yearly_price: "",
    recurring_enabled: true,
    default_billing_interval: "monthly",
    price_strike: "",
    credits: "",
    expiry_days: "",
    max_characters: "",
    popular: false,
  });
  const [plans, setPlans] = React.useState([]);

  // Fetch plans on component mount
  React.useEffect(() => {
    fetchPlans();
  }, []);

  async function fetchPlans() {
    const res = await hitAxios({
      path: "/api/plan/get_all",
      admin: true,
    });
    if (res?.data?.success) {
      setPlans(res.data.plans);
      handleCloseDialog();
    }
  }

  const handleOpenDialog = (plan = null) => {
    if (plan) {
      setState({
        dialog: true,
        editMode: true,
        selectedPlan: plan,
        title: plan.title,
        price: plan.price,
        monthly_price: plan.monthly_price || plan.price,
        yearly_price: plan.yearly_price || Number(plan.price || 0) * 12,
        recurring_enabled: plan.recurring_enabled !== 0,
        default_billing_interval: plan.default_billing_interval || "monthly",
        price_strike: plan.price_strike,
        credits: plan.credits,
        expiry_days: plan.expiry_days,
        max_characters: plan.max_characters,
        popular: plan.popular === 1,
      });
    } else {
      setState({
        dialog: true,
        editMode: false,
        selectedPlan: null,
        title: "",
        price: "",
        monthly_price: "",
        yearly_price: "",
        recurring_enabled: true,
        default_billing_interval: "monthly",
        price_strike: "",
        credits: "",
        expiry_days: "",
        max_characters: "",
        popular: false,
      });
    }
  };

  const handleCloseDialog = () => {
    setState({
      dialog: false,
      editMode: false,
      selectedPlan: null,
      title: "",
      price: "",
      monthly_price: "",
      yearly_price: "",
      recurring_enabled: true,
      default_billing_interval: "monthly",
      price_strike: "",
      credits: "",
      expiry_days: "",
      max_characters: "",
      popular: false,
    });
  };

  async function addPlan() {
    const res = await hitAxios({
      path: "/api/plan/add_new",
      post: true,
      admin: true,
      obj: {
        title: state.title,
        price: state.monthly_price || state.price,
        monthly_price: state.monthly_price || state.price,
        yearly_price: state.yearly_price,
        recurring_enabled: state.recurring_enabled,
        default_billing_interval: state.default_billing_interval,
        price_strike: state.price_strike,
        credits: state.credits,
        expiry_days: state.expiry_days,
        max_characters: state.max_characters,
        popular: state.popular,
      },
    });
    if (res?.data?.success) {
      fetchPlans();
    }
  }

  async function editPlan() {
    const res = await hitAxios({
      path: "/api/plan/edit",
      post: true,
      admin: true,
      obj: {
        id: state.selectedPlan.id,
        title: state.title,
        price: state.monthly_price || state.price,
        monthly_price: state.monthly_price || state.price,
        yearly_price: state.yearly_price,
        recurring_enabled: state.recurring_enabled,
        default_billing_interval: state.default_billing_interval,
        price_strike: state.price_strike,
        credits: state.credits,
        expiry_days: state.expiry_days,
        max_characters: state.max_characters,
        popular: state.popular,
      },
    });
    if (res?.data?.success) {
      fetchPlans();
    }
  }

  async function deletePlan(id) {
    if (
      window.confirm(
        lang.confirmDelete || "Are you sure you want to delete this plan?",
      )
    ) {
      const res = await hitAxios({
        path: "/api/plan/delete",
        post: true,
        admin: true,
        obj: { id },
      });
      if (res?.data?.success) {
        fetchPlans();
      }
    }
  }

  return (
    <div>
      <PageHeader
        title={lang.plans || "Plans"}
        subtitle={lang.managePlans || "Manage Plans"}
        icon={Paid}
        primaryAction={
          <Button
            size="large"
            variant="contained"
            startIcon={<AddOutlined />}
            onClick={() => handleOpenDialog()}
          >
            {lang.addNew || "Add New"}
          </Button>
        }
      />

      {/* Plans Grid */}
      <Grid container spacing={3} mt={1}>
        {plans.map((plan) => (
          <Grid item xs={12} sm={6} md={4} key={plan.id}>
            <Box sx={{ position: "relative" }}>
              {/* Popular Badge */}
              {plan.popular === 1 && (
                <Box
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "40px",
                    background: `linear-gradient(90deg, #A78BFA 0%, #EC4899 50%, #F97316 100%)`,
                    borderRadius: "16px 16px 0 0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 1,
                  }}
                >
                  <Typography
                    sx={{
                      color: "white",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      letterSpacing: "0.5px",
                    }}
                  >
                    {lang.mostPopular || "MOST POPULAR"}
                  </Typography>
                </Box>
              )}

              <Card
                sx={{
                  height: "100%",
                  bgcolor: theme.palette.background.paper,
                  border:
                    plan.popular === 1
                      ? "2px solid transparent"
                      : `1px solid ${theme.palette.divider}`,
                  borderRadius: "16px",
                  backgroundImage:
                    plan.popular === 1
                      ? `linear-gradient(${theme.palette.background.paper}, ${theme.palette.background.paper}), linear-gradient(90deg, #A78BFA, #EC4899, #F97316)`
                      : "none",
                  backgroundOrigin: "border-box",
                  backgroundClip:
                    plan.popular === 1
                      ? "padding-box, border-box"
                      : "padding-box",
                  pt: plan.popular === 1 ? "40px" : 0,
                  transition: "transform 0.3s ease, box-shadow 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow:
                      plan.popular === 1
                        ? "0 20px 40px rgba(167, 139, 250, 0.3)"
                        : `0 10px 30px ${alpha(theme.palette.text.primary, 0.1)}`,
                  },
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  {/* Plan Title */}
                  <Typography
                    variant="h5"
                    sx={{
                      color: theme.palette.text.primary,
                      fontWeight: 700,
                      mb: 1,
                    }}
                  >
                    {plan.title}
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.text.secondary,
                      mb: 3,
                      fontSize: "0.875rem",
                    }}
                  >
                    {lang.forCreators || "For creators and solopreneurs"}
                  </Typography>

                  {/* Price Section */}
                  <Box sx={{ mb: 3 }}>
                    <Box display="flex" alignItems="baseline" gap={1}>
                      {plan.price_strike && (
                        <Typography
                          variant="body2"
                          sx={{
                            color: theme.palette.text.disabled,
                            textDecoration: "line-through",
                            fontSize: "1rem",
                          }}
                        >
                          ${plan.price_strike}
                        </Typography>
                      )}
                      <Typography
                        variant="h3"
                        sx={{
                          color: theme.palette.success.main,
                          fontWeight: 700,
                          fontSize: "2.5rem",
                        }}
                      >
                        ${plan.price}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: theme.palette.text.secondary,
                          fontSize: "0.875rem",
                        }}
                      >
                        {lang.perMonth || "/mo"}
                      </Typography>
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: theme.palette.text.secondary,
                        fontSize: "0.75rem",
                        mt: 0.5,
                        display: "block",
                      }}
                    >
                      {lang.billedYearly || "Billed yearly, cancel anytime"}
                    </Typography>
                  </Box>

                  {/* Get Started Button */}
                  {/* <Button
                    fullWidth
                    variant={plan.popular === 1 ? "contained" : "outlined"}
                    sx={{
                      py: 1.5,
                      mb: 3,
                      fontWeight: 600,
                      fontSize: "0.9rem",
                      borderRadius: "8px",
                      textTransform: "none",
                      ...(plan.popular !== 1 && {
                        borderColor: theme.palette.divider,
                        color: theme.palette.text.primary,
                        "&:hover": {
                          borderColor: theme.palette.primary.main,
                          bgcolor: alpha(theme.palette.primary.main, 0.05),
                        },
                      }),
                    }}
                  >
                    {lang.getStarted || "Get Started"}
                  </Button> */}

                  {/* Includes Section */}
                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.text.primary,
                      fontWeight: 700,
                      mb: 2,
                      fontSize: "0.875rem",
                    }}
                  >
                    {lang.includes || "Includes:"}
                  </Typography>

                  <Box
                    sx={{
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                      borderRadius: "8px",
                      p: 2,
                      mb: 3,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.text.secondary,
                        fontSize: "0.875rem",
                      }}
                    >
                      ≈ {plan.credits} {lang.credits || "credits"}
                    </Typography>
                  </Box>

                  {/* Benefits Section */}
                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.text.primary,
                      fontWeight: 700,
                      mb: 2,
                      fontSize: "0.875rem",
                    }}
                  >
                    {lang.benefits || "Benefits:"}
                  </Typography>

                  <Stack spacing={1.5} mb={3}>
                    <Box display="flex" alignItems="flex-start" gap={1.5}>
                      <CheckCircle
                        sx={{
                          fontSize: 18,
                          mt: 0.2,
                          flexShrink: 0,
                        }}
                      />
                      <Typography
                        variant="body2"
                        sx={{
                          color: theme.palette.text.secondary,
                          fontSize: "0.875rem",
                          lineHeight: 1.6,
                        }}
                      >
                        {plan.max_characters}{" "}
                        {lang.maxCharacters || "Max Characters"}
                      </Typography>
                    </Box>

                    <Box display="flex" alignItems="flex-start" gap={1.5}>
                      <CheckCircle
                        sx={{
                          fontSize: 18,
                          mt: 0.2,
                          flexShrink: 0,
                        }}
                      />
                      <Typography
                        variant="body2"
                        sx={{
                          color: theme.palette.text.secondary,
                          fontSize: "0.875rem",
                          lineHeight: 1.6,
                        }}
                      >
                        {lang.validFor || "Valid for"} {plan.expiry_days}{" "}
                        {lang.days || "days"}
                      </Typography>
                    </Box>

                    <Box display="flex" alignItems="flex-start" gap={1.5}>
                      <CheckCircle
                        sx={{
                          fontSize: 18,
                          mt: 0.2,
                          flexShrink: 0,
                        }}
                      />
                      <Typography
                        variant="body2"
                        sx={{
                          color: theme.palette.text.secondary,
                          fontSize: "0.875rem",
                          lineHeight: 1.6,
                        }}
                      >
                        {lang.allCreationTools || "All Creation Tools"}
                      </Typography>
                    </Box>
                  </Stack>

                  <Divider sx={{ mb: 2 }} />

                  {/* Admin Actions */}
                  <Box display="flex" gap={1}>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(plan)}
                      sx={{
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        color: theme.palette.primary.main,
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                        "&:hover": {
                          bgcolor: alpha(theme.palette.primary.main, 0.2),
                        },
                      }}
                    >
                      <EditOutlined fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => deletePlan(plan.id)}
                      sx={{
                        bgcolor: alpha(theme.palette.error.main, 0.1),
                        color: theme.palette.error.main,
                        border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                        "&:hover": {
                          bgcolor: alpha(theme.palette.error.main, 0.2),
                        },
                      }}
                    >
                      <DeleteOutlined fontSize="small" />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* Add/Edit Dialog */}
      <CommonDialog
        open={state.dialog}
        onClose={handleCloseDialog}
        title={
          state.editMode
            ? lang.editPlan || "Edit Plan"
            : lang.addNewPlan || "Add New Plan"
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
                label={lang.planTitle || "Plan Title"}
                placeholder={
                  lang.planTitlePlaceholder || "e.g., Starter, Pro, Enterprise"
                }
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                value={state.monthly_price}
                onChange={(e) =>
                  setState({
                    ...state,
                    price: e.target.value,
                    monthly_price: e.target.value,
                  })
                }
                fullWidth
                label={lang.monthlyPrice || "Monthly Price"}
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
                value={state.yearly_price}
                onChange={(e) =>
                  setState({ ...state, yearly_price: e.target.value })
                }
                fullWidth
                label={lang.yearlyPrice || "Yearly Price"}
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
                value={state.price_strike}
                onChange={(e) =>
                  setState({ ...state, price_strike: e.target.value })
                }
                fullWidth
                label={lang.strikePrice || "Strike Price"}
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
                label={lang.credits || "Credits"}
                type="number"
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                value={state.expiry_days}
                onChange={(e) =>
                  setState({ ...state, expiry_days: e.target.value })
                }
                fullWidth
                label={lang.expiryDays || "Expiry (Days)"}
                type="number"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                value={state.max_characters}
                onChange={(e) =>
                  setState({ ...state, max_characters: e.target.value })
                }
                fullWidth
                label={lang.maxCharacters || "Max Characters"}
                type="number"
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={state.recurring_enabled}
                    onChange={(e) =>
                      setState({
                        ...state,
                        recurring_enabled: e.target.checked,
                      })
                    }
                  />
                }
                label={lang.recurringEnabled || "Enable Recurring Subscription"}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={state.popular}
                    onChange={(e) =>
                      setState({ ...state, popular: e.target.checked })
                    }
                  />
                }
                label={lang.markAsPopular || "Mark as Popular"}
              />
            </Grid>

            <Grid item xs={12}>
              <Box display="flex" gap={2} justifyContent="flex-end" mt={2}>
                <Button variant="outlined" onClick={handleCloseDialog}>
                  {lang.cancel || "Cancel"}
                </Button>
                <Button
                  onClick={() => {
                    if (state.editMode) {
                      editPlan();
                    } else {
                      addPlan();
                    }
                  }}
                  variant="contained"
                  startIcon={
                    state.editMode ? <EditOutlined /> : <AddOutlined />
                  }
                >
                  {state.editMode
                    ? lang.update || "Update"
                    : lang.create || "Create"}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </CommonDialog>
    </div>
  );
};

export default ManagePlans;
