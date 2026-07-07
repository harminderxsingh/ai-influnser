import React from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  ContentCopyOutlined,
  GroupAddOutlined,
  RedeemOutlined,
  TokenOutlined,
} from "@mui/icons-material";
import PageHeader from "../../common/PageHeader";
import { GlobalContext } from "../../context/GlobalContext";

const Referrals = ({ lang }) => {
  const { hitAxios } = React.useContext(GlobalContext);
  const [data, setData] = React.useState(null);
  const [copied, setCopied] = React.useState("");

  const getReferralInfo = React.useCallback(async () => {
    const res = await hitAxios({
      path: "/api/user/referral_info",
      post: false,
      admin: false,
      loading: false,
    });
    if (res.data.success) setData(res.data.data);
  }, [hitAxios]);

  React.useEffect(() => {
    getReferralInfo();
  }, [getReferralInfo]);

  const copyText = async (text, type) => {
    await navigator.clipboard.writeText(text || "");
    setCopied(type);
    setTimeout(() => setCopied(""), 1500);
  };

  const stats = data?.stats || {};
  const referrals = data?.referrals || [];

  return (
    <Box>
      <PageHeader
        title={lang?.referrals || "Referrals"}
        subtitle={
          lang?.referralsSub ||
          "Share your code and earn credits when new users sign up"
        }
        icon={GroupAddOutlined}
      />

      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Stack spacing={1}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <TokenOutlined color="primary" />
                  <Typography variant="overline" color="text.secondary">
                    {lang?.yourReward || "Your Reward"}
                  </Typography>
                </Stack>
                <Typography variant="h4" fontWeight={800}>
                  {data?.referrer_credits || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {lang?.referrerRewardText ||
                    "credits for every successful referral signup"}
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Stack spacing={1}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <RedeemOutlined color="success" />
                  <Typography variant="overline" color="text.secondary">
                    {lang?.friendGets || "New User Gets"}
                  </Typography>
                </Stack>
                <Typography variant="h4" fontWeight={800}>
                  {data?.signup_credits || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {lang?.signupRewardText ||
                    "credits added to the new account on signup"}
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Stack spacing={1}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <GroupAddOutlined color="info" />
                  <Typography variant="overline" color="text.secondary">
                    {lang?.totalReferrals || "Total Referrals"}
                  </Typography>
                </Stack>
                <Typography variant="h4" fontWeight={800}>
                  {stats.total_referrals || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {(stats.total_earned || 0) + " credits earned"}
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Stack spacing={2}>
                {!data?.enabled && (
                  <Alert severity="info">
                    {lang?.referralsDisabled ||
                      "Referral rewards are currently disabled by admin."}
                  </Alert>
                )}
                <TextField
                  fullWidth
                  label={lang?.yourReferralCode || "Your Referral Code"}
                  value={data?.referral_code || ""}
                  InputProps={{ readOnly: true }}
                />
                <TextField
                  fullWidth
                  label={lang?.shareLink || "Share Link"}
                  value={data?.referral_link || ""}
                  InputProps={{ readOnly: true }}
                />
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                  <Button
                    variant="contained"
                    startIcon={<ContentCopyOutlined />}
                    onClick={() => copyText(data?.referral_link, "link")}
                  >
                    {copied === "link"
                      ? lang?.copied || "Copied"
                      : lang?.copyShareLink || "Copy Share Link"}
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<ContentCopyOutlined />}
                    onClick={() => copyText(data?.referral_code, "code")}
                  >
                    {copied === "code"
                      ? lang?.copied || "Copied"
                      : lang?.copyCode || "Copy Code"}
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={2}>
                {lang?.recentReferrals || "Recent Referrals"}
              </Typography>
              <Stack spacing={1}>
                {referrals.length < 1 && (
                  <Typography color="text.secondary">
                    {lang?.noReferralsYet || "No referrals yet."}
                  </Typography>
                )}
                {referrals.map((item) => (
                  <Stack
                    key={item.id}
                    direction={{ xs: "column", sm: "row" }}
                    justifyContent="space-between"
                    spacing={1}
                    sx={{ borderBottom: "1px solid", borderColor: "divider", pb: 1 }}
                  >
                    <Box>
                      <Typography fontWeight={600}>
                        {item.referred_email || item.referred_uid}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(item.createdAt).toLocaleString()}
                      </Typography>
                    </Box>
                    <Chip
                      color="success"
                      label={`+${item.referrer_credits || 0} credits`}
                    />
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Referrals;
