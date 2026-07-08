import React from "react";
import WebTheme from "../web-theme/WebTheme";
import Users from "../users/Users";
import { TranslateContext } from "../../context/TranslateContext";
import ManagePlans from "../manage-plans/ManagePlans";
import Templates from "../templates/Templates";
import SupportAdmin from "../support/SupportAdmin";
import TaskPricing from "../taskPrice/TaskPricing";
import PromptTemplate from "../prompttemp/PromptTemplate";
import AiProviders from "../aiProvider/AiProviders";
import EmailSettings from "../emailSettings/EmailSettings";
import EmailTemplates from "../emailTemplates/EmailTemplates";
import PaymentGateway from "../paymentGateway/PaymentGateway";
import ManageCreditPackages from "../credit-packages/ManageCreditPackages";
import Blogs from "../blogs/Blogs";
import SiteSettings from "../siteSettings/SiteSettings";
import Leads from "../leads/Leads";
import WebTranslation from "../webTranslation/WebTranslation";
import Dash from "./Dash";
import Orders from "../orders/Orders";
import SocialLogin from "../socialLogin/SocialLogin";
import UpdateApp from "../updateaApp/UpdateApp";
import InstaConfig from "../instaConfig/InstaConfig";
import TiktokConfig from "../tiktokConfig/TiktokConfig";
import LaunchpadSettings from "../launchpad/LaunchpadSettings";

const Content = ({ selectedMenu, web }) => {
  const { lang } = React.useContext(TranslateContext);

  return (
    <div>
      {selectedMenu === "dashboards" && <Dash lang={lang} />}
      {selectedMenu === "users" && <Users lang={lang} />}
      {selectedMenu === "plans" && <ManagePlans lang={lang} />}
      {selectedMenu === "credit-packages" && (
        <ManageCreditPackages lang={lang} />
      )}
      {selectedMenu === "templates" && <Templates lang={lang} />}
      {selectedMenu === "web-theme" && <WebTheme lang={lang} />}
      {selectedMenu === "task-pricing" && <TaskPricing lang={lang} />}
      {selectedMenu === "prompt-template" && <PromptTemplate lang={lang} />}
      {selectedMenu === "ai-provider" && <AiProviders lang={lang} />}
      {selectedMenu === "payment-gateway" && <PaymentGateway lang={lang} />}
      {selectedMenu === "launchpad" && <LaunchpadSettings lang={lang} />}
      {selectedMenu === "email-settings" && <EmailSettings lang={lang} />}
      {selectedMenu === "email-templates" && <EmailTemplates lang={lang} />}
      {selectedMenu === "blogs" && <Blogs lang={lang} />}
      {selectedMenu === "leads" && <Leads lang={lang} />}
      {selectedMenu === "orders" && <Orders lang={lang} />}
      {selectedMenu === "site-settings" && (
        <SiteSettings lang={lang} web={web} />
      )}
      {selectedMenu === "help" && <SupportAdmin lang={lang} />}
      {selectedMenu === "web-translation" && <WebTranslation lang={lang} />}
      {selectedMenu === "social-login" && <SocialLogin lang={lang} />}
      {selectedMenu === "update" && <UpdateApp lang={lang} />}
      {selectedMenu === "instagram-config" && <InstaConfig lang={lang} />}
      {selectedMenu === "tiktok-config" && <TiktokConfig lang={lang} />}
    </div>
  );
};

export default Content;
