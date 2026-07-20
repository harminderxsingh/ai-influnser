import React from "react";
import { Route, Switch } from "react-router-dom";
import { Alert, Snackbar, Box, Backdrop, Dialog } from "@mui/material";
import { GlobalContext } from "./context/GlobalContext";
import PublicRoute from "./routing/PublicRoute";
import AdminRoute from "./routing/AdminRoute";
import UserRoute from "./routing/UserRoute";
import { TranslateContext } from "./context/TranslateContext";
import axios from "axios";
import FrontEnd from "./frontend/FrontEnd";
import Theme from "./frontend/Theme";
import AdminLogin from "./admin/login/AdminLogin";
import LoadingComp from "./LoadingComp";
import AdminDashboard from "./admin/dashboard/AdminDashboard";
import UserLogin from "./user/login/UserLogin";
import UserSignup from "./user/login/UserSignup";
import UserDashboard from "./user/dashboard/UserDashboard";
import BlogView from "./frontend/blogs/BlogView";
import SeoComp from "./SeoComp";
import PrivacyPolicy from "./frontend/pages/PrivacyPolicy";
import TnC from "./frontend/pages/TnC";
import AboutUs from "./frontend/pages/AboutUs";
import ContactUs from "./frontend/pages/ContactUs";
import CheckOut from "./frontend/checkout/CheckOut";
import CheckoutSuccess from "./frontend/checkout/CheckoutSuccess";
import ThankYouPage from "./frontend/ThankYouPage";
import PasswordRecovery from "./frontend/PasswordRecovery";
import AdminPasswordRecovery from "./frontend/AdminPasswordRecovery";
import NotFoundPage from "./frontend/NotFoundPage";
import LaunchpadPage from "./frontend/LaunchpadPage";
import VerifyEmail from "./frontend/VerifyEmail";

const HomeMainPage = () => {
  const GLOBAL_CONTEXT = React.useContext(GlobalContext);
  const LANGUAGE = React.useContext(TranslateContext);

  React.useEffect(() => {
    const code = localStorage.getItem("language");
    if (code) {
      axios
        .get(
          `${process.env.REACT_APP_BASE_URL}/api/web/get-one-translation?code=${code}`,
        )
        .then((res) => {
          if (res.data.notfound) {
            localStorage.removeItem("language");
            alert("Maybe translate file issue.");
            window.location.reload();
            return;
          }
          LANGUAGE.setData({ ...res.data.data });
        })
        .catch((err) => console.log(err));
    } else {
      axios
        .get(
          `${process.env.REACT_APP_BASE_URL}/api/web/get-all-translation-name`,
        )
        .then((lan) => {
          localStorage.setItem(
            "language",
            lan.data.data[0]?.replace(".json", ""),
          );
          axios
            .get(
              `${process.env.REACT_APP_BASE_URL}/api/web/get-one-translation?code=${lan.data.data[0]?.replace(".json", "")}`,
            )
            .then((res) => {
              LANGUAGE.setData({ ...res.data.data });
            })
            .catch((err) => console.log(err));
        });
    }
  }, []);

  return (
    <Box
      sx={{ position: "relative" }}
      color="text.primary"
      minHeight={"100vh"}
      bgcolor="background.default"
    >
      {/* <SeoComp /> */}
      <Dialog
        fullScreen
        sx={{
          color: "#fff",
          zIndex: (theme) => theme.zIndex.modal + 99, // Higher than dialogs
          backdropFilter: "blur(4px)",
        }}
        open={GLOBAL_CONTEXT.data.loading}
      >
        <LoadingComp />
      </Dialog>

      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        open={GLOBAL_CONTEXT?.data?.snack}
        autoHideDuration={4000}
      >
        <Alert
          severity={GLOBAL_CONTEXT.data.snack_success ? "success" : "error"}
        >
          {GLOBAL_CONTEXT.data.snack_msg}
        </Alert>
      </Snackbar>

      <div
        style={{
          opacity: GLOBAL_CONTEXT.data.loading ? 0.25 : 1,
          pointerEvents: GLOBAL_CONTEXT.data.loading ? "none" : "initial",
        }}
      >
        <Switch>
          <PublicRoute path="/" exact component={FrontEnd} />
          <PublicRoute path="/admin/login" exact component={AdminLogin} />
          <AdminRoute path="/admin" exact component={AdminDashboard} />
          <PublicRoute path="/user/login" exact component={UserLogin} />
          <PublicRoute path="/user/signup" exact component={UserSignup} />
          <UserRoute path="/user" exact component={UserDashboard} />
          <PublicRoute path="/blogs" exact component={BlogView} />
          <PublicRoute path="/blogs/:slug" exact component={BlogView} />
          <PublicRoute path="/privacy-policy" exact component={PrivacyPolicy} />
          <PublicRoute path="/terms-and-conditions" exact component={TnC} />
          <PublicRoute path="/about" exact component={AboutUs} />
          <PublicRoute path="/contact" exact component={ContactUs} />
          <PublicRoute
            path="/checkout/success"
            exact
            component={CheckoutSuccess}
          />
          <PublicRoute path="/thank-you" exact component={ThankYouPage} />
          <PublicRoute path="/checkout/credits/:id" exact component={CheckOut} />
          <PublicRoute path="/checkout/:id" exact component={CheckOut} />
          <PublicRoute path="/launchpad" exact component={LaunchpadPage} />
          <PublicRoute path="/launchpad/:slug" exact component={LaunchpadPage} />
          <PublicRoute path="/verify-email" exact component={VerifyEmail} />
          <PublicRoute
            path="/password-recovery"
            exact
            component={PasswordRecovery}
          />
          <PublicRoute
            path="/admin-password-recovery"
            exact
            component={AdminPasswordRecovery}
          />

          <PublicRoute path="/:pagePath/:subPath/:thirdPath" exact component={LaunchpadPage} />
          <PublicRoute path="/:pagePath/:subPath" exact component={LaunchpadPage} />
          <PublicRoute path="/:pagePath" exact component={LaunchpadPage} />
          <PublicRoute path="*" component={NotFoundPage} />
        </Switch>
      </div>
    </Box>
  );
};

export default HomeMainPage;
