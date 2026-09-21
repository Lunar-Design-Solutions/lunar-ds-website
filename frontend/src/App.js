import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Lenis from "lenis";
import { getPhaseGold } from "@/utils/moonphase";
import { Toaster } from "sonner";
import "@/App.css";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import Home from "@/pages/Home";
import Work from "@/pages/Work";
import About from "@/pages/About";
import Enquiry from "@/pages/Enquiry";

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
  return null;
};

function App() {
  useEffect(() => {
    document.documentElement.style.setProperty("--gold", getPhaseGold());
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
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/work" element={<Work />} />
          <Route path="/about" element={<About />} />
          <Route path="/enquiry" element={<Enquiry />} />
        </Routes>
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
