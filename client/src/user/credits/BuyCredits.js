import React from "react";
import { useHistory } from "react-router-dom";
import PageHeader from "../../common/PageHeader";
import { GlobalContext } from "../../context/GlobalContext";
import { useCurrency } from "../../context/CurrencyContext";
import {
  AccountBalanceWalletOutlined,
  ArrowForwardOutlined,
  CheckCircle,
  TokenOutlined,
} from "@mui/icons-material";
import {
  alpha,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";

const BuyCredits = ({ lang }) => {
  const { hitAxios } = React.useContext(GlobalContext);
  const { formatPrice } = useCurrency();
  const history = useHistory();
  const theme = useTheme();
  const [packages, setPackages] = React.useState([]);

  const fetchPackages = React.useCallback(async () => {
    const res = await hitAxios({
      path: "/api/credit-package/get_all",
      admin: false,
      post: false,
    });
    if (res?.data?.success) setPackages(res.data.data || []);
  }, [hitAxios]);

  React.useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  return (
    <Box>
      <PageHeader
        title={lang?.buyCredits || "Buy Credits"}
        subtitle={
          lang?.buyCreditsSub ||
          "Top up your account balance without changing your current plan"
        }
        icon={AccountBalanceWalletOutlined}
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
                <Stack spacing={2.5}>
                  <Stack direction="row" justifyContent="space-between" gap={1}>
                    <Typography variant="h6" fontWeight={800}>
                      {creditPackage.title}
                    </Typography>
                    {creditPackage.popular === 1 && (
                      <Chip size="small" color="primary" label="Popular" />
                    )}
                  </Stack>

                  <Box>
                    <Typography variant="h3" color="success.main" fontWeight={800}>
                      {formatPrice(creditPackage.price)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {lang?.oneTimePayment || "One-time payment"}
                    </Typography>
                  </Box>

                  <Box
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

                  <Button
                    fullWidth
                    variant="contained"
                    endIcon={<ArrowForwardOutlined />}
                    startIcon={<TokenOutlined />}
                    onClick={() =>
                      history.push(`/checkout/credits/${creditPackage.id}`)
                    }
                    sx={{ borderRadius: 2, py: 1.2, fontWeight: 700 }}
                  >
                    {lang?.purchaseCredits || "Purchase Credits"}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}

        {packages.length === 0 && (
          <Grid item xs={12}>
            <Box
              p={4}
              textAlign="center"
              border={`1px solid ${theme.palette.divider}`}
              borderRadius={3}
            >
              <Typography color="text.secondary">
                {lang?.noCreditPackages ||
                  "No credit packages are available right now."}
              </Typography>
            </Box>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default BuyCredits;
