import React from "react";
import PageHeader from "../../common/PageHeader";
import {
  HistoryToggleOff,
  TokenOutlined,
  SearchOutlined,
  TrendingDownOutlined,
  CalendarTodayOutlined,
  AccessTimeOutlined,
  OndemandVideoOutlined,
  ExpandMoreOutlined,
} from "@mui/icons-material";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Stack,
  Chip,
  alpha,
  useTheme,
  Avatar,
  TextField,
  InputAdornment,
  Divider,
  Button,
  CircularProgress,
} from "@mui/material";
import { GlobalContext } from "../../context/GlobalContext";

const PAGE_LIMIT = 20;

// ── Stat Card ─────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, color }) => (
  <Card
    sx={{
      borderRadius: 3,
      border: `1px solid ${alpha(color, 0.2)}`,
      bgcolor: alpha(color, 0.04),
      height: "100%",
    }}
  >
    <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
      >
        <Box>
          <Typography
            variant="h4"
            fontWeight={800}
            color="text.primary"
            lineHeight={1.2}
          >
            {value}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            fontWeight={600}
            mt={0.4}
          >
            {label}
          </Typography>
          {sub && (
            <Typography
              variant="caption"
              color="text.disabled"
              mt={0.3}
              display="block"
            >
              {sub}
            </Typography>
          )}
        </Box>
        <Avatar
          sx={{ width: 42, height: 42, bgcolor: alpha(color, 0.12), color }}
        >
          <Icon sx={{ fontSize: 20 }} />
        </Avatar>
      </Stack>
    </CardContent>
  </Card>
);

// ── Single Log Row ────────────────────────────────────────
const LogRow = ({ item, lang, theme }) => {
  const isToday =
    new Date(item.createdAt).toDateString() === new Date().toDateString();
  const isCreditTopup = [
    "credit_topup",
    "referral_signup_bonus",
    "referral_reward",
  ].includes(item.task);

  const taskLabel =
    item.task === "credit_topup"
      ? lang?.creditTopup || "Credit Top-up"
      : item.task === "referral_signup_bonus"
      ? lang?.referralSignupBonus || "Signup Bonus"
      : item.task === "referral_reward"
      ? lang?.referralReward || "Referral Reward"
      : item.task === "inf_maker"
      ? lang?.taskInfMaker || "Influencer Maker"
      : item.task;

  const statusType =
    item.status === "success"
      ? "success"
      : item.status === "failed"
        ? "failed"
        : "pending";

  const statusColor =
    statusType === "success"
      ? "success"
      : statusType === "failed"
        ? "error"
        : "warning";

  const statusLabel =
    statusType === "success"
      ? lang?.statusSuccess || "Success"
      : statusType === "failed"
        ? lang?.statusFailed || "Failed"
        : lang?.statusPending || "Processing";

  return (
    <Box
      sx={{
        px: 2,
        py: 1.8,
        borderRadius: 2,
        transition: "all 0.2s ease",
        "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.03) },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={2}>
        <Avatar
          sx={{
            width: 40,
            height: 40,
            bgcolor: alpha(isCreditTopup ? "#10B981" : "#8B5CF6", 0.1),
            color: isCreditTopup ? "#10B981" : "#8B5CF6",
            flexShrink: 0,
          }}
        >
          {isCreditTopup ? (
            <TokenOutlined sx={{ fontSize: 18 }} />
          ) : (
            <OndemandVideoOutlined sx={{ fontSize: 18 }} />
          )}
        </Avatar>

        <Box flex={1} minWidth={0}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2" fontWeight={700} noWrap>
              {taskLabel}
            </Typography>
            <Chip
              label={statusLabel}
              size="small"
              color={statusColor}
              sx={{ height: 18, fontSize: "0.6rem", fontWeight: 700 }}
            />
          </Stack>
          <Typography
            variant="caption"
            color="text.disabled"
            noWrap
            display="block"
            mt={0.3}
          >
            {item.des}
          </Typography>
        </Box>

        <Stack alignItems="flex-end" spacing={0.4} flexShrink={0}>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <TokenOutlined
              sx={{
                fontSize: 14,
                color: isCreditTopup
                  ? "success.main"
                  : statusType === "failed"
                    ? "error.main"
                    : "warning.main",
              }}
            />
            <Typography
              variant="body2"
              fontWeight={800}
              color={
                isCreditTopup
                  ? "success.main"
                  : statusType === "failed"
                    ? "error.main"
                    : "warning.main"
              }
            >
              {isCreditTopup ? "+" : "-"}
              {item.credits}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={0.4} alignItems="center">
            <AccessTimeOutlined sx={{ fontSize: 10, color: "text.disabled" }} />
            <Typography variant="caption" color="text.disabled">
              {new Date(item.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Typography>
          </Stack>
          <Typography variant="caption" color="text.disabled">
            {isToday
              ? lang?.today || "Today"
              : new Date(item.createdAt).toLocaleDateString([], {
                  month: "short",
                  day: "numeric",
                })}
          </Typography>
        </Stack>
      </Stack>
    </Box>
  );
};

// ── Main Component ────────────────────────────────────────
const Usage = ({ lang }) => {
  const [logs, setLogs] = React.useState([]);
  const [total, setTotal] = React.useState(0);
  const [offset, setOffset] = React.useState(0);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [initialLoading, setInitialLoading] = React.useState(true);

  const { hitAxios } = React.useContext(GlobalContext);
  const theme = useTheme();
  const [search, setSearch] = React.useState("");

  // ── Fetch a page of logs ──────────────────────────────
  async function getLogs(currentOffset = 0, append = false) {
    append ? setLoadingMore(true) : setInitialLoading(true);

    const res = await hitAxios({
      path: `/api/user/get_usage_logs?limit=${PAGE_LIMIT}&offset=${currentOffset}`,
      post: false,
      admin: false,
    });

    if (res.data.success) {
      setLogs((prev) => (append ? [...prev, ...res.data.data] : res.data.data));
      setTotal(res.data.total);
      setOffset(currentOffset + res.data.data.length);
    }

    append ? setLoadingMore(false) : setInitialLoading(false);
  }

  React.useEffect(() => {
    getLogs(0, false);
  }, []);

  const hasMore = logs.length < total;

  // ── Derived stats (from ALL loaded logs) ──────────────
  const creditAddTasks = [
    "credit_topup",
    "referral_signup_bonus",
    "referral_reward",
  ];
  const totalCredits = logs
    .filter((l) => l.status === "success" && !creditAddTasks.includes(l.task))
    .reduce((s, l) => s + Number(l.credits), 0);
  const purchasedCredits = logs
    .filter((l) => l.status === "success" && creditAddTasks.includes(l.task))
    .reduce((s, l) => s + Number(l.credits), 0);
  const totalTasks = total; // use server total, not just loaded
  const failedTasks = logs.filter((l) => l.status === "failed").length;

  // ── Search filter (client-side on loaded logs) ────────
  const filtered = logs.filter(
    (l) =>
      l.task.toLowerCase().includes(search.toLowerCase()) ||
      (l.des || "").toLowerCase().includes(search.toLowerCase()),
  );

  // ── Group by calendar date ────────────────────────────
  const grouped = filtered.reduce((acc, log) => {
    const key = new Date(log.createdAt).toDateString();
    if (!acc[key]) acc[key] = [];
    acc[key].push(log);
    return acc;
  }, {});

  return (
    <Box>
      <PageHeader
        icon={HistoryToggleOff}
        primaryAction={null}
        title={lang?.usage || "Usage"}
        subtitle={lang?.usageSub || "Watch logs of your influencer"}
      />

      <Grid container spacing={3}>
        {/* ── Stat Cards ── */}
        <Grid item xs={6} sm={4}>
          <StatCard
            icon={TokenOutlined}
            label={lang?.totalCreditsUsed || "Total Credits Used"}
            value={totalCredits}
            sub={lang?.allTime || "All time"}
            color="#D97706"
          />
        </Grid>
        <Grid item xs={6} sm={4}>
          <StatCard
            icon={TokenOutlined}
            label={lang?.creditsPurchased || "Credits Purchased"}
            value={purchasedCredits}
            sub={lang?.topups || "Top-ups"}
            color="#10B981"
          />
        </Grid>
        <Grid item xs={6} sm={4}>
          <StatCard
            icon={HistoryToggleOff}
            label={lang?.totalTasks || "Total Tasks"}
            value={totalTasks}
            sub={lang?.allTime || "All time"}
            color="#6366F1"
          />
        </Grid>
        <Grid item xs={6} sm={4}>
          <StatCard
            icon={TrendingDownOutlined}
            label={lang?.failedTasks || "Failed Tasks"}
            value={failedTasks}
            sub={lang?.allTime || "All time"}
            color="#EF4444"
          />
        </Grid>

        {/* ── Log List ── */}
        <Grid item xs={12}>
          <Card
            sx={{
              borderRadius: 3,
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              {/* Search */}
              <TextField
                fullWidth
                size="small"
                placeholder={lang?.searchPlaceholder || "Search logs..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{ mb: 2.5 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchOutlined
                        sx={{ fontSize: 16, color: "text.disabled" }}
                      />
                    </InputAdornment>
                  ),
                }}
              />
              {/* Initial loading skeleton */}
              {initialLoading && (
                <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
                  <CircularProgress size={28} />
                </Box>
              )}
              {/* Empty state */}
              {!initialLoading && filtered.length === 0 && (
                <Box
                  sx={{
                    py: 6,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <Avatar
                    sx={{
                      width: 52,
                      height: 52,
                      bgcolor: alpha(theme.palette.text.secondary, 0.06),
                    }}
                  >
                    <HistoryToggleOff
                      sx={{ fontSize: 26, color: "text.disabled" }}
                    />
                  </Avatar>
                  <Typography
                    variant="body2"
                    color="text.disabled"
                    fontWeight={600}
                  >
                    {lang?.noLogsFound || "No logs found"}
                  </Typography>
                </Box>
              )}
              {/* Grouped logs */}
              {!initialLoading && (
                <Stack spacing={0}>
                  {Object.entries(grouped).map(([dateKey, dayLogs], gi) => (
                    <Box key={dateKey}>
                      {/* Date header */}
                      <Stack
                        direction="row"
                        spacing={1.5}
                        alignItems="center"
                        py={1.2}
                      >
                        <CalendarTodayOutlined
                          sx={{ fontSize: 12, color: "text.disabled" }}
                        />
                        <Typography
                          variant="caption"
                          fontWeight={700}
                          color="text.disabled"
                        >
                          {new Date(dateKey).toDateString() ===
                          new Date().toDateString()
                            ? lang?.today || "Today"
                            : new Date(dateKey).toLocaleDateString([], {
                                weekday: "long",
                                month: "long",
                                day: "numeric",
                              })}
                        </Typography>
                        <Box flex={1} height="1px" bgcolor="divider" />
                        <Typography variant="caption" color="text.disabled">
                          {dayLogs.reduce((s, l) => s + Number(l.credits), 0)}{" "}
                          {lang?.credits || "credits"}
                        </Typography>
                      </Stack>

                      {/* Rows */}
                      {dayLogs.map((log, i) => (
                        <React.Fragment key={log.id}>
                          <LogRow item={log} lang={lang} theme={theme} />
                          {i < dayLogs.length - 1 && (
                            <Divider sx={{ mx: 2, opacity: 0.5 }} />
                          )}
                        </React.Fragment>
                      ))}

                      {gi < Object.keys(grouped).length - 1 && <Box mb={1} />}
                    </Box>
                  ))}

                  {/* ── Load More Button ── */}
                  {hasMore && (
                    <Box
                      sx={{
                        pt: 2.5,
                        display: "flex",
                        justifyContent: "center",
                      }}
                    >
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => getLogs(offset, true)}
                        disabled={loadingMore}
                        startIcon={
                          loadingMore ? (
                            <CircularProgress size={14} color="inherit" />
                          ) : (
                            <ExpandMoreOutlined />
                          )
                        }
                        sx={{ borderRadius: 2, px: 3, textTransform: "none" }}
                      >
                        {loadingMore
                          ? lang?.loading || "Loading..."
                          : `${lang?.loadMore || "Load more"} (${total - logs.length} ${lang?.remaining || "remaining"})`}
                      </Button>
                    </Box>
                  )}

                  {/* ── All loaded indicator ── */}
                  {!hasMore && logs.length > 0 && (
                    <Box
                      sx={{
                        pt: 2.5,
                        display: "flex",
                        justifyContent: "center",
                      }}
                    >
                      <Typography variant="caption" color="text.disabled">
                        ✓ {lang?.allLogsLoaded || "All logs loaded"} ·{" "}
                        {logs.length} {lang?.entries || "entries"}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              )}
              Guest
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Usage;
