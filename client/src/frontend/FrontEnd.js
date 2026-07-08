import React from "react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import WordsToWorlds from "./components/WordsToWorlds";
import FloatingBadge from "./components/FloatingBadge";
import ModelCard from "./components/ModelCard";
import Pricing from "./components/Pricing";
import TestimonialCard from "./components/TestimonialCard";
import FaqComp from "./components/FaqComp";
import BlogComp from "./components/BlogComp";
import FooterComp from "./components/FooterComp";
import { GlobalContext } from "../context/GlobalContext";
import { TranslateContext } from "../context/TranslateContext";

const FrontEnd = () => {
  const { hitAxios } = React.useContext(GlobalContext);
  const [web, setWeb] = React.useState({});
  const { lang } = React.useContext(TranslateContext);

  async function getWebPublic() {
    const res = await hitAxios({
      path: "/api/web/get_web_public",
      post: false,
      admin: false,
      showLoading: false,
      showSnackbar: false,
    });
    if (res.data.success) {
      setWeb(res.data.data);
    }
  }

  React.useEffect(() => {
    getWebPublic();
  }, []);

  return (
    <div>
      <Header web={web} />

      <section id="overview">
        <Hero lang={lang} web={web} />
      </section>
      <section id="features">
        <WordsToWorlds lang={lang} web={web} />
      </section>
      <FloatingBadge lang={lang} web={web} />
      <ModelCard lang={lang} web={web} />
      <section id="pricing">
        <Pricing lang={lang} web={web} />
      </section>
      <TestimonialCard lang={lang} web={web} />
      <section id="faq">
        <FaqComp lang={lang} web={web} />
      </section>
      <BlogComp />
      <FooterComp web={web} />
    </div>
  );
};

export default FrontEnd;
