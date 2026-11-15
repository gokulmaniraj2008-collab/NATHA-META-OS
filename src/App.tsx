import { useEffect, useState } from "react";
import Dashboard from "./Dashboard";
import {
  ArrowRight, ArrowUpRight, Bot, Check, ChevronRight, CircleHelp,
  Command, Instagram, LayoutDashboard, LockKeyhole, Menu, MessageCircle,
  MessageSquareText, Plug, ShieldCheck, Sparkles, Users, X, Zap
} from "lucide-react";

type View = "home" | "dashboard";
type BackendStatus = "checking" | "online" | "offline";
const API_BASE_URL = "https://natha-ai.gokulmaniraj2008.workers.dev";

function App() {
  const [view, setView] = useState<View>("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [backendStatus, setBackendStatus] = useState<BackendStatus>("checking");
  const [aiEnabled, setAiEnabled] = useState(false);

  const checkBackend = async () => {
    setBackendStatus("checking");
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (!response.ok) throw new Error("Backend health check failed");
      const data = await response.json();
      if (data?.bot !== "NATHA AI" || data?.status !== "online") throw new Error("Unexpected backend response");
      setAiEnabled(Boolean(data.ai_enabled));
      setBackendStatus("online");
    } catch {
      setAiEnabled(false);
      setBackendStatus("offline");
    }
  };

  useEffect(() => {
    if (view === "dashboard") void checkBackend();
  }, [view]);

  const openDashboard = () => {
    setView("dashboard");
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3600);
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" onClick={() => setView("home")}>
          <span className="brand-mark"><Command size={19} /></span>
          <span>NATHA<span className="brand-light"> META OS</span></span>
        </a>
        <button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
          {menuOpen ? <X /> : <Menu />}
        </button>
        <nav className={menuOpen ? "nav-links nav-open" : "nav-links"}>
          {view === "home" ? <>
            <a href="#platform" onClick={() => setMenuOpen(false)}>Platform</a>
            <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a>
            <a href="#security" onClick={() => setMenuOpen(false)}>Security</a>
          </> : <button className="nav-text" onClick={() => setView("home")}>Back to website</button>}
          <button className="button button-small button-outline" onClick={openDashboard}>Open dashboard <ArrowUpRight size={15} /></button>
        </nav>
      </header>

      {view === "home" ? <main>
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow"><span className="pulse" /> THE CONVERSATION OPERATING SYSTEM</div>
            <h1>Your Instagram.<br /><span>In intelligent hands.</span></h1>
            <p className="hero-lead">Turn Instagram conversations into meaningful customer relationships. One workspace for smarter replies, organized messages, and business growth.</p>
            <div className="hero-actions">
              <button className="button button-primary" onClick={openDashboard}>Explore workspace <ArrowRight size={17} /></button>
              <a className="button button-ghost" href="#platform">Discover the platform <ChevronRight size={17} /></a>
            </div>
            <div className="trust-line"><ShieldCheck size={16} /> Built around official Meta authorization</div>
          </div>
          <div className="hero-visual">
            <div className="orbit orbit-one" /><div className="orbit orbit-two" />
            <div className="glow" />
            <div className="core-card">
              <div className="core-top"><span className="live-dot" /> NATHA AI <span className="core-tag">ASSISTANT</span></div>
              <div className="core-icon"><Bot size={36} /></div>
              <div className="core-title">Conversations, connected.</div>
              <div className="core-sub">Listen · Understand · Respond</div>
              <div className="core-bottom"><span><span className="tiny-dot" /> System concept</span><Sparkles size={15} /></div>
            </div>
            <div className="float-chip chip-left"><Instagram size={17} /><span>Instagram</span><Check size={14} /></div>
            <div className="float-chip chip-right"><MessageCircle size={17} /><span>Smart replies</span></div>
          </div>
        </section>

        <section className="metrics-strip">
          <div><strong>ONE</strong><span>Unified workspace</span></div>
          <div><strong>AI</strong><span>Conversation assistance</span></div>
          <div><strong>YOU</strong><span>Always in control</span></div>
        </section>

        <section className="section" id="platform">
          <div className="section-heading">
            <div className="eyebrow">A CLEARER WAY TO CONNECT</div>
            <h2>Everything starts with<br /><span>a better conversation.</span></h2>
            <p>Tools designed to help businesses manage Instagram conversations responsibly and efficiently.</p>
          </div>
          <div className="feature-grid">
            <article className="feature-card"><div className="feature-icon violet"><Bot /></div><h3>AI conversation assistant</h3><p>Help craft useful replies with language-aware AI assistance. Keep your business voice at the center.</p><span className="feature-number">01 / ASSIST</span></article>
            <article className="feature-card"><div className="feature-icon blue"><MessageSquareText /></div><h3>Unified message workspace</h3><p>A focused place to review conversations, understand context, and plan customer responses.</p><span className="feature-number">02 / ORGANIZE</span></article>
            <article className="feature-card"><div className="feature-icon green"><Plug /></div><h3>Official account connection</h3><p>Connect eligible professional accounts through Meta's authorization flow. Each business owns its connection.</p><span className="feature-number">03 / CONNECT</span></article>
          </div>
        </section>

        <section className="workflow-section" id="how-it-works">
          <div className="workflow-copy"><div className="eyebrow">SIMPLE BY DESIGN</div><h2>From first hello<br />to lasting loyalty.</h2><p>NATHA META OS is being built in careful stages: secure account connection first, then useful automation with clear controls.</p><button className="button button-primary" onClick={openDashboard}>Preview the workspace <ArrowRight size={16} /></button></div>
          <div className="steps">
            <div className="step"><span>01</span><div><h3>Connect your account</h3><p>Authorize your eligible Instagram professional account with Meta.</p></div><Instagram /></div>
            <div className="step"><span>02</span><div><h3>Configure your assistant</h3><p>Set the tone, language, and response rules for your business.</p></div><Sparkles /></div>
            <div className="step"><span>03</span><div><h3>Stay in control</h3><p>Review activity and choose how your customer conversations are handled.</p></div><ShieldCheck /></div>
          </div>
        </section>

        <section className="security-section" id="security">
          <div className="security-icon"><LockKeyhole size={25} /></div>
          <div><div className="eyebrow">SECURITY IS A FOUNDATION</div><h2>Your account. Your permission. Your data.</h2><p>Each customer will connect their own account using Meta authorization. Credentials will be handled by the secure backend, never placed in this public source repository.</p></div>
          <div className="security-points"><span><Check size={15} /> Per-customer authorization</span><span><Check size={15} /> Protected server-side secrets</span><span><Check size={15} /> Clear control over automation</span></div>
        </section>

        <section className="cta-section">
          <div className="eyebrow">THE NEXT ERA OF CUSTOMER CONVERSATIONS</div>
          <h2>Make every conversation<br /><span>count.</span></h2>
          <button className="button button-primary" onClick={openDashboard}>Enter NATHA META OS <ArrowRight size={17} /></button>
        </section>
      </main> : <Dashboard onBack={() => setView("home")} />}

      <footer className="footer"><a className="brand" href="#" onClick={() => setView("home")}><span className="brand-mark"><Command size={16} /></span><span>NATHA<span className="brand-light"> META OS</span></span></a><span>Intelligent conversations. Built with control.</span><span>© 2026 NATHA META OS</span></footer>
      {notice && <div className="toast"><ShieldCheck size={17} />{notice}<button onClick={() => setNotice("")} aria-label="Dismiss"><X size={15} /></button></div>}
    </div>
  );
}

export default App;
