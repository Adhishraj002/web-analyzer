import { useState, useEffect, useRef } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Bar } from "react-chartjs-2";
import supabase from "./supabaseClient";
import { motion, useInView } from "framer-motion";
import CountUp from "react-countup";
import { toast } from "react-hot-toast";

/* ─── Inline Spinner (no extra package needed) ─── */
const Spinner = () => (
  <svg
    width="18" height="18" viewBox="0 0 38 38"
    stroke="#fff"
    style={{ animation: "spin360 0.7s linear infinite", display: "block" }}
  >
    <g fill="none" fillRule="evenodd">
      <g transform="translate(1 1)" strokeWidth="2">
        <circle strokeOpacity=".3" cx="18" cy="18" r="18" />
        <path d="M36 18c0-9.94-8.06-18-18-18" />
      </g>
    </g>
  </svg>
);

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

/* ─── Animation Variants ───────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 36 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } }
};

/* ─── Feature Data ─────────────────────────────────────────── */
const FEATURES = [
  {
    icon: "🔍",
    color: "blue",
    title: "Deep SEO Audit",
    desc: "Analyze meta tags, headings, canonical URLs, structured data & keyword density in seconds."
  },
  {
    icon: "⚡",
    color: "orange",
    title: "Performance Scan",
    desc: "Lighthouse-powered performance scoring with Core Web Vitals, load times & resource breakdown."
  },
  {
    icon: "♿",
    color: "purple",
    title: "Accessibility Check",
    desc: "WCAG-compliant audit covering contrast ratios, ARIA labels, keyboard navigation & more."
  },
  {
    icon: "🤖",
    color: "cyan",
    title: "AI Chat Consultant",
    desc: "Ask our GPT-powered assistant anything about your audit — get instant, expert advice."
  },
  {
    icon: "📊",
    color: "pink",
    title: "Competitor Benchmark",
    desc: "Automatically scan rival websites and compare their scores side-by-side with yours."
  },
  {
    icon: "📄",
    color: "green",
    title: "PDF Export Report",
    desc: "Download a polished, branded PDF audit report to share with your team or clients."
  }
];



/* ─── How-It-Works Data ────────────────────────────────────── */
const HOW_STEPS = [
  { n: "01", title: "Enter Your URL", desc: "Paste any website URL into our analyzer — no sign-up needed for the first scan." },
  { n: "02", title: "AI Scans & Scores", desc: "Our engine runs Lighthouse + AI analysis , scoring every category." },
  { n: "03", title: "Get Actionable Fixes", desc: "Review your detailed report, chat with our AI consultant and export a branded PDF." }
];

/* ─── Trusted brand names (marquee) ────────────────────────── */
const BRANDS = [
  "🏆 Startups", "🚀 Agencies", "💼 Enterprises", "🎨 Designers",
  "👨‍💻 Developers", "📈 SEO Teams", "🛒 E-Commerce", "🏧 FinTech",
  "🎓 EdTech", "🏥 HealthTech"
];

/* ─── Animated Section wrapper ──────────────────────────────── */
function AnimSection({ children, className }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      variants={stagger}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Main App ──────────────────────────────────────────────── */
function App() {

  const [url, setUrl] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const [chat, setChat] = useState([]);
  const [question, setQuestion] = useState("");
  const [competitors, setCompetitors] = useState([]);
  const [expanded, setExpanded] = useState(false);

  const analyzerRef = useRef(null);

  /* ── Auth ── */
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_e, session) => setUser(session?.user || null)
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => { if (user) fetchHistory(); }, [user]);

  const signUp = async () => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert(error.message);
    else alert("Check your email to confirm account!");
  };
  const signIn = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    else setUser(data.user);
  };
  const signOut = async () => { await supabase.auth.signOut(); setUser(null); };

  /* ── Analyze ── */
  const analyze = async () => {
    if (!user) { toast.error("Login required"); return; }
    setExpanded(true);
    setLoading(true);
    try {
      let fixedUrl = url;
      if (!fixedUrl.startsWith("http")) fixedUrl = "https://" + fixedUrl;
      try { new URL(fixedUrl); } catch { alert("Invalid URL format"); setLoading(false); return; }

      const res = await axios.post(
        "http://localhost:5000/analyze",
        { url: fixedUrl },
        { headers: { userid: user.id } }
      );
      setResult(res.data);
      fetchHistory();

      try {
        const comp = await axios.post("http://localhost:5000/competitors", { url: fixedUrl });
        setCompetitors(comp.data);
      } catch { /* skip silently */ }

      toast.success("Analysis complete ✅");
    } catch (err) {
      console.error(err);
      alert(err.response?.data || err.message);
    }
    setLoading(false);
  };

  /* ── AI Chat ── */
  const askAI = async () => {
    if (!question || !result) return;
    const userMsg = { role: "user", text: question };
    setChat(prev => [...prev, userMsg]);
    const compact = {
      score: result.score, issues: result.issues, suggestions: result.suggestions,
      loadTime: result.rawData?.loadTime, brokenLinks: result.rawData?.brokenLinks,
      inputsWithoutLabel: result.rawData?.inputsWithoutLabel
    };
    const res = await axios.post("http://localhost:5000/ai-chat", { scanData: compact, question });
    setChat(prev => [...prev, { role: "ai", text: res.data.reply }]);
    setQuestion("");
  };

  /* ── History ── */
  const fetchHistory = async () => {
    try {
      const res = await axios.get("http://localhost:5000/history", { headers: { userid: user.id } });
      setHistory(res.data);
    } catch { /* skip */ }
  };

  /* ── PDF ── */
  const downloadPDF = async () => {
    if (!result) return;
    const pdf = new jsPDF("p", "mm", "a4");
    const margin = 20; let y = 20;
    pdf.setFontSize(20); pdf.text("AI Website Audit Report", margin, y); y += 10;
    pdf.setFontSize(10); pdf.text(`URL: ${url}`, margin, y); y += 6;
    pdf.text(`Generated: ${new Date().toLocaleString()}`, margin, y); y += 12;
    pdf.setFontSize(16); pdf.text("Overall Score", margin, y); y += 12;
    pdf.setFontSize(30); pdf.text(`${result.score}/100`, margin, y); y += 15;
    pdf.setFontSize(14); pdf.text("Category Breakdown", margin, y); y += 8;
    pdf.setFontSize(11);
    pdf.text(`Performance: ${result.performance}`, margin, y); y += 6;
    pdf.text(`Accessibility: ${result.accessibility}`, margin, y); y += 6;
    pdf.text(`SEO: ${result.seo}`, margin, y); y += 6;
    pdf.text(`Best Practices: ${result.bestPractices}`, margin, y); y += 12;
    pdf.setFontSize(14); pdf.text("Detected Issues", margin, y); y += 8;
    pdf.setFontSize(11);
    if (result.issues.length === 0) { pdf.text("No major issues detected.", margin, y); y += 6; }
    else result.issues.forEach(i => { pdf.text(`• ${i}`, margin, y); y += 6; });
    y += 6;
    pdf.setFontSize(14); pdf.text("Recommendations", margin, y); y += 8;
    pdf.setFontSize(11);
    result.suggestions.forEach(s => { pdf.text(`• ${s}`, margin, y); y += 6; });
    y += 10;
    if (competitors.length > 0) {
      if (y > 260) { pdf.addPage(); y = 20; }
      pdf.setFontSize(14); pdf.text("Competitor Benchmark", margin, y); y += 8;
      pdf.setFontSize(11);
      competitors.forEach(c => { pdf.text(`${c.url} — Score: ${Math.round(c.score)}`, margin, y); y += 6; });
    }
    if (result.aiReport) {
      pdf.addPage(); y = 20;
      pdf.setFontSize(16); pdf.text("AI Expert Analysis", margin, y); y += 10;
      pdf.setFontSize(11);
      const splitText = pdf.splitTextToSize(result.aiReport, 170);
      pdf.text(splitText, margin, y);
    }
    pdf.save("AI-Website-Audit-Report.pdf");
  };

  /* ── Chart ── */
  const chartData = result ? {
    labels: ["Performance", "Accessibility", "SEO", "Best Practices"],
    datasets: [{
      label: "Audit Breakdown",
      data: [result.performance, result.accessibility, result.seo, result.bestPractices],
      backgroundColor: ["#4caf50", "#ff9800", "#2196f3", "#9c27b0"]
    }]
  } : null;

  /* ─────────────── JSX ─────────────── */
  return (
    <>
      {/* ════════════════ HERO ════════════════ */}
      <section className="hero-section">
        {/* Background layers */}
        <div className="hero-bg-layer" />
        <div className="hero-grid-overlay" />
        <div className="orb orb--1" />
        <div className="orb orb--2" />
        <div className="orb orb--3" />

        <div className="hero-content">

          {/* ── Left: Text ── */}
          <div className="hero-text">
            <div className="hero-badge">
              <span className="hero-badge-dot" />
              AI-Powered Website Intelligence
            </div>

            <h1 className="hero-title">
              <span className="hero-title-line1">Analyze. Optimize.</span>
              <span className="hero-title-line2">Dominate.</span>
            </h1>

            <p className="hero-subtitle">
              Get a full SEO, Performance, Accessibility & AI audit for any website.
            </p>

            <div className="hero-cta-row">
              <button
                className="btn-hero"
                onClick={() => analyzerRef.current?.scrollIntoView({ behavior: "smooth" })}
              >
                🚀 Start Free Analysis
              </button>
              <button className="btn-hero-outline">
                📄 See Sample Report
              </button>
            </div>
          </div>

          {/* ── Right: 3D Avatar ── */}
          <div className="hero-avatar-wrap">
            <div className="hero-avatar-ring" />
            <div className="hero-avatar-ring2" />
            <div className="hero-avatar-glow" />

            {/* Floating Info Badges */}
            <div className="avatar-badge avatar-badge--score">
              <span className="avatar-badge-icon">🎯</span> Score: 98/100
            </div>
            <div className="avatar-badge avatar-badge--ai">
              <span className="avatar-badge-icon">🤖</span> AI Active
            </div>
            <div className="avatar-badge avatar-badge--speed">
              <span className="avatar-badge-icon">⚡</span> 2.1s Load
            </div>

            {/* Avatar Image — AI Robot / Developer */}
            <div className="hero-avatar-img">
              <img
                src="https://images.unsplash.com/photo-1677442135703-1787eea5ce01?auto=format&fit=crop&w=800&q=90"
                alt="AI Avatar"
                loading="eager"
              />
            </div>
          </div>

        </div>
      </section>

      {/* ════════════════ TRUSTED BY (MARQUEE) ════════════════ */}
      <div className="trusted-section">
        <p className="trusted-label">Trusted by teams worldwide</p>
        <div className="marquee-track">
          {[...BRANDS, ...BRANDS].map((b, i) => (
            <span key={i} className="marquee-item">{b}</span>
          ))}
        </div>
      </div>


      {/* ════════════════ FEATURES ════════════════ */}
      <AnimSection className="features-section">
        <div className="features-inner">
          <div className="section-heading-wrap">
            <motion.span variants={fadeUp} className="section-kicker">Everything You Need</motion.span>
            <motion.h2 variants={fadeUp} className="section-title">
              Powerful Features,{" "}
              <span className="section-title-accent">Zero Complexity</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="section-desc">
              One tool to audit SEO, performance, accessibility, and more.
              Built for developers, agencies, and growth teams.
            </motion.p>
          </div>

          <div className="features-grid">
            {FEATURES.map((f, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className={`feature-card feature-card--${f.color}`}
              >
                <div className={`feature-icon-wrap feature-icon-wrap--${f.color}`}>
                  {f.icon}
                </div>
                <div className="feature-card-title">{f.title}</div>
                <div className="feature-card-desc">{f.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimSection>

      {/* ════════════════ HOW IT WORKS ════════════════ */}
      <AnimSection className="how-section">
        <div className="how-inner">
          <div className="section-heading-wrap">
            <motion.span variants={fadeUp} className="section-kicker">Simple Process</motion.span>
            <motion.h2 variants={fadeUp} className="section-title">
              How It <span className="section-title-accent">Works</span>
            </motion.h2>
          </div>
          <div className="how-grid">
            {HOW_STEPS.map((s, i) => (
              <motion.div key={i} variants={fadeUp} className="how-step">
                <div className="how-step-number">{s.n}</div>
                <div className="how-step-title">{s.title}</div>
                <div className="how-step-desc">{s.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimSection>

      {/* ════════════════ ANALYZER ════════════════ */}
      <section className="analyzer-section" ref={analyzerRef} id="analyzer">
        <div className="analyzer-section-inner">

          <AnimSection>
            <div className="section-heading-wrap">
              <motion.span variants={fadeUp} className="section-kicker">Live Scanner</motion.span>
              <motion.h2 variants={fadeUp} className="section-title">
                Analyze Your <span className="section-title-accent">Website Now</span>
              </motion.h2>
              <motion.p variants={fadeUp} className="section-desc">
                Enter any URL below to receive a full AI-powered audit report instantly.
              </motion.p>
            </div>
          </AnimSection>

          {/* ── Auth Card ── */}
          {!user && (
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="glass"
              style={{ padding: "2rem", maxWidth: 460, marginInline: "auto", marginBottom: "2rem" }}
            >
              <h3 style={{ marginTop: 0, marginBottom: "1rem" }}>🔐 Sign in to Analyze</h3>
              <input
                className="input-modern"
                placeholder="Email address"
                onChange={e => setEmail(e.target.value)}
              />
              <input
                className="input-modern"
                type="password"
                placeholder="Password"
                onChange={e => setPassword(e.target.value)}
              />
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button onClick={signUp} style={{ flex: 1 }}>Sign Up</button>
                <button onClick={signIn} style={{ flex: 1 }}>Login</button>
              </div>
            </motion.div>
          )}

          {/* ── Main Analyzer Card ── */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className={`glass analyzer-transition ${expanded ? "expanded" : ""}`}
            style={{ padding: "2.5rem", position: "relative" }}
          >
            {user && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%",
                    background: "linear-gradient(135deg,#38bdf8,#a855f7)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "1rem", fontWeight: 700, color: "#fff"
                  }}>
                    {user.email?.[0]?.toUpperCase() ?? "U"}
                  </div>
                  <span style={{ color: "#94a3b8", fontSize: "0.9rem" }}>{user.email}</span>
                </div>
                <button
                  onClick={signOut}
                  style={{ padding: "0.4rem 1rem", fontSize: "0.85rem", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.35)", color: "#f87171" }}
                >
                  Logout
                </button>
              </div>
            )}

            <h2 style={{ marginTop: 0, marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              🌐 Enter Website URL
            </h2>

            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <input
                className="input-modern"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://example.com"
                onKeyDown={e => e.key === "Enter" && analyze()}
                style={{ flex: 1, marginBottom: 0 }}
              />
              <button className="btn-premium" onClick={analyze} disabled={loading}>
                {loading ? <Spinner /> : "⚡ Analyze"}
              </button>
            </div>

            {/* Results */}
            {result && (
              <div id="report" style={{ marginTop: "2rem" }}>

                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
                  <button onClick={downloadPDF} style={{ background: "linear-gradient(135deg,#3b82f6,#6366f1)", border: "none", color: "#fff" }}>
                    📄 Download PDF Report
                  </button>
                </div>

                <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", marginBottom: "2rem" }}>
                  <div className="stat-counter-card" style={{ flex: 1, minWidth: 140 }}>
                    <span className="stat-counter-icon">🏆</span>
                    <div className="stat-counter-value">
                      <CountUp end={result.score} duration={1.5} />
                    </div>
                    <div className="stat-counter-label">Overall Score</div>
                  </div>
                  <div className="stat-counter-card" style={{ flex: 1, minWidth: 140 }}>
                    <span className="stat-counter-icon">⚡</span>
                    <div className="stat-counter-value">
                      <CountUp end={result.performance} duration={1.5} />
                    </div>
                    <div className="stat-counter-label">Performance</div>
                  </div>
                  <div className="stat-counter-card" style={{ flex: 1, minWidth: 140 }}>
                    <span className="stat-counter-icon">♿</span>
                    <div className="stat-counter-value">
                      <CountUp end={result.accessibility} duration={1.5} />
                    </div>
                    <div className="stat-counter-label">Accessibility</div>
                  </div>
                  <div className="stat-counter-card" style={{ flex: 1, minWidth: 140 }}>
                    <span className="stat-counter-icon">🔍</span>
                    <div className="stat-counter-value">
                      <CountUp end={result.seo} duration={1.5} />
                    </div>
                    <div className="stat-counter-label">SEO</div>
                  </div>
                </div>

                {/* Progress Bars */}
                <div style={{ marginBottom: "1.5rem" }}>
                  {[
                    ["Performance", result.performance],
                    ["Accessibility", result.accessibility],
                    ["SEO", result.seo],
                    ["Best Practices", result.bestPractices]
                  ].map(([label, val]) => (
                    <div key={label} style={{ marginBottom: "0.9rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                        <span style={{ fontSize: "0.88rem", color: "#94a3b8" }}>{label}</span>
                        <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "#e2e8f0" }}>{val}</span>
                      </div>
                      <div className="progress">
                        <div className="progress-fill" style={{ width: `${val}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Site Crawl */}
                {result.crawl && (
                  <div className="glass" style={{ marginTop: 24, padding: 20 }}>
                    <h3>🌐 Site Score: {result.crawl.siteScore}</h3>
                    <p><b>Best Page:</b> {result.crawl.best.url}</p>
                    <p><b>Needs Work:</b> {result.crawl.worst.url}</p>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
                      {result.crawl.pages.map(p => (
                        <div key={p.url} style={{ flex: "1 1 220px", border: "1px solid #1e3a5f", padding: 12, borderRadius: 10 }}>
                          <b style={{ fontSize: "0.8rem", color: "#94a3b8" }}>{p.url}</b>
                          <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#38bdf8" }}>{Math.round(p.score)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Competitors */}
                {competitors.length > 0 && (
                  <div className="glass" style={{ marginTop: 24, padding: 20 }}>
                    <h3>🏁 Competitor Benchmark</h3>
                    {competitors.map(c => (
                      <div key={c.url} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(148,163,184,0.1)" }}>
                        <span style={{ color: "#94a3b8", fontSize: "0.9rem" }}>{c.url}</span>
                        <span style={{ fontWeight: 700, color: "#38bdf8" }}>{Math.round(c.score)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Issues */}
                <div style={{ marginTop: "1.5rem" }}>
                  <h3>⚠️ Detected Issues</h3>
                  <ul>
                    {result.issues?.map((issue, i) => {
                      const color = issue.includes("missing") ? "#f87171"
                        : issue.includes("No") ? "#fbbf24"
                          : "#4ade80";
                      return (
                        <li key={i} style={{ color, marginBottom: 6, fontWeight: 600 }}>{issue}</li>
                      );
                    })}
                  </ul>
                </div>

                {/* Screenshot */}
                {result.rawData?.screenshot && (
                  <div style={{ marginTop: "1.5rem" }}>
                    <h3>🖥️ Website Preview</h3>
                    <img
                      src={`data:image/png;base64,${result.rawData.screenshot}`}
                      alt="Website preview"
                      style={{ width: "100%", borderRadius: 12, marginTop: 10, border: "1px solid rgba(148,163,184,0.15)" }}
                    />
                  </div>
                )}

                {/* AI Report */}
                <div style={{ marginTop: "1.5rem" }}>
                  <h3>🤖 AI Expert Analysis</h3>
                  <div style={{ background: "rgba(15,23,42,0.8)", padding: "1.2rem", borderRadius: 12, whiteSpace: "pre-wrap", fontSize: "0.92rem", lineHeight: 1.7, border: "1px solid rgba(59,130,246,0.2)" }}>
                    {result.aiReport}
                  </div>
                </div>

                {/* Suggestions */}
                <div style={{ marginTop: "1.5rem" }}>
                  <h3>💡 AI Suggestions</h3>
                  <ul>
                    {result.suggestions?.map((s, i) => (
                      <li key={i} style={{ color: "#4ade80", marginBottom: 6 }}>{s}</li>
                    ))}
                  </ul>
                </div>

                {/* Chart */}
                {chartData && (
                  <div style={{ marginTop: "2rem" }}>
                    <h3>📊 Analysis Chart</h3>
                    <Bar data={chartData} />
                  </div>
                )}

                {/* AI Chat */}
                <div style={{ marginTop: "2rem" }}>
                  <h3>💬 AI Website Consultant</h3>
                  <div className="glass" style={{ padding: 20, marginTop: 10 }}>
                    <div style={{ maxHeight: 220, overflowY: "auto", marginBottom: "1rem" }}>
                      {chat.map((c, i) => (
                        <div key={i} style={{ textAlign: c.role === "user" ? "right" : "left", marginBottom: 12 }}>
                          <div style={{
                            display: "inline-block", maxWidth: "80%",
                            padding: "0.6rem 1rem", borderRadius: 12,
                            background: c.role === "user" ? "rgba(59,130,246,0.2)" : "rgba(15,23,42,0.9)",
                            border: "1px solid rgba(148,163,184,0.15)",
                            fontSize: "0.9rem", lineHeight: 1.5,
                            color: "#e2e8f0"
                          }}>
                            <b style={{ color: c.role === "user" ? "#38bdf8" : "#a855f7" }}>
                              {c.role === "user" ? "You" : "AI"}:
                            </b>{" "}
                            {typeof c.text === "string" ? c.text : JSON.stringify(c.text)}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: "0.75rem" }}>
                      <input
                        className="input-modern"
                        value={question}
                        onChange={e => setQuestion(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && askAI()}
                        placeholder="Ask about this website..."
                        style={{ flex: 1, marginBottom: 0 }}
                      />
                      <button className="btn-premium" onClick={askAI}>Ask AI</button>
                    </div>
                  </div>
                </div>

                {/* History */}
                <div style={{ marginTop: "2rem" }}>
                  <h3>🕒 Recent Scans</h3>
                  {history.map((scan, i) => (
                    <div key={i} style={{
                      display: "flex", justifyContent: "space-between",
                      padding: "0.75rem 1rem", borderRadius: 10, marginBottom: 8,
                      background: "rgba(15,23,42,0.7)", border: "1px solid rgba(148,163,184,0.1)"
                    }}>
                      <span style={{ color: "#94a3b8", fontSize: "0.9rem" }}>{scan.url}</span>
                      <span style={{ fontWeight: 700, color: "#38bdf8" }}>{scan.score}/100</span>
                    </div>
                  ))}
                </div>

              </div>
            )}
          </motion.div>

        </div>
      </section>

      {/* ════════════════ FOOTER ════════════════ */}
      <footer style={{
        textAlign: "center",
        padding: "2.5rem 1.5rem",
        borderTop: "1px solid rgba(148,163,184,0.08)",
        color: "#334155",
        fontSize: "0.85rem"
      }}>
        <div style={{ marginBottom: "0.5rem", fontSize: "1rem", fontWeight: 700, color: "#475569" }}>
          🌐 AI Web Analyzer
        </div>
        Built with ❤️ and powered by Lighthouse + GPT &nbsp;·&nbsp; © {new Date().getFullYear()} All rights reserved.
      </footer>
    </>
  );
}

export default App;
