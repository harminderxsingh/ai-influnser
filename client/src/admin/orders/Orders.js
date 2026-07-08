import React from "react";
import PageHeader from "../../common/PageHeader";
import {
  Paid,
  DeleteOutline,
  SearchOutlined,
  FilterListOutlined,
} from "@mui/icons-material";
import {
  Box,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { GlobalContext } from "../../context/GlobalContext";

// ── gateway chip colors ───────────────────────────────────────────────────────
const GATEWAY_COLOR = {
  stripe: "info",
  paypal: "primary",
  razorpay: "secondary",
  paystack: "success",
  mercadopago: "warning",
  free_trial: "default",
};

const GATEWAY_LABEL = {
  stripe: "Stripe",
  paypal: "PayPal",
  razorpay: "Razorpay",
  paystack: "Paystack",
  mercadopago: "Mercado Pago",
  free_trial: "Free Trial",
};

const Orders = ({ lang }) => {
  const { hitAxios } = React.useContext(GlobalContext);
  const theme = useTheme();

  const [orders, setOrders] = React.useState([]);
  const [search, setSearch] = React.useState("");
  const [gatewayFilter, setGatewayFilter] = React.useState("all");
  const [deleteId, setDeleteId] = React.useState(null);
  const [deleting, setDeleting] = React.useState(false);

  // ── fetch orders ──────────────────────────────────────────────────────────
  const fetchOrders = React.useCallback(async () => {
    const res = await hitAxios({
      path: "/api/payment/orders",
      admin: true,
      post: false,
    });
    if (res?.data?.success) setOrders(res.data.data);
  }, []);

  React.useEffect(() => {
    fetchOrders();
  }, []);

  // ── delete order ──────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setDeleting(true);
    const res = await hitAxios({
      path: `/api/payment/orders/${deleteId}`,
      admin: true,
      post: false,
      method: "DELETE",
    });
    setDeleting(false);
    if (res?.data?.success) {
      setOrders((prev) => prev.filter((o) => o.id !== deleteId));
      setDeleteId(null);
    }
  };

  // ── filter ────────────────────────────────────────────────────────────────
  const filtered = orders.filter((o) => {
    const matchGateway = gatewayFilter === "all" || o.gateway === gatewayFilter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      o.user_email?.toLowerCase().includes(q) ||
      o.user_name?.toLowerCase().includes(q) ||
      o.plan_title?.toLowerCase().includes(q) ||
      o.package_title?.toLowerCase().includes(q) ||
      String(o.id).includes(q);
    return matchGateway && matchSearch;
  });

  // ── stats ─────────────────────────────────────────────────────────────────
  const totalRevenue = orders
    .filter((o) => o.status === "paid" && o.gateway !== "free_trial")
    .reduce((sum, o) => sum + parseFloat(o.amount || 0), 0);

  const stats = [
    {
      label: lang?.totalOrders || "Total Orders",
      value: orders.length,
      color: "primary",
    },
    {
      label: lang?.paidOrders || "Paid Orders",
      value: orders.filter((o) => o.status === "paid").length,
      color: "success",
    },
    {
      label: lang?.freeTrials || "Free Trials",
      value: orders.filter((o) => o.gateway === "free_trial").length,
      color: "default",
    },
    {
      label: lang?.totalRevenue || "Total Revenue",
      value: `$${totalRevenue.toFixed(2)}`,
      color: "info",
    },
  ];

  return (
    <Box>
      <PageHeader
        title={lang?.orders || "Orders"}
        subtitle={lang?.ordersSub || "View and manage payment orders"}
        icon={Paid}
        primaryAction={null}
      />

      {/* ── STATS ROW ── */}
      <Stack
        direction="row"
        spacing={2}
        flexWrap="wrap"
        useFlexGap
        sx={{ mb: 3 }}
      >
        {stats.map((s) => (
          <Card
            key={s.label}
            elevation={0}
            sx={{
              flex: "1 1 160px",
              p: 2.5,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
              minWidth: 140,
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={600}
            >
              {s.label}
            </Typography>
            <Typography variant="h5" fontWeight={800} mt={0.5}>
              {s.value}
            </Typography>
          </Card>
        ))}
      </Stack>

      {/* ── FILTERS ── */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        alignItems={{ sm: "center" }}
        mb={2}
      >
        <TextField
          size="small"
          placeholder={lang?.searchOrders || "Search by user, plan, ID…"}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flex: 1, maxWidth: { sm: 340 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchOutlined fontSize="small" />
              </InputAdornment>
            ),
          }}
        />

        <Stack direction="row" alignItems="center" spacing={1}>
          <FilterListOutlined fontSize="small" color="action" />
          <Select
            size="small"
            value={gatewayFilter}
            onChange={(e) => setGatewayFilter(e.target.value)}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="all">
              {lang?.allGateways || "All Gateways"}
            </MenuItem>
            {Object.entries(GATEWAY_LABEL).map(([key, label]) => (
              <MenuItem key={key} value={key}>
                {label}
              </MenuItem>
            ))}
          </Select>
        </Stack>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ ml: "auto" }}
        >
          {filtered.length} {lang?.results || "results"}
        </Typography>
      </Stack>

      {/* ── TABLE ── */}
      <Card
        elevation={0}
        sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}
      >
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.04),
                  "& th": {
                    fontWeight: 700,
                    fontSize: "0.75rem",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    color: "text.secondary",
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    py: 1.5,
                    whiteSpace: "nowrap",
                  },
                }}
              >
                <TableCell>{lang?.orderId || "Order ID"}</TableCell>
                <TableCell>{lang?.user || "User"}</TableCell>
                <TableCell>{lang?.product || "Product"}</TableCell>
                <TableCell>{lang?.gateway || "Gateway"}</TableCell>
                <TableCell>{lang?.amount || "Amount"}</TableCell>
                <TableCell>{lang?.status || "Status"}</TableCell>
                <TableCell>{lang?.date || "Date"}</TableCell>
                <TableCell align="center">
                  {lang?.actions || "Actions"}
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary" variant="body2">
                      {lang?.noOrders || "No orders found"}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((order) => {
                  const meta = (() => {
                    try {
                      return JSON.parse(order.meta || "{}");
                    } catch {
                      return {};
                    }
                  })();

                  return (
                    <TableRow
                      key={order.id}
                      hover
                      sx={{
                        "& td": {
                          py: 1.25,
                          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                          fontSize: "0.8125rem",
                        },
                      }}
                    >
                      {/* ID */}
                      <TableCell>
                        <Typography
                          variant="caption"
                          fontWeight={700}
                          color="text.secondary"
                        >
                          #{order.id}
                        </Typography>
                      </TableCell>

                      {/* User */}
                      <TableCell>
                        <Stack spacing={0.25}>
                          <Typography variant="body2" fontWeight={600} noWrap>
                            {order.user_name || "—"}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            noWrap
                          >
                            {order.user_email || "—"}
                          </Typography>
                        </Stack>
                      </TableCell>

                      {/* Product */}
                      <TableCell>
                        <Stack spacing={0.25}>
                          <Typography variant="body2" fontWeight={600} noWrap>
                            {order.product_type === "credit_package"
                              ? order.package_title || "Credit Package"
                              : order.plan_title || "—"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {order.product_type === "credit_package"
                              ? `${Number(order.package_credits || 0).toLocaleString()} credits`
                              : order.plan_credits
                              ? `${Number(order.plan_credits).toLocaleString()} credits · Lifetime`
                              : "—"}
                          </Typography>
                        </Stack>
                      </TableCell>

                      {/* Gateway */}
                      <TableCell>
                        <Chip
                          label={GATEWAY_LABEL[order.gateway] || order.gateway}
                          color={GATEWAY_COLOR[order.gateway] || "default"}
                          size="small"
                          sx={{ fontWeight: 700, fontSize: "0.7rem" }}
                        />
                      </TableCell>

                      {/* Amount */}
                      <TableCell>
                        <Typography variant="body2" fontWeight={700}>
                          {order.gateway === "free_trial" ? (
                            <Chip
                              label={lang?.free || "Free"}
                              size="small"
                              variant="outlined"
                            />
                          ) : (
                            `$${parseFloat(order.amount || 0).toFixed(2)}`
                          )}
                        </Typography>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Chip
                          label={order.status}
                          color={
                            order.status === "paid"
                              ? "success"
                              : order.status === "pending"
                                ? "warning"
                                : "error"
                          }
                          size="small"
                          variant="outlined"
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.7rem",
                            textTransform: "capitalize",
                          }}
                        />
                      </TableCell>

                      {/* Date */}
                      <TableCell>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          noWrap
                        >
                          {new Date(order.created_at).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            },
                          )}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.disabled"
                          display="block"
                          noWrap
                        >
                          {new Date(order.created_at).toLocaleTimeString(
                            "en-US",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </Typography>
                      </TableCell>

                      {/* Actions */}
                      <TableCell align="center">
                        <Tooltip title={lang?.deleteOrder || "Delete Order"}>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeleteId(order.id)}
                          >
                            <DeleteOutline fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* ── DELETE CONFIRM DIALOG ── */}
      <Dialog
        open={!!deleteId}
        onClose={() => !deleting && setDeleteId(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {lang?.confirmDelete || "Delete Order?"}
        </DialogTitle>
        <Divider />
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {lang?.deleteOrderWarning ||
              "This will permanently delete the order record. The user's plan will not be affected."}
          </Typography>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <LoadingButton
            variant="outlined"
            color="inherit"
            onClick={() => setDeleteId(null)}
            disabled={deleting}
          >
            {lang?.cancel || "Cancel"}
          </LoadingButton>
          <LoadingButton
            variant="contained"
            color="error"
            loading={deleting}
            onClick={handleDelete}
          >
            {lang?.delete || "Delete"}
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Orders;
