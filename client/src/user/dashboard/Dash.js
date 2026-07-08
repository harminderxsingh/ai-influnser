import React, { useContext, useEffect, useState, useMemo } from "react";
import {
  Box,
  Typography,
  Grid,
  CircularProgress,
  Avatar,
  Chip,
  Divider,
  LinearProgress,
  Button,
  Stack,
} from "@mui/material";
import {
  Face2Outlined,
  CollectionsOutlined,
  SlowMotionVideoOutlined,
  MovieFilterOutlined,
  TokenOutlined,
  TrendingUpOutlined,
  CheckCircleOutline,
  ErrorOutline,
} from "@mui/icons-material";
import { GlobalContext } from "../../context/GlobalContext";
import { useCustomTheme } from "../../utils/useCustomTheme";
import { UserContext } from "../../context/UserContext";
import moment from "moment";
import PageHeader from "../../common/PageHeader";
import { useHistory } from "react-router-dom";

// ─────────────────────────────────────────────────────────
// Stat Card
// ─────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, color, config }) => (
  <Box
    sx={{
      p: 2.5,
      borderRadius: `${config.card.borderRadius}px`,
      border: "1px solid",
      borderColor: "divider",
      bgcolor: "background.paper",
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
        borderRadius: `${config.card.borderRadius / 1.5}px`,
        bgcolor: `${color}.main`,
        opacity: 0.12,
        position: "absolute",
      }}
    />
    <Box
      sx={{
        width: 46,
        height: 46,
        borderRadius: `${config.card.borderRadius / 1.5}px`,
        border: "1px solid",
        borderColor: `${color}.main`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        position: "relative",
      }}
    >
      <Icon sx={{ fontSize: "1.3rem", color: `${color}.main` }} />
    </Box>
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography
        variant="caption"
        color="text.secondary"
        fontFamily={config.font_family}
      >
        {label}
      </Typography>
      <Typography
        variant="h5"
        fontWeight={config.font_weight_bold}
        fontFamily={config.font_family}
        lineHeight={1.2}
      >
        {value ?? "—"}
      </Typography>
      {sub && (
        <Typography
          variant="caption"
          color="text.disabled"
          fontFamily={config.font_family}
        >
          {sub}
        </Typography>
      )}
    </Box>
  </Box>
);

// ─────────────────────────────────────────────────────────
// Mini bar chart (pure CSS)
// ─────────────────────────────────────────────────────────
const MiniBarChart = ({ data, config }) => {
  const max = Math.max(...data.map((d) => Number(d.credits_spent || 0)), 1);
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
        const pct = (Number(d.credits_spent) / max) * 100;
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
                transition: "height 0.4s ease",
                minHeight: 4,
              }}
            />
            <Typography
              sx={{
                fontSize: "0.55rem",
                color: "text.disabled",
                fontFamily: config.font_family,
              }}
            >
              {moment(d.date).format("DD")}
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

const taskLabel = (task) => TASK_LABELS[task] || task;

// ─────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────
const Dash = ({ lang }) => {
  const { hitAxios } = useContext(GlobalContext);
  const { userData } = useContext(UserContext);
  const { config } = useCustomTheme();
  const history = useHistory();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  async function getDashboard() {
    setLoading(true);
    try {
      const res = await hitAxios({
        path: "/api/user/get_dashboard",
        post: false,
        admin: false,
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

  // ── Plan parse ──
  const plan = useMemo(() => {
    if (!userData?.plan) return null;
    try {
      return typeof userData.plan === "string"
        ? JSON.parse(userData.plan)
        : userData.plan;
    } catch {
      return null;
    }
  }, [userData?.plan]);

  const credits = Number(userData?.credits || 0);
  const maxCredits = Number(plan?.credits || 0);
  const creditPct =
    maxCredits > 0 ? Math.min((credits / maxCredits) * 100, 100) : 0;

  const creditBarColor =
    creditPct > 50 ? "success" : creditPct > 20 ? "warning" : "error";

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
    recent_influencers,
    usage_logs,
  } = data;

  return (
    <Box>
      <Box mb={2}>
        <PageHeader
          title={`${lang?.welcomeBack || "Welcome back"} ${userData?.name || "—"} 👋`}
          subtitle={moment().format("dddd, MMMM D YYYY")}
        />
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {/* ── Stat Cards ── */}
        <Grid container spacing={2}>
          {[
            {
              icon: Face2Outlined,
              label: lang?.influencers || "Influencers",
              value: stats.influencers.total,
              sub: `${stats.influencers.active} ${lang?.active || "active"}`,
              color: "primary",
            },
            {
              icon: CollectionsOutlined,
              label: lang?.gallery || "Gallery",
              value: stats.gallery.total,
              sub: `${stats.gallery.success} ${lang?.generated || "generated"}`,
              color: "secondary",
            },
            {
              icon: SlowMotionVideoOutlined,
              label: lang?.contentVideos || "Content Videos",
              value: stats.content.total,
              sub: `${stats.content.success} ${lang?.completed || "completed"}`,
              color: "info",
            },
            {
              icon: MovieFilterOutlined,
              label: lang?.showcase || "Showcases",
              value: stats.showcase.total,
              sub: `${stats.showcase.success} ${lang?.completed || "completed"}`,
              color: "success",
            },
          ].map((card) => (
            <Grid item xs={12} sm={6} lg={3} key={card.label}>
              <StatCard {...card} config={config} />
            </Grid>
          ))}
        </Grid>

        {/* ── Plan + Credits + Chart row ── */}
        <Grid container spacing={2}>
          {/* Plan card */}
          <Grid item xs={12} md={4}>
            <Box
              sx={{
                p: 2.5,
                borderRadius: `${config.card.borderRadius}px`,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <Typography
                variant="subtitle2"
                fontWeight={config.font_weight_bold}
                fontFamily={config.font_family}
              >
                {lang?.yourPlan || "Your Plan"}
              </Typography>

              {plan ? (
                <>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Typography
                      variant="h6"
                      fontWeight={config.font_weight_bold}
                      fontFamily={config.font_family}
                      color="primary"
                    >
                      {plan.title}
                    </Typography>
                    <Chip
                      size="small"
                      label={lang?.lifetime || "Lifetime"}
                      color="success"
                      variant="outlined"
                      sx={{ fontWeight: 700, fontSize: "0.68rem" }}
                    />
                  </Box>

                  {/* Credits bar */}
                  <Box>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 0.8,
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                      >
                        <TokenOutlined
                          sx={{ fontSize: "0.85rem", color: "text.disabled" }}
                        />
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          fontFamily={config.font_family}
                        >
                          {lang?.credits || "Credits"}
                        </Typography>
                      </Box>
                      <Typography
                        variant="caption"
                        fontWeight={700}
                        fontFamily={config.font_family}
                      >
                        {credits.toLocaleString()}
                        {maxCredits > 0 && (
                          <Box component="span" sx={{ color: "text.disabled" }}>
                            {" "}
                            / {maxCredits.toLocaleString()}
                          </Box>
                        )}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={creditPct}
                      color={creditBarColor}
                      sx={{
                        height: 6,
                        borderRadius: 99,
                        bgcolor: `${creditBarColor}.main`,
                        opacity: 1,
                        "& .MuiLinearProgress-bar": { borderRadius: 99 },
                      }}
                    />
                  </Box>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => history.push("/#pricing")}
                    >
                      {lang?.upgradePlan || "Upgrade Plan"}
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => history.push("/user?page=buy-credits")}
                    >
                      {lang?.buyCredits || "Buy Credits"}
                    </Button>
                  </Stack>
                </>
              ) : (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  fontFamily={config.font_family}
                >
                  {lang?.noPlan || "No active plan"}
                </Typography>
              )}
            </Box>
          </Grid>

          {/* Credit chart */}
          <Grid item xs={12} md={4}>
            <Box
              sx={{
                p: 2.5,
                borderRadius: `${config.card.borderRadius}px`,
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
                <Typography
                  variant="subtitle2"
                  fontWeight={config.font_weight_bold}
                  fontFamily={config.font_family}
                >
                  {lang?.creditsSpent || "Credits Spent"} (7d)
                </Typography>
              </Box>
              <Typography
                variant="caption"
                color="text.disabled"
                fontFamily={config.font_family}
              >
                {lang?.successfulTasksOnly || "Successful tasks only"}
              </Typography>

              {credit_chart.length > 0 ? (
                <MiniBarChart data={credit_chart} config={config} />
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
                  <Typography
                    variant="caption"
                    color="text.disabled"
                    fontFamily={config.font_family}
                  >
                    {lang?.noActivity || "No activity yet"}
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
                borderRadius: `${config.card.borderRadius}px`,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                gap: 1.5,
              }}
            >
              <Typography
                variant="subtitle2"
                fontWeight={config.font_weight_bold}
                fontFamily={config.font_family}
              >
                {lang?.taskBreakdown || "Task Breakdown"}
              </Typography>

              {task_breakdown.length === 0 ? (
                <Typography
                  variant="caption"
                  color="text.disabled"
                  fontFamily={config.font_family}
                >
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
                        <Typography
                          variant="caption"
                          fontFamily={config.font_family}
                          fontWeight={config.font_weight_medium}
                        >
                          {taskLabel(t.task)}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          fontFamily={config.font_family}
                        >
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
            </Box>
          </Grid>
        </Grid>

        {/* ── Recent Influencers + Usage Log ── */}
        <Grid container spacing={2}>
          {/* Recent influencers */}
          <Grid item xs={12} md={5}>
            <Box
              sx={{
                p: 2.5,
                borderRadius: `${config.card.borderRadius}px`,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
              }}
            >
              <Typography
                variant="subtitle2"
                fontWeight={config.font_weight_bold}
                fontFamily={config.font_family}
                mb={2}
              >
                {lang?.recentInfluencers || "Recent Influencers"}
              </Typography>

              {recent_influencers.length === 0 ? (
                <Typography
                  variant="caption"
                  color="text.disabled"
                  fontFamily={config.font_family}
                >
                  {lang?.noInfluencers || "No influencers yet"}
                </Typography>
              ) : (
                <Box
                  sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
                >
                  {recent_influencers.map((inf, i) => (
                    <React.Fragment key={inf.id}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                      >
                        <Avatar
                          src={
                            inf.photo_url
                              ? `/media/${inf.photo_url}`
                              : undefined
                          }
                          sx={{
                            width: 38,
                            height: 38,
                            bgcolor: "primary.main",
                            fontSize: "0.85rem",
                          }}
                        >
                          {inf.name?.charAt(0)}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="body2"
                            fontWeight={config.font_weight_semibold}
                            fontFamily={config.font_family}
                            noWrap
                          >
                            {inf.name}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.disabled"
                            fontFamily={config.font_family}
                          >
                            {moment(inf.created_at).fromNow()}
                          </Typography>
                        </Box>
                        <Chip
                          size="small"
                          label={inf.status}
                          color={
                            inf.status === "active" ? "success" : "default"
                          }
                          variant="outlined"
                          sx={{ fontSize: "0.62rem", height: 20 }}
                        />
                      </Box>
                      {i < recent_influencers.length - 1 && (
                        <Divider sx={{ opacity: 0.5 }} />
                      )}
                    </React.Fragment>
                  ))}
                </Box>
              )}
            </Box>
          </Grid>

          {/* Usage log */}
          <Grid item xs={12} md={7}>
            <Box
              sx={{
                p: 2.5,
                borderRadius: `${config.card.borderRadius}px`,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
              }}
            >
              <Typography
                variant="subtitle2"
                fontWeight={config.font_weight_bold}
                fontFamily={config.font_family}
                mb={2}
              >
                {lang?.recentActivity || "Recent Activity"}
              </Typography>

              {usage_logs.length === 0 ? (
                <Typography
                  variant="caption"
                  color="text.disabled"
                  fontFamily={config.font_family}
                >
                  {lang?.noActivity || "No activity yet"}
                </Typography>
              ) : (
                <Box
                  sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}
                >
                  {usage_logs.map((log, i) => (
                    <React.Fragment key={i}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 1.5,
                        }}
                      >
                        {/* Status icon */}
                        <Box sx={{ mt: 0.2, flexShrink: 0 }}>
                          {log.status === "success" ? (
                            <CheckCircleOutline
                              sx={{ fontSize: "1rem", color: "success.main" }}
                            />
                          ) : (
                            <ErrorOutline
                              sx={{ fontSize: "1rem", color: "error.main" }}
                            />
                          )}
                        </Box>

                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 1,
                            }}
                          >
                            <Typography
                              variant="body2"
                              fontWeight={config.font_weight_semibold}
                              fontFamily={config.font_family}
                              noWrap
                            >
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
                                fontFamily={config.font_family}
                              >
                                {Number(log.credits).toLocaleString()}
                              </Typography>
                            </Box>
                          </Box>
                          <Typography
                            variant="caption"
                            color="text.disabled"
                            fontFamily={config.font_family}
                            noWrap
                            display="block"
                          >
                            {log.des}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.disabled"
                            fontFamily={config.font_family}
                            sx={{ opacity: 0.6 }}
                          >
                            {moment(log.createdAt).fromNow()}
                          </Typography>
                        </Box>
                      </Box>
                      {i < usage_logs.length - 1 && (
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
    </Box>
  );
};

export default Dash;
