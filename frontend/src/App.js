import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Lenis from "lenis";
import { getPhaseGold, getPhaseRed } from "@/utils/moonphase";
import { Toaster } from "sonner";
import "@/App.css";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import PAGE_TITLES from "@/data/pageTitles.json";
import Home from "@/pages/Home";

// Other pages load as separate files so the home page downloads less up front.
const loadWork = () => import("@/pages/Work");
const loadAbout = () => import("@/pages/About");
const loadEnquiry = () => import("@/pages/Enquiry");
const Work = lazy(loadWork);
const About = lazy(loadAbout);
const Enquiry = lazy(loadEnquiry);

const ScrollManager = () => {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      setTimeout(() => {
        document.querySelector(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 350);
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);
  // Each page has its own browser-tab title (also written into the page files at build time).
  useEffect(() => {
    document.title = PAGE_TITLES[pathname.replace(/\/$/, "") || "/"] || PAGE_TITLES["/"];
  }, [pathname]);
  return null;
};

function App() {
  useEffect(() => {
    document.documentElement.style.setProperty("--gold", getPhaseGold());
    document.documentElement.style.setProperty("--red", getPhaseRed());
  }, []);

  // Fetch the other pages in the background once the first page has settled, so moving
  // between pages stays instant.
  useEffect(() => {
    const prefetch = () => {
      loadWork();
      loadAbout();
      loadEnquiry();
    };
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(prefetch, { timeout: 4000 });
      return () => window.cancelIdleCallback(id);
    }
    const timer = setTimeout(prefetch, 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.95 });
    const raf = (time) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };
    const id = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(id);
      lenis.destroy();
    };
  }, []);

  return (
    <div className="grain min-h-screen bg-[#08080B] text-[#F4F1EA]">
      <BrowserRouter>
        <ScrollManager />
        <Nav />
        <Suspense fallback={<div className="min-h-screen" />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/work" element={<Work />} />
            <Route path="/about" element={<About />} />
            <Route path="/enquiry" element={<Enquiry />} />
          </Routes>
        </Suspense>
        <Footer />
      </BrowserRouter>
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: { background: "#13131A", border: "1px solid rgba(212,175,55,0.35)", color: "#F4F1EA" },
        }}
      />
    </div>
  );
}

export default App;
