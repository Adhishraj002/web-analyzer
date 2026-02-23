import { useState, useEffect, useRef } from "react";
import axios from "axios";
import supabase from "./supabaseClient";
import { Bar } from "react-chartjs-2";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import CountUp from "react-countup";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

/* ── Animation variants ── */
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } }
};
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } }
};

/* ── Spinner ── */
const Spinner = () => (
  <svg width="18" height="18" viewBox="0 0 38 38" stroke="#fff"
    style={{ animation: "spin360 0.7s linear infinite", display: "block" }}>
    <g fill="none" fillRule="evenodd">
      <g transform="translate(1 1)" strokeWidth="2">
        <circle strokeOpacity=".3" cx="18" cy="18" r="18" />
        <path d="M36 18c0-9.94-8.06-18-18-18" />
      </g>
    </g>
  </svg>
);

/* ── Metric row inside score panel ── */
const MetricRow = ({ label, value, color }) => (
  <div className="csp-sub">
    <span>{label}</span>
    <b style={{ color }}>{value ?? "—"}</b>
  </div>
);

export default function Compare() {
  const [url1, setUrl1] = useState("");
  const [url2, setUrl2] = useState("");
  const [user, setUser] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const resultsRef = useRef(null);

  /* load logged-in user */
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  /* auto-scroll to results whenever they appear */
  useEffect(() => {
    if (result && resultsRef.current) {
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);               // small delay lets React paint first
    }
  }, [result]);

  const fixUrl = u => u.startsWith("http") ? u : "https://" + u;

  const compare = async () => {
    if (!user) { toast.error("Login required to compare"); return; }
    if (!url1 || !url2) { toast.error("Please enter both URLs"); return; }

    setLoading(true);
    setResult(null);

    try {
      const [r1, r2] = await Promise.all([
        axios.post("http://localhost:5000/analyze", { url: fixUrl(url1) }, { headers: { userid: user.id } }),
        axios.post("http://localhost:5000/analyze", { url: fixUrl(url2) }, { headers: { userid: user.id } })
      ]);

      setResult({
        score1: r1.data.score ?? 0,
        score2: r2.data.score ?? 0,
        perf1: r1.data.performance ?? 0,
        perf2: r2.data.performance ?? 0,
        seo1: r1.data.seo ?? 0,
        seo2: r2.data.seo ?? 0,
        acc1: r1.data.accessibility ?? 0,
        acc2: r2.data.accessibility ?? 0,
        issues1: r1.data.issues?.length ?? 0,
        issues2: r2.data.issues?.length ?? 0,
      });

      toast.success("Comparison complete ✅");

      /* save silently */
      try {
        await axios.post("http://localhost:5000/save-comparison", {
          userId: user.id, url1, url2,
          score1: r1.data.score, score2: r2.data.score
        });
      } catch { /* ignore */ }

    } catch (err) {
      toast.error(err.response?.data || err.message || "Comparison failed");
    }

    setLoading(false);
  };

  /* ── Derived values ── */
  const winner = result
    ? result.score1 > result.score2 ? "A"
      : result.score2 > result.score1 ? "B" : "Tie"
    : null;

  const scoreColor = v => v >= 80 ? "#22c55e" : v >= 60 ? "#f59e0b" : "#ef4444";

  const chartData = result ? {
    labels: ["Overall", "Performance", "SEO", "Accessibility"],
    datasets: [
      {
        label: `Site A`,
        data: [result.score1, result.perf1, result.seo1, result.acc1],
        backgroundColor: "rgba(56,189,248,0.75)",
        borderColor: "#38bdf8",
        borderWidth: 1,
        borderRadius: 6,
      },
      {
        label: `Site B`,
        data: [result.score2, result.perf2, result.seo2, result.acc2],
        backgroundColor: "rgba(168,85,247,0.75)",
        borderColor: "#a855f7",
        borderWidth: 1,
        borderRadius: 6,
      }
    ]
  } : null;

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { labels: { color: "#94a3b8", font: { family: "Outfit" } } }
    },
    scales: {
      x: { ticks: { color: "#64748b" }, grid: { color: "rgba(148,163,184,0.08)" } },
      y: { min: 0, max: 100, ticks: { color: "#64748b" }, grid: { color: "rgba(148,163,184,0.08)" } }
    }
  };

  /* ── Score Panel ── */
  const ScorePanel = ({ label, url, score, perf, seo, acc, issues, color, isWinner }) => (
    <motion.div
      variants={fadeUp}
      className={`compare-score-panel compare-score-panel--${color} ${isWinner ? "compare-score-panel--winner" : ""}`}
    >
      {isWinner && <div className="winner-crown">👑 Winner</div>}
      <div className="csp-label">{label}</div>
      <div className="csp-url">{url || "—"}</div>
      <div className="csp-score">
        <CountUp end={score} duration={1.4} />
        <span className="csp-score-max">/100</span>
      </div>
      <div className="csp-sub-grid">
        <MetricRow label="Perf" value={perf} color={scoreColor(perf)} />
        <MetricRow label="SEO" value={seo} color={scoreColor(seo)} />
        <MetricRow label="A11y" value={acc} color={scoreColor(acc)} />
        <MetricRow label="Issues" value={issues} color={issues > 0 ? "#f59e0b" : "#22c55e"} />
      </div>
    </motion.div>
  );

  /* ── Render ── */
  return (
    <div className="premium-page">
      {/* BG orbs */}
      <div className="pg-orb pg-orb--1" />
      <div className="pg-orb pg-orb--2" />

      <div className="premium-page-inner">

        {/* ── Header ── */}
        <motion.div className="pg-header" variants={stagger} initial="hidden" animate="show">
          <motion.span variants={fadeUp} className="section-kicker">Competitor Intelligence</motion.span>
          <motion.h1 variants={fadeUp} className="pg-title">
            Website <span className="section-title-accent">Comparison</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="pg-subtitle">
            Paste two URLs and let our AI run a full side-by-side audit in seconds.
          </motion.p>
        </motion.div>

        {/* ── Input Card ── */}
        <motion.div className="compare-input-card" variants={fadeUp} initial="hidden" animate="show">
          <div className="compare-url-row">
            <div className="compare-url-col">
              <label className="auth-label">🅰️ Site A URL</label>
              <input
                className="input-modern"
                placeholder="https://site-a.com"
                value={url1}
                onChange={e => setUrl1(e.target.value)}
              />
            </div>
            <div className="compare-vs-badge">VS</div>
            <div className="compare-url-col">
              <label className="auth-label">🅱️ Site B URL</label>
              <input
                className="input-modern"
                placeholder="https://site-b.com"
                value={url2}
                onChange={e => setUrl2(e.target.value)}
              />
            </div>
          </div>

          <button
            className="btn-hero compare-run-btn"
            onClick={compare}
            disabled={loading}
          >
            {loading ? <><Spinner /> Analyzing both sites…</> : "⚡ Run Comparison"}
          </button>
        </motion.div>

        {/* ── Results ── */}
        <AnimatePresence>
          {result && (
            <motion.div
              ref={resultsRef}
              key="compare-results"
              variants={stagger}
              initial="hidden"
              animate="show"
              exit="hidden"
              className="compare-results"
              style={{ marginTop: "2.5rem" }}
            >
              {/* Winner banner */}
              <motion.div
                variants={fadeUp}
                className={`winner-banner winner-banner--${winner.toLowerCase()}`}
              >
                {winner === "Tie"
                  ? "🤝 It's a tie — both sites scored equally!"
                  : `🏆 Site ${winner} wins with a higher overall score!`
                }
              </motion.div>

              {/* Score panels */}
              <div className="compare-score-row">
                <ScorePanel
                  label="Site A" url={url1}
                  score={result.score1} perf={result.perf1}
                  seo={result.seo1} acc={result.acc1}
                  issues={result.issues1}
                  color="blue" isWinner={winner === "A"}
                />
                <ScorePanel
                  label="Site B" url={url2}
                  score={result.score2} perf={result.perf2}
                  seo={result.seo2} acc={result.acc2}
                  issues={result.issues2}
                  color="purple" isWinner={winner === "B"}
                />
              </div>

              {/* Quick comparison table */}
              <motion.div variants={fadeUp} className="compare-chart-card">
                <h3 className="compare-chart-title">⚡ Quick Metrics Comparison</h3>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                    <thead>
                      <tr style={{ color: "#64748b", textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.08em" }}>
                        <th style={{ textAlign: "left", padding: "0.5rem 0.75rem" }}>Metric</th>
                        <th style={{ textAlign: "center", padding: "0.5rem 0.75rem", color: "#38bdf8" }}>Site A</th>
                        <th style={{ textAlign: "center", padding: "0.5rem 0.75rem", color: "#a855f7" }}>Site B</th>
                        <th style={{ textAlign: "center", padding: "0.5rem 0.75rem" }}>Winner</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { label: "Overall Score", a: result.score1, b: result.score2 },
                        { label: "Performance", a: result.perf1, b: result.perf2 },
                        { label: "SEO", a: result.seo1, b: result.seo2 },
                        { label: "Accessibility", a: result.acc1, b: result.acc2 },
                      ].map((row, i) => {
                        const rowWinner = row.a > row.b ? "A" : row.b > row.a ? "B" : "—";
                        return (
                          <tr key={i} style={{ borderTop: "1px solid rgba(148,163,184,0.1)" }}>
                            <td style={{ padding: "0.65rem 0.75rem", color: "#94a3b8", fontWeight: 600 }}>{row.label}</td>
                            <td style={{ padding: "0.65rem 0.75rem", textAlign: "center", color: scoreColor(row.a), fontWeight: 700 }}>{row.a}</td>
                            <td style={{ padding: "0.65rem 0.75rem", textAlign: "center", color: scoreColor(row.b), fontWeight: 700 }}>{row.b}</td>
                            <td style={{ padding: "0.65rem 0.75rem", textAlign: "center" }}>
                              {rowWinner === "A" && <span style={{ color: "#38bdf8", fontWeight: 700 }}>🅰️ A</span>}
                              {rowWinner === "B" && <span style={{ color: "#a855f7", fontWeight: 700 }}>🅱️ B</span>}
                              {rowWinner === "—" && <span style={{ color: "#475569" }}>Tie</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </motion.div>

              {/* Bar chart */}
              <motion.div variants={fadeUp} className="compare-chart-card">
                <h3 className="compare-chart-title">📊 Detailed Score Breakdown</h3>
                <Bar data={chartData} options={chartOptions} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
