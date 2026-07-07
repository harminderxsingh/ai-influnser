// components/support/admin/StatsAndList.jsx
import React from "react";
import { SupportAgent } from "@mui/icons-material";
import {
  alpha,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  Tab,
  Tabs,
  Typography,
  useTheme,
} from "@mui/material";
import QueCard from "./QueCard";

const StatsAndList = ({
  lang,
  allQue,
  total,
  hasMore,
  onLoadMore,
  onReply,
  onDelete,
}) => {
  const theme = useTheme();
  const [tab, setTab] = React.useState(0);

  const pendingCount = allQue.filter((q) => !q.ans).length;
  const repliedCount = allQue.filter((q) => !!q.ans).length;

  const filtered = allQue.filter((q) => {
    if (tab === 1) return !q.ans;
    if (tab === 2) return !!q.ans;
    return true;
  });

  const STATS = [
    {
      label: lang?.totalQueries || "Total Queries",
      value: total,
      color: "info",
    },
    {
      label: lang?.pending || "Pending",
      value: pendingCount,
      color: "warning",
    },
    {
      label: lang?.replied || "Replied",
      value: repliedCount,
      color: "success",
    },
  ];

  return (
    <Grid container spacing={3}>
      {/* Stats row */}
      <Grid item xs={12}>
        <Grid container spacing={2}>
          {STATS.map((stat) => (
            <Grid item xs={12} sm={4} key={stat.label}>
              <Card
                sx={{
                  borderRadius: 3,
                  border: `1px solid ${alpha(theme.palette[stat.color].main, 0.2)}`,
                  bgcolor: alpha(theme.palette[stat.color].main, 0.04),
                }}
              >
                <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
                  <Typography
                    variant="h4"
                    fontWeight={800}
                    color={`${stat.color}.main`}
                  >
                    {stat.value}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    fontWeight={600}
                  >
                    {stat.label}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Grid>

      {/* Tabbed list */}
      <Grid item xs={12}>
        <Card
          sx={{
            borderRadius: 3,
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: `0 4px 24px ${alpha(theme.palette.common.black, 0.06)}`,
          }}
        >
          <CardContent sx={{ p: 3 }}>
            {/* Tabs */}
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              sx={{ mb: 3, borderBottom: `1px solid ${theme.palette.divider}` }}
            >
              <Tab
                label={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <span>{lang?.all || "All"}</span>
                    <Chip
                      label={total}
                      size="small"
                      sx={{ height: 18, fontSize: "0.62rem" }}
                    />
                  </Stack>
                }
              />
              <Tab
                label={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <span>{lang?.pending || "Pending"}</span>
                    {pendingCount > 0 && (
                      <Chip
                        label={pendingCount}
                        size="small"
                        color="warning"
                        sx={{ height: 18, fontSize: "0.62rem" }}
                      />
                    )}
                  </Stack>
                }
              />
              <Tab
                label={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <span>{lang?.replied || "Replied"}</span>
                    {repliedCount > 0 && (
                      <Chip
                        label={repliedCount}
                        size="small"
                        color="success"
                        sx={{ height: 18, fontSize: "0.62rem" }}
                      />
                    )}
                  </Stack>
                }
              />
            </Tabs>

            {/* Empty state */}
            {filtered.length === 0 && (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  py: 6,
                  gap: 1,
                }}
              >
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    bgcolor: alpha(theme.palette.text.secondary, 0.06),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <SupportAgent sx={{ fontSize: 28, color: "text.disabled" }} />
                </Box>
                <Typography
                  variant="body2"
                  color="text.disabled"
                  fontWeight={600}
                >
                  {lang?.noQueriesFound || "No queries found"}
                </Typography>
              </Box>
            )}

            {/* Cards */}
            <Stack spacing={1.5}>
              {filtered.map((item) => (
                <QueCard
                  key={item.id}
                  item={item}
                  lang={lang}
                  theme={theme}
                  onReply={onReply}
                  onDelete={onDelete}
                />
              ))}
            </Stack>

            {/* Load more */}
            {hasMore && (
              <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
                <Button
                  variant="outlined"
                  onClick={onLoadMore}
                  sx={{ borderRadius: 2, fontWeight: 700, px: 4 }}
                >
                  {lang?.loadMore || "Load More"}
                  <Chip
                    label={`${total - allQue.length} ${lang?.more || "more"}`}
                    size="small"
                    sx={{ ml: 1, height: 18, fontSize: "0.62rem" }}
                  />
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default StatsAndList;
