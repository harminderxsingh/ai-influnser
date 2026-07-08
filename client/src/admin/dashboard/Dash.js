import React, { useContext, useEffect, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  CircularProgress,
  Avatar,
  Chip,
  Divider,
  LinearProgress,
} from "@mui/material";
import {
  GroupOutlined,
  Face2Outlined,
  CollectionsOutlined,
  SlowMotionVideoOutlined,
  MovieFilterOutlined,
  SupportAgentOutlined,
  ContactMailOutlined,
  ArticleOutlined,
  TokenOutlined,
  TrendingUpOutlined,
  CheckCircleOutline,
  ErrorOutline,
  PersonAddOutlined,
  AdminPanelSettings,
} from "@mui/icons-material";
import { GlobalContext } from "../../context/GlobalContext";
import PageHeader from "../../common/PageHeader";
import moment from "moment";

// ─────────────────────────────────────────────────────────
// Stat Card
// ─────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, color }) => (
  <Box
    sx={{
      p: 2.5,
      borderRadius: 3,
      border: "1px solid",
      borderColor: "divider",
      //   bgcolor: "background.paper",
      display: "flex",
      alignItems: "flex-start",
      gap: 2,
      transition: "box-shadow 0.2s ease, transform 0.2s ease",
      "&:hover": { boxShadow: 4, transform: "translateY(-2px)" },
    }}
  >
    <Box
      sx={{
        width: 46,
        height: 46,
        borderRadius: 2,
        border: "1px solid",
        borderColor: `${color}.main`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        // bgcolor: `${color}.main`,
        opacity: 1,
      }}
    >
      <Icon sx={{ fontSize: "1.2rem" }} />
    </Box>
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h5" fontWeight={700} lineHeight={1.2}>
        {value ?? "—"}
      </Typography>
      {sub && (
        <Typography variant="caption" color="text.disabled">
          {sub}
        </Typography>
      )}
    </Box>
  </Box>
);

// ─────────────────────────────────────────────────────────
// Mini Bar Chart (pure CSS)
// ─────────────────────────────────────────────────────────
const MiniBarChart = ({
  data,
  valueKey = "credits_spent",
  labelKey = "date",
}) => {
  const max = Math.max(...data.map((d) => Number(d[valueKey] || 0)), 1);
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-end",
        gap: 0.8,
        height: 64,
        mt: 1,
      }}
    >
      {data.map((d, i) => {
        const pct = (Number(d[valueKey]) / max) * 100;
        return (
          <Box
            key={i}
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 0.4,
            }}
          >
            <Box
              sx={{
                width: "100%",
                height: `${Math.max(pct, 6)}%`,
                bgcolor: "primary.main",
                borderRadius: "4px 4px 0 0",
                opacity: 0.75,
                minHeight: 4,
                transition: "height 0.4s ease",
              }}
            />
            <Typography sx={{ fontSize: "0.55rem", color: "text.disabled" }}>
              {moment(d[labelKey]).format("DD")}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
};

// ─────────────────────────────────────────────────────────
// Task label map
// ─────────────────────────────────────────────────────────
const TASK_LABELS = {
  inf_maker: "Influencer Create",
  inf_var_maker: "Influencer Variation",
  content_video: "Content Video",
  product_showcase: "Product Showcase",
};
const taskLabel = (t) => TASK_LABELS[t] || t;

// ─────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────
const Dash = ({ lang }) => {
  const { hitAxios } = useContext(GlobalContext);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  async function getDashboard() {
    setLoading(true);
    try {
      const res = await hitAxios({
        path: "/api/admin/get_dashboard",
        post: false,
        admin: true,
        showLoading: false,
      });
      if (res?.data?.success) setData(res.data.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getDashboard();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data) {
    return (
      <Box sx={{ textAlign: "center", py: 10 }}>
        <Typography color="text.secondary">
          {lang?.dashLoadError || "Failed to load dashboard"}
        </Typography>
      </Box>
    );
  }

  const {
    stats,
    credit_chart,
    task_breakdown,
    user_growth,
    recent_users,
    recent_activity,
    task_pricing,
  } = data;

  return (
    <>
      <PageHeader
        icon={AdminPanelSettings}
        title={lang?.adminDashboard || "Admin Dashboard 🛠️"}
        subtitle={`${moment().format("D/MM/YYYY")} · ${lang?.platformOverview || "Platform-wide overview"}`}
      />

      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {/* ── Row 1: User + Content Stats ── */}
        <Grid container spacing={2}>
          {[
            {
              icon: GroupOutlined,
              label: lang?.totalUsers || "Total Users",
              value: stats.users.total,
              sub: `${stats.users.new_today} ${lang?.newToday || "new today"}`,
              color: "primary",
            },
            {
              icon: Face2Outlined,
              label: lang?.influencers || "Influencers",
              value: stats.influencers.total,
              sub: `${stats.influencers.active} ${lang?.active || "active"}`,
              color: "secondary",
            },
            {
              icon: CollectionsOutlined,
              label: lang?.gallery || "Gallery",
              value: stats.gallery.total,
              sub: `${stats.gallery.success} ${lang?.generated || "generated"}`,
              color: "info",
            },
            {
              icon: SlowMotionVideoOutlined,
              label: lang?.contentVideos || "Content Videos",
              value: stats.content.total,
              sub: `${stats.content.success} ${lang?.completed || "completed"}`,
              color: "success",
            },
            {
              icon: MovieFilterOutlined,
              label: lang?.showcases || "Showcases",
              value: stats.showcase.total,
              sub: `${stats.showcase.success} ${lang?.completed || "completed"}`,
              color: "warning",
            },
            {
              icon: TokenOutlined,
              label: lang?.creditsSpent || "Credits Spent",
              value: Number(stats.credits_spent).toLocaleString(),
              sub: lang?.allTime || "all time",
              color: "error",
            },
            {
              icon: SupportAgentOutlined,
              label: lang?.supportTickets || "Support Tickets",
              value: stats.support.total,
              sub: `${stats.support.unanswered} ${lang?.unanswered || "unanswered"}`,
              color: "primary",
            },
            {
              icon: ContactMailOutlined,
              label: lang?.leads || "Leads",
              value: stats.leads.total,
              sub: `${stats.leads.today} ${lang?.today || "today"}`,
              color: "secondary",
            },
            {
              icon: ArticleOutlined,
              label: lang?.blogs || "Blogs",
              value: stats.blogs.total,
              sub: `${stats.blogs.published} ${lang?.published || "published"}`,
              color: "info",
            },
          ].map((card) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={card.label}>
              <StatCard {...card} />
            </Grid>
          ))}
        </Grid>

        {/* ── Row 2: Charts ── */}
        <Grid container spacing={2}>
          {/* Credits chart */}
          <Grid item xs={12} md={4}>
            <Box
              sx={{
                p: 2.5,
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
                height: "100%",
              }}
            >
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}
              >
                <TrendingUpOutlined
                  sx={{ fontSize: "1rem", color: "primary.main" }}
                />
                <Typography variant="subtitle2" fontWeight={700}>
                  {lang?.creditsSpent || "Credits Spent"} (7d)
                </Typography>
              </Box>
              <Typography variant="caption" color="text.disabled">
                {lang?.successfulTasksOnly || "Successful tasks only"}
              </Typography>
              {credit_chart.length > 0 ? (
                <MiniBarChart
                  data={credit_chart}
                  valueKey="credits_spent"
                  labelKey="date"
                />
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: 64,
                    mt: 1,
                  }}
                >
                  <Typography variant="caption" color="text.disabled">
                    {lang?.noActivity || "No activity yet"}
                  </Typography>
                </Box>
              )}
            </Box>
          </Grid>

          {/* User growth chart */}
          <Grid item xs={12} md={4}>
            <Box
              sx={{
                p: 2.5,
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
                height: "100%",
              }}
            >
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}
              >
                <PersonAddOutlined
                  sx={{ fontSize: "1rem", color: "success.main" }}
                />
                <Typography variant="subtitle2" fontWeight={700}>
                  {lang?.userGrowth || "User Growth"} (7d)
                </Typography>
              </Box>
              <Typography variant="caption" color="text.disabled">
                {lang?.newRegistrations || "New registrations per day"}
              </Typography>
              {user_growth.length > 0 ? (
                <MiniBarChart
                  data={user_growth}
                  valueKey="count"
                  labelKey="date"
                />
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: 64,
                    mt: 1,
                  }}
                >
                  <Typography variant="caption" color="text.disabled">
                    {lang?.noData || "No data yet"}
                  </Typography>
                </Box>
              )}
            </Box>
          </Grid>

          {/* Task breakdown */}
          <Grid item xs={12} md={4}>
            <Box
              sx={{
                p: 2.5,
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                gap: 1.5,
              }}
            >
              <Typography variant="subtitle2" fontWeight={700}>
                {lang?.taskBreakdown || "Task Breakdown"}
              </Typography>

              {task_breakdown.length === 0 ? (
                <Typography variant="caption" color="text.disabled">
                  {lang?.noTasks || "No tasks yet"}
                </Typography>
              ) : (
                task_breakdown.map((t) => {
                  const totalCount = task_breakdown.reduce(
                    (s, x) => s + Number(x.count),
                    0,
                  );
                  const pct =
                    totalCount > 0 ? (Number(t.count) / totalCount) * 100 : 0;
                  return (
                    <Box key={t.task}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 0.4,
                        }}
                      >
                        <Typography variant="caption" fontWeight={600}>
                          {taskLabel(t.task)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {t.count} · {Number(t.total_credits).toLocaleString()}{" "}
                          cr
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={pct}
                        color="primary"
                        sx={{
                          height: 4,
                          borderRadius: 99,
                          "& .MuiLinearProgress-bar": { borderRadius: 99 },
                        }}
                      />
                    </Box>
                  );
                })
              )}

              {/* Task pricing reference */}
              {task_pricing && (
                <>
                  <Divider sx={{ mt: 0.5 }} />
                  <Typography
                    variant="caption"
                    color="text.disabled"
                    fontWeight={600}
                  >
                    {lang?.taskPricing || "Task Pricing (credits)"}
                  </Typography>
                  <Grid container spacing={0.5}>
                    {[
                      { label: "Influencer", val: task_pricing.inf_maker },
                      { label: "Variation", val: task_pricing.inf_var_maker },
                      {
                        label: "Content",
                        val: task_pricing.content_video_maker,
                      },
                      {
                        label: lang?.shhowCase || "Showcase",
                        val: task_pricing.product_showcase_maker,
                      },
                    ].map((p) => (
                      <Grid item xs={6} key={p.label}>
                        <Box
                          sx={{
                            px: 1,
                            py: 0.5,
                            borderRadius: 1.5,
                            border: "1px solid",
                            borderColor: "divider",
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            {p.label}
                          </Typography>
                          <Typography
                            variant="caption"
                            fontWeight={700}
                            color="warning.main"
                          >
                            {p.val}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </>
              )}
            </Box>
          </Grid>
        </Grid>

        {/* ── Row 3: Recent Users + Activity ── */}
        <Grid container spacing={2}>
          {/* Recent users */}
          <Grid item xs={12} md={5}>
            <Box
              sx={{
                p: 2.5,
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
              }}
            >
              <Typography variant="subtitle2" fontWeight={700} mb={2}>
                {lang?.recentUsers || "Recent Users"}
              </Typography>

              {recent_users.length === 0 ? (
                <Typography variant="caption" color="text.disabled">
                  {lang?.noUsers || "No users yet"}
                </Typography>
              ) : (
                <Box
                  sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
                >
                  {recent_users.map((u, i) => {
                    let planTitle = null;
                    try {
                      planTitle = u.plan
                        ? (typeof u.plan === "string"
                            ? JSON.parse(u.plan)
                            : u.plan
                          )?.title
                        : null;
                    } catch {
                      /* ignore */
                    }

                    return (
                      <React.Fragment key={u.uid}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                          }}
                        >
                          <Avatar
                            sx={{
                              width: 36,
                              height: 36,
                              bgcolor: "primary.main",
                              fontSize: "0.8rem",
                              fontWeight: 700,
                            }}
                          >
                            {u.name?.charAt(0)?.toUpperCase() || "U"}
                          </Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" fontWeight={600} noWrap>
                              {u.name}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.disabled"
                              noWrap
                              display="block"
                            >
                              {u.email}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "flex-end",
                              gap: 0.4,
                            }}
                          >
                            <Chip
                              size="small"
                              label={u.status}
                              color={
                                u.status === "active" ? "success" : "default"
                              }
                              variant="outlined"
                              sx={{ fontSize: "0.6rem", height: 18 }}
                            />
                            {planTitle && (
                              <Typography
                                variant="caption"
                                color="text.disabled"
                                sx={{ fontSize: "0.6rem" }}
                              >
                                {planTitle}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                        {i < recent_users.length - 1 && (
                          <Divider sx={{ opacity: 0.5 }} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </Box>
              )}
            </Box>
          </Grid>

          {/* Recent activity */}
          <Grid item xs={12} md={7}>
            <Box
              sx={{
                p: 2.5,
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
              }}
            >
              <Typography variant="subtitle2" fontWeight={700} mb={2}>
                {lang?.recentActivity || "Recent Activity"}
              </Typography>

              {recent_activity.length === 0 ? (
                <Typography variant="caption" color="text.disabled">
                  {lang?.noActivity || "No activity yet"}
                </Typography>
              ) : (
                <Box
                  sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}
                >
                  {recent_activity.map((log, i) => (
                    <React.Fragment key={i}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 1.5,
                        }}
                      >
                        {log.status === "success" ? (
                          <CheckCircleOutline
                            sx={{
                              fontSize: "1rem",
                              color: "success.main",
                              mt: 0.2,
                              flexShrink: 0,
                            }}
                          />
                        ) : (
                          <ErrorOutline
                            sx={{
                              fontSize: "1rem",
                              color: "error.main",
                              mt: 0.2,
                              flexShrink: 0,
                            }}
                          />
                        )}

                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 1,
                            }}
                          >
                            <Typography variant="body2" fontWeight={600} noWrap>
                              {taskLabel(log.task)}
                            </Typography>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.4,
                                flexShrink: 0,
                              }}
                            >
                              <TokenOutlined
                                sx={{
                                  fontSize: "0.75rem",
                                  color: "warning.main",
                                }}
                              />
                              <Typography
                                variant="caption"
                                fontWeight={700}
                                color="warning.main"
                              >
                                {Number(log.credits).toLocaleString()}
                              </Typography>
                            </Box>
                          </Box>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            noWrap
                            display="block"
                          >
                            {log.user_name || "—"} · {log.user_email || "—"}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.disabled"
                            sx={{ opacity: 0.7 }}
                          >
                            {moment(log.createdAt).fromNow()}
                          </Typography>
                        </Box>
                      </Box>
                      {i < recent_activity.length - 1 && (
                        <Divider sx={{ opacity: 0.4 }} />
                      )}
                    </React.Fragment>
                  ))}
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>
      </Box>
    </>
  );
};

export default Dash;
