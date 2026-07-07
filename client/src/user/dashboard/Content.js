import React from "react";
import Influencers from "../influencers/Influencers";
import { TranslateContext } from "../../context/TranslateContext";
import Gallery from "../gallery/Gallery";
import ContentComp from "../content/Content";
import ScriptVideo from "../scripVideo/ScriptVideo";
import Support from "../support/Support";
import Usage from "../usage/Usage";
import Notification from "../notification/Notification";
import Logout from "../logout/Logout";
import Dash from "./Dash";
import LinkInstagram from "../linkInsta/LinkInstagram";
import LinkTiktok from "../linktiktok/LinkTiktok";
import SocialPublishing from "../socialPublishing/SocialPublishing";
import SocialPublishHistory from "../socialPublishHistory/SocialPublishHistory";
import TalkingVideo from "../talkingVideo/TalkingVideo";
import BuyCredits from "../credits/BuyCredits";
import Referrals from "../referrals/Referrals";

const Content = ({ selectedMenu, web }) => {
  const { lang } = React.useContext(TranslateContext);

  return (
    <div>
      {selectedMenu === "dashboards" && <Dash lang={lang} />}
      {selectedMenu === "influencers" && <Influencers lang={lang} />}
      {selectedMenu === "gallery" && <Gallery lang={lang} />}
      {selectedMenu === "content" && <ContentComp lang={lang} />}
      {selectedMenu === "script-to-video" && <ScriptVideo lang={lang} />}
      {selectedMenu === "usage" && <Usage lang={lang} />}
      {selectedMenu === "buy-credits" && <BuyCredits lang={lang} />}
      {selectedMenu === "referrals" && <Referrals lang={lang} />}
      {selectedMenu === "notification" && <Notification lang={lang} />}
      {selectedMenu === "help" && <Support lang={lang} />}
      {selectedMenu === "logout" && <Logout lang={lang} />}
      {selectedMenu === "link-instagram" && <LinkInstagram lang={lang} />}
      {selectedMenu === "link-tiktok" && <LinkTiktok lang={lang} />}
      {selectedMenu === "social-publishing" && <SocialPublishing lang={lang} />}
      {selectedMenu === "social-publishing-history" && (
        <SocialPublishHistory lang={lang} />
      )}
      {selectedMenu === "talking-video" && <TalkingVideo lang={lang} />}
    </div>
  );
};

export default Content;
