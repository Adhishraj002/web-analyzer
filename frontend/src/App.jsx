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

/* ─── Diagnostics Panel ─────────────────────────────────────── */
const STATUS_META = {
  down: { icon: "🔴", label: "Issues Detected", color: "#f87171" },
  warning: { icon: "🟡", label: "Needs Attention", color: "#fbbf24" },
  good: { icon: "🟢", label: "What's Working Well", color: "#4ade80" }
};

function DiagCard({ item }) {
  const [open, setOpen] = useState(false);
  const isActionable = item.status !== "good" && item.fixes.length > 0;

  return (
    <div className={`diag-card diag-card--${item.status}`}>
      <div
        className="diag-card-header"
        onClick={() => isActionable && setOpen(o => !o)}
        style={{ cursor: isActionable ? "pointer" : "default" }}
      >
        {/* Status dot */}
        <span className="diag-good-icon">
          {item.status === "down" ? "🔴" : item.status === "warning" ? "🟡" : "✅"}
        </span>

        <div className="diag-card-header-info">
          <div className="diag-card-issue">{item.issue}</div>
          <div className="diag-card-meta">
            <span className="diag-status-badge diag-status-badge--" style={{
              background: item.status === "down" ? "rgba(239,68,68,0.15)" : item.status === "warning" ? "rgba(245,158,11,0.15)" : "rgba(34,197,94,0.12)",
              color: item.status === "down" ? "#fca5a5" : item.status === "warning" ? "#fcd34d" : "#86efac",
              border: `1px solid ${item.status === "down" ? "rgba(239,68,68,0.3)" : item.status === "warning" ? "rgba(245,158,11,0.3)" : "rgba(34,197,94,0.25)"}`,
              display: "inline-flex", alignItems: "center", gap: "0.3rem",
              padding: "0.18rem 0.6rem", borderRadius: "999px",
              fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase"
            }}>
              {item.status.toUpperCase()}
            </span>
            <span className="diag-cat-badge">{item.category}</span>
            <span className={`diag-impact-badge diag-impact-badge--${item.impact}`}>
              {item.impact} Impact
            </span>
          </div>
        </div>

        {isActionable && (
          <div className={`diag-chevron ${open ? "diag-chevron--open" : ""}`}>
            ▼
          </div>
        )}
      </div>

      {open && isActionable && (
        <div className="diag-fixes-body">
          {item.fixes.map(fix => (
            <div
              key={fix.rank}
              className={`diag-fix-item ${fix.rank === 1 ? "diag-fix-item--best" : ""}`}
            >
              <div className="diag-fix-header">
                <div className={`diag-fix-rank ${fix.rank === 1 ? "diag-fix-rank--best" : ""}`}>
                  {fix.rank}
                </div>
                {fix.rank === 1 && (
                  <span className="diag-fix-best-badge">⭐ Best Method</span>
                )}
                <span className="diag-fix-label">{fix.label}</span>
              </div>
              <div className="diag-fix-method">{fix.method}</div>
              {fix.code && (
                <pre className="diag-code-block">{fix.code}</pre>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DiagnosticsPanel({ diagnostics }) {
  if (!diagnostics || diagnostics.length === 0) return null;

  const sections = ["down", "warning", "good"];

  return (
    <div className="diag-panel">
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
        <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#e2e8f0" }}>🩺 Full Diagnostics Report</h3>
        <span style={{
          padding: "0.2rem 0.65rem", borderRadius: "999px",
          fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.06em",
          background: "rgba(148,163,184,0.12)", color: "#94a3b8"
        }}>{diagnostics.length} checks</span>
      </div>
      <p style={{ margin: "0 0 1rem", fontSize: "0.85rem", color: "#64748b" }}>
        Click any Issue or Warning card to see ranked fix methods — starting with the best approach.
      </p>

      {sections.map(status => {
        const items = diagnostics.filter(d => d.status === status);
        if (items.length === 0) return null;
        const meta = STATUS_META[status];
        return (
          <div key={status}>
            <div className="diag-section-header">
              <span className="diag-section-icon" style={{ color: meta.color }}>{meta.icon}</span>
              <span className="diag-section-title" style={{ color: meta.color }}>{meta.label}</span>
              <span className="diag-section-count">{items.length}</span>
            </div>
            <div className="diag-cards-list">
              {items.map(item => <DiagCard key={item.id} item={item} />)}
            </div>
          </div>
        );
      })}
    </div>
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
    const PW = 210; // page width mm
    const PH = 297; // page height mm
    const ML = 18;  // left margin
    const MR = 18;  // right margin
    const CW = PW - ML - MR; // content width
    const BOTTOM = PH - 18;  // safe bottom
    let y = 0;

    /* ── helpers ── */
    const newPage = () => { pdf.addPage(); y = 28; drawPageFooter(); };
    const checkPage = (need = 20) => { if (y + need > BOTTOM) newPage(); };

    const hex2rgb = hex => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return [r, g, b];
    };

    const setColor = (hex) => { const [r, g, b] = hex2rgb(hex); pdf.setTextColor(r, g, b); };
    const setFill = (hex) => { const [r, g, b] = hex2rgb(hex); pdf.setFillColor(r, g, b); };
    const setDraw = (hex) => { const [r, g, b] = hex2rgb(hex); pdf.setDrawColor(r, g, b); };

    const scoreColor = (v) =>
      v >= 80 ? "#22c55e" : v >= 50 ? "#f59e0b" : "#ef4444";

    /* ── Page footer ── */
    const drawPageFooter = () => {
      const pg = pdf.internal.getNumberOfPages();
      setFill("#0f172a"); pdf.rect(0, PH - 10, PW, 10, "F");
      pdf.setFontSize(7.5); setColor("#64748b");
      pdf.text("AI Web Analyzer  •  Confidential Audit Report", ML, PH - 3.5);
      pdf.text(`Page ${pg}`, PW - ML, PH - 3.5, { align: "right" });
    };

    /* ════════════════════════════════════════════════
       PAGE 1 — COVER
    ════════════════════════════════════════════════ */

    // Dark gradient background
    setFill("#020617"); pdf.rect(0, 0, PW, PH, "F");
    // Top accent bar
    setFill("#3b82f6"); pdf.rect(0, 0, PW, 2, "F");
    setFill("#6366f1"); pdf.rect(0, 2, PW / 2, 2, "F");
    setFill("#a855f7"); pdf.rect(PW / 2, 2, PW / 2, 2, "F");

    // Brand name
    pdf.setFontSize(9); pdf.setFont("helvetica", "bold");
    setColor("#38bdf8");
    pdf.text("🌐  AI WEB ANALYZER", ML, 22);

    // Big title
    pdf.setFontSize(34); pdf.setFont("helvetica", "bold");
    setColor("#f1f5f9");
    pdf.text("Website Audit", ML, 60);
    pdf.text("Report", ML, 76);

    // Accent underline
    setFill("#6366f1"); pdf.rect(ML, 80, 40, 1.2, "F");

    // URL
    pdf.setFontSize(10); pdf.setFont("helvetica", "normal");
    setColor("#94a3b8");
    const shortUrl = url.replace(/^https?:\/\//, "").substring(0, 55);
    pdf.text("Analyzed URL:", ML, 96);
    pdf.setFont("helvetica", "bold"); setColor("#e2e8f0");
    pdf.text(shortUrl, ML, 103);

    // Date
    pdf.setFont("helvetica", "normal"); setColor("#64748b");
    pdf.setFontSize(9);
    pdf.text(`Generated: ${new Date().toLocaleString()}`, ML, 112);

    // Big score circle
    const cx = PW - 55, cy = 100, cr = 30;
    const sc = result.score;
    const scHex = scoreColor(sc);
    // outer ring bg
    setDraw("#1e3a5f"); pdf.setLineWidth(4);
    pdf.circle(cx, cy, cr, "S");
    // filled arc approximation via segments
    setDraw(scHex); pdf.setLineWidth(4);
    const ARC_SEGMENTS = 36;
    const filled = Math.round((sc / 100) * ARC_SEGMENTS);
    for (let i = 0; i < filled; i++) {
      const a1 = (i / ARC_SEGMENTS) * 2 * Math.PI - Math.PI / 2;
      const a2 = ((i + 1) / ARC_SEGMENTS) * 2 * Math.PI - Math.PI / 2;
      const x1 = cx + cr * Math.cos(a1), y1 = cy + cr * Math.sin(a1);
      const x2 = cx + cr * Math.cos(a2), y2 = cy + cr * Math.sin(a2);
      pdf.line(x1, y1, x2, y2);
    }
    // score text
    pdf.setFontSize(22); pdf.setFont("helvetica", "bold");
    setColor(scHex);
    pdf.text(`${sc}`, cx, cy + 3, { align: "center" });
    pdf.setFontSize(7); pdf.setFont("helvetica", "normal"); setColor("#94a3b8");
    pdf.text("/ 100", cx, cy + 9, { align: "center" });
    pdf.text("OVERALL", cx, cy + 15, { align: "center" });

    // 4 category pills row
    const cats = [
      { label: "Performance", val: result.performance, icon: "⚡" },
      { label: "Accessibility", val: result.accessibility, icon: "♿" },
      { label: "SEO", val: result.seo, icon: "🔍" },
      { label: "Best Practices", val: result.bestPractices, icon: "✅" }
    ];
    let px = ML; const py = 145; const pW = (CW) / 4 - 2;
    cats.forEach(c => {
      const ch = scoreColor(c.val);
      setFill("#0f172a");
      pdf.roundedRect(px, py, pW, 22, 3, 3, "F");
      setDraw(ch); pdf.setLineWidth(0.5);
      pdf.roundedRect(px, py, pW, 22, 3, 3, "S");
      pdf.setFontSize(14); pdf.setFont("helvetica", "bold"); setColor(ch);
      pdf.text(`${c.val}`, px + pW / 2, py + 13, { align: "center" });
      pdf.setFontSize(6); pdf.setFont("helvetica", "normal"); setColor("#94a3b8");
      pdf.text(c.label, px + pW / 2, py + 19, { align: "center" });
      px += pW + 2.5;
    });

    // Cover info block
    setFill("#0f172a");
    pdf.roundedRect(ML, 176, CW, 36, 4, 4, "F");
    setDraw("#1e3a5f"); pdf.setLineWidth(0.4);
    pdf.roundedRect(ML, 176, CW, 36, 4, 4, "S");

    const infoItems = [
      ["Load Time", result.rawData?.loadTime ? `${(result.rawData.loadTime / 1000).toFixed(2)}s` : "—"],
      ["Broken Links", String(result.rawData?.brokenLinks ?? 0)],
      ["Images", String((result.rawData?.images || []).length)],
      ["Headings", String(result.rawData?.headings ?? 0)],
      ["Issues Found", String(result.issues?.length ?? 0)],
    ];
    let ix = ML + 5;
    infoItems.forEach(([lbl, val]) => {
      pdf.setFontSize(9); pdf.setFont("helvetica", "bold"); setColor("#e2e8f0");
      pdf.text(val, ix, 190);
      pdf.setFontSize(6.5); pdf.setFont("helvetica", "normal"); setColor("#64748b");
      pdf.text(lbl, ix, 197);
      ix += CW / 5;
    });

    // bottom bar
    setFill("#0f172a"); pdf.rect(0, PH - 10, PW, 10, "F");
    setFill("#3b82f6"); pdf.rect(0, PH - 10, PW, 0.8, "F");
    pdf.setFontSize(7.5); setColor("#475569");
    pdf.text("AI Web Analyzer  •  Confidential Audit Report", ML, PH - 3.5);
    drawPageFooter();

    /* ════════════════════════════════════════════════
       PAGE 2 — SCORES & DIAGNOSTICS
    ════════════════════════════════════════════════ */
    newPage();
    setFill("#020617"); pdf.rect(0, 0, PW, PH, "F");

    // Section heading helper
    const sectionHead = (title, sub = "") => {
      checkPage(18);
      setFill("#0f172a"); pdf.rect(ML - 2, y, CW + 4, 12, "F");
      setFill("#3b82f6"); pdf.rect(ML - 2, y, 3, 12, "F");
      pdf.setFontSize(11); pdf.setFont("helvetica", "bold"); setColor("#e2e8f0");
      pdf.text(title, ML + 4, y + 8);
      if (sub) { pdf.setFontSize(7.5); pdf.setFont("helvetica", "normal"); setColor("#64748b"); pdf.text(sub, ML + 4, y + 14); y += 6; }
      y += 16;
    };

    // Small bar helper
    const scoreBar = (label, val, barY) => {
      const ch = scoreColor(val);
      pdf.setFontSize(8.5); pdf.setFont("helvetica", "normal"); setColor("#94a3b8");
      pdf.text(label, ML, barY + 4);
      // BG bar
      setFill("#1e3a5f"); pdf.roundedRect(ML + 42, barY, CW - 60, 5, 2, 2, "F");
      // Fill bar
      const [r, g, b] = hex2rgb(ch);
      pdf.setFillColor(r, g, b);
      const fw = Math.max(1, ((CW - 60) * (val / 100)));
      pdf.roundedRect(ML + 42, barY, fw, 5, 2, 2, "F");
      // Value text
      pdf.setFontSize(8.5); pdf.setFont("helvetica", "bold"); setColor(ch);
      pdf.text(`${val}/100`, PW - MR, barY + 4.5, { align: "right" });
      return barY + 10;
    };

    sectionHead("📊 Category Scores", "Breakdown of your site across 4 key areas");
    cats.forEach(c => { y = scoreBar(c.label, c.val, y); });

    y += 5;
    sectionHead("⚠️ Detected Issues");
    if (result.issues?.length === 0) {
      pdf.setFontSize(9); setColor("#22c55e");
      pdf.text("✓  No major issues detected — excellent!", ML, y); y += 8;
    } else {
      result.issues?.forEach(iss => {
        checkPage(8);
        setFill("#7f1d1d"); pdf.roundedRect(ML, y, 4, 5, 1, 1, "F");
        pdf.setFontSize(8.5); pdf.setFont("helvetica", "normal"); setColor("#fca5a5");
        pdf.text(iss, ML + 7, y + 4);
        y += 8;
      });
    }

    y += 6;
    sectionHead("💡 Recommendations");
    if (result.suggestions?.length === 0) {
      pdf.setFontSize(9); setColor("#22c55e"); pdf.text("✓  No suggestions — site is well optimised!", ML, y); y += 8;
    } else {
      result.suggestions?.forEach(sug => {
        checkPage(8);
        setFill("#1d4ed8"); pdf.roundedRect(ML, y, 4, 5, 1, 1, "F");
        pdf.setFontSize(8.5); pdf.setFont("helvetica", "normal"); setColor("#bfdbfe");
        const lines = pdf.splitTextToSize(sug, CW - 8);
        pdf.text(lines, ML + 7, y + 4);
        y += (lines.length * 4.5) + 4;
      });
    }

    /* ════════════════════════════════════════════════
       PAGE 3 — FULL DIAGNOSTICS (Down / Warning / Good)
    ════════════════════════════════════════════════ */
    if (result.diagnostics?.length > 0) {
      newPage();
      setFill("#020617"); pdf.rect(0, 0, PW, PH, "F");
      sectionHead("🩺 Full Diagnostics Report", "Every check — what's broken, what needs attention, and what's working");

      const statusSections = [
        { status: "down", label: "🔴 Issues (Critical)", bg: "#7f1d1d", accent: "#ef4444", textCol: "#fca5a5" },
        { status: "warning", label: "🟡 Needs Attention", bg: "#78350f", accent: "#f59e0b", textCol: "#fcd34d" },
        { status: "good", label: "🟢 What's Working Well", bg: "#14532d", accent: "#22c55e", textCol: "#86efac" }
      ];

      statusSections.forEach(sec => {
        const items = result.diagnostics.filter(d => d.status === sec.status);
        if (items.length === 0) return;
        checkPage(14);

        // Sub-section header
        setFill("#0f172a"); pdf.roundedRect(ML, y, CW, 9, 2, 2, "F");
        setDraw(sec.accent); pdf.setLineWidth(0.4); pdf.roundedRect(ML, y, CW, 9, 2, 2, "S");
        pdf.setFontSize(8.5); pdf.setFont("helvetica", "bold"); setColor(sec.textCol);
        pdf.text(`${sec.label}  (${items.length})`, ML + 4, y + 6);
        y += 13;

        items.forEach(item => {
          checkPage(sec.status === "good" ? 12 : 30);

          if (sec.status === "good") {
            // compact green row
            setFill("#052e16"); pdf.roundedRect(ML, y, CW, 8, 2, 2, "F");
            pdf.setFontSize(7.5); pdf.setFont("helvetica", "normal"); setColor("#86efac");
            pdf.text(`✓  ${item.issue}`, ML + 3, y + 5.5);
            pdf.setFontSize(6.5); setColor("#4d7c0f");
            pdf.text(item.category, PW - MR, y + 5.5, { align: "right" });
            y += 11;
          } else {
            // Full card
            const cardH = 10 + (item.fixes?.length || 0) * 10 + 6;
            setFill("#0f172a"); pdf.roundedRect(ML, y, CW, cardH, 3, 3, "F");
            setDraw(sec.accent); pdf.setLineWidth(0.4);
            pdf.roundedRect(ML, y, CW, cardH, 3, 3, "S");
            // left accent
            const [ar, ag, ab] = hex2rgb(sec.accent);
            pdf.setFillColor(ar, ag, ab);
            pdf.roundedRect(ML, y, 3, cardH, 1.5, 1.5, "F");

            // Issue title
            pdf.setFontSize(8.5); pdf.setFont("helvetica", "bold"); setColor("#e2e8f0");
            pdf.text(item.issue, ML + 6, y + 7);
            // Badges
            pdf.setFontSize(6); pdf.setFont("helvetica", "normal"); setColor("#7dd3fc");
            pdf.text(item.category, PW - MR - 28, y + 7);
            const impColor = item.impact === "High" ? "#fca5a5" : item.impact === "Medium" ? "#fcd34d" : "#86efac";
            setColor(impColor);
            pdf.text(`${item.impact} Impact`, PW - MR, y + 7, { align: "right" });
            y += 11;

            // Fix methods
            item.fixes?.forEach((fix, fi) => {
              checkPage(10);
              const isBest = fix.rank === 1;
              if (isBest) {
                setFill("#3b0764"); pdf.roundedRect(ML + 5, y, CW - 8, 8, 1.5, 1.5, "F");
                setDraw("#a855f7"); pdf.setLineWidth(0.3);
                pdf.roundedRect(ML + 5, y, CW - 8, 8, 1.5, 1.5, "S");
                pdf.setFontSize(6.5); pdf.setFont("helvetica", "bold"); setColor("#c4b5fd");
                pdf.text(`⭐ #${fix.rank} ${fix.label}`, ML + 8, y + 5.5);
              } else {
                setFill("#1e293b"); pdf.roundedRect(ML + 5, y, CW - 8, 7, 1.5, 1.5, "F");
                pdf.setFontSize(6.5); pdf.setFont("helvetica", "normal"); setColor("#64748b");
                pdf.text(`#${fix.rank} ${fix.label}`, ML + 8, y + 5);
              }
              // method text
              const methodLines = pdf.splitTextToSize(fix.method, CW - 30);
              const mColor = isBest ? "#ddd6fe" : "#94a3b8";
              setColor(mColor);
              pdf.setFont("helvetica", "normal");
              if (isBest) { pdf.setFontSize(7); } else { pdf.setFontSize(6.5); }
              pdf.text(methodLines, ML + 8, y + (isBest ? 5.5 : 5) + 4);
              y += (methodLines.length * 3.8) + (isBest ? 10 : 9);
              // Code snippet (only for best fix, abbreviated)
              if (isBest && fix.code) {
                checkPage(10);
                setFill("#020617"); pdf.roundedRect(ML + 5, y, CW - 8, 8.5, 1.5, 1.5, "F");
                setDraw("#1e3a5f"); pdf.setLineWidth(0.25);
                pdf.roundedRect(ML + 5, y, CW - 8, 8.5, 1.5, 1.5, "S");
                pdf.setFont("courier", "normal"); pdf.setFontSize(6); setColor("#7dd3fc");
                const codeLines = pdf.splitTextToSize(fix.code, CW - 14);
                pdf.text(codeLines.slice(0, 2), ML + 8, y + 5.5); // max 2 lines
                y += 10;
              }
            });
            y += 4;
          }
        });
        y += 6;
      });
    }

    /* ════════════════════════════════════════════════
       PAGE 4 — SITE CRAWL + COMPETITORS
    ════════════════════════════════════════════════ */
    let needsPage4 = (result.crawl?.pages?.length > 0) || (competitors.length > 0);
    if (needsPage4) {
      newPage();
      setFill("#020617"); pdf.rect(0, 0, PW, PH, "F");

      if (result.crawl?.pages?.length > 0) {
        sectionHead("🌐 Multi-Page Site Crawl", `${result.crawl.pages.length} pages scanned — Site Score: ${result.crawl.siteScore}/100`);

        // Table header
        setFill("#1e3a5f"); pdf.rect(ML, y, CW, 8, "F");
        pdf.setFontSize(7.5); pdf.setFont("helvetica", "bold"); setColor("#93c5fd");
        pdf.text("Page URL", ML + 3, y + 5.5);
        pdf.text("Score", PW - MR, y + 5.5, { align: "right" });
        y += 10;

        result.crawl.pages.forEach((pg, i) => {
          checkPage(9);
          const even = i % 2 === 0;
          setFill(even ? "#0f172a" : "#0d1526");
          pdf.rect(ML, y, CW, 8, "F");
          const pgUrl = pg.url.replace(/^https?:\/\//, "").substring(0, 60);
          pdf.setFontSize(7); pdf.setFont("helvetica", "normal"); setColor("#94a3b8");
          pdf.text(pgUrl, ML + 3, y + 5.5);
          const psc = Math.round(pg.score);
          pdf.setFont("helvetica", "bold"); setColor(scoreColor(psc));
          pdf.text(`${psc}/100`, PW - MR, y + 5.5, { align: "right" });
          y += 9;
        });

        if (result.crawl.best && result.crawl.worst) {
          y += 5;
          checkPage(18);
          setFill("#052e16"); pdf.roundedRect(ML, y, (CW / 2) - 3, 12, 2, 2, "F");
          pdf.setFontSize(7); pdf.setFont("helvetica", "bold"); setColor("#4ade80");
          pdf.text("🏆 Best Page", ML + 4, y + 5);
          pdf.setFont("helvetica", "normal"); setColor("#86efac");
          pdf.text(result.crawl.best.url.replace(/^https?:\/\//, "").substring(0, 30), ML + 4, y + 10);
          setFill("#7f1d1d"); pdf.roundedRect(ML + (CW / 2) + 2, y, (CW / 2) - 3, 12, 2, 2, "F");
          pdf.setFontSize(7); pdf.setFont("helvetica", "bold"); setColor("#ef4444");
          pdf.text("⚠️ Needs Work", ML + (CW / 2) + 6, y + 5);
          pdf.setFont("helvetica", "normal"); setColor("#fca5a5");
          pdf.text(result.crawl.worst.url.replace(/^https?:\/\//, "").substring(0, 30), ML + (CW / 2) + 6, y + 10);
          y += 18;
        }
      }

      if (competitors.length > 0) {
        y += 6;
        sectionHead("🏁 Competitor Benchmark", "How your site compares to others in your space");

        // Header row
        setFill("#1e3a5f"); pdf.rect(ML, y, CW, 8, "F");
        pdf.setFontSize(7.5); pdf.setFont("helvetica", "bold"); setColor("#93c5fd");
        pdf.text("Competitor URL", ML + 3, y + 5.5);
        pdf.text("Score", PW - MR, y + 5.5, { align: "right" });
        y += 10;

        // Your site row
        setFill("#1e3a5f"); pdf.rect(ML, y, CW, 8, "F");
        pdf.setFontSize(7); pdf.setFont("helvetica", "bold"); setColor("#38bdf8");
        pdf.text(`★ ${url.replace(/^https?:\/\//, "").substring(0, 50)}  (YOUR SITE)`, ML + 3, y + 5.5);
        setColor(scoreColor(result.score));
        pdf.text(`${result.score}/100`, PW - MR, y + 5.5, { align: "right" });
        y += 10;

        competitors.forEach((c, i) => {
          checkPage(9);
          setFill(i % 2 === 0 ? "#0f172a" : "#0d1526"); pdf.rect(ML, y, CW, 8, "F");
          const cu = c.url.replace(/^https?:\/\//, "").substring(0, 55);
          pdf.setFontSize(7); pdf.setFont("helvetica", "normal"); setColor("#94a3b8");
          pdf.text(cu, ML + 3, y + 5.5);
          const cs = Math.round(c.score);
          pdf.setFont("helvetica", "bold"); setColor(scoreColor(cs));
          pdf.text(`${cs}/100`, PW - MR, y + 5.5, { align: "right" });
          y += 9;
        });
      }
    }

    /* ════════════════════════════════════════════════
       PAGE 5 — AI EXPERT ANALYSIS
    ════════════════════════════════════════════════ */
    if (result.aiReport) {
      newPage();
      setFill("#020617"); pdf.rect(0, 0, PW, PH, "F");
      sectionHead("🤖 AI Expert Analysis", "Powered by Groq LLaMA — professional audit narrative");

      // AI report box
      setFill("#0a0f1e");
      const reportLines = pdf.splitTextToSize(result.aiReport, CW - 6);
      const boxH = Math.min(reportLines.length * 4.5 + 8, BOTTOM - y - 4);
      pdf.roundedRect(ML, y, CW, boxH, 3, 3, "F");
      setDraw("#1e40af"); pdf.setLineWidth(0.4);
      pdf.roundedRect(ML, y, CW, boxH, 3, 3, "S");
      setFill("#1e40af"); pdf.rect(ML, y, 3, boxH, "F");
      pdf.setFontSize(8); pdf.setFont("helvetica", "normal"); setColor("#c7d2fe");
      const maxLines = Math.floor((boxH - 8) / 4.5);
      pdf.text(reportLines.slice(0, maxLines), ML + 6, y + 7);
      y += boxH + 10;

      // If there's remaining text
      if (reportLines.length > maxLines) {
        checkPage(20);
        const rest = pdf.splitTextToSize(result.aiReport, CW - 6);
        const boxH2 = Math.min(rest.length * 4.5 + 8, BOTTOM - y - 4);
        setFill("#0a0f1e"); pdf.roundedRect(ML, y, CW, boxH2, 3, 3, "F");
        setDraw("#1e40af"); pdf.setLineWidth(0.4);
        pdf.roundedRect(ML, y, CW, boxH2, 3, 3, "S");
        pdf.setFontSize(8); setColor("#c7d2fe");
        pdf.text(rest.slice(maxLines, maxLines + Math.floor((boxH2 - 8) / 4.5)), ML + 6, y + 7);
      }
    }

    /* ── Final page number pass ── */
    const total = pdf.internal.getNumberOfPages();
    for (let p = 1; p <= total; p++) {
      pdf.setPage(p);
      pdf.setFontSize(7.5); setColor("#475569");
      pdf.text(`Page ${p} of ${total}`, PW - MR, PH - 3.5, { align: "right" });
    }

    pdf.save(`AI-Audit-${url.replace(/^https?:\/\//, "").replace(/[^a-z0-9]/gi, "_").substring(0, 30)}.pdf`);
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

                {/* ── Diagnostics Panel ── */}
                {result.diagnostics && result.diagnostics.length > 0 && (
                  <DiagnosticsPanel diagnostics={result.diagnostics} />
                )}

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
