import { useState, useEffect, useRef } from "react";
import axios from "axios";
import supabase from "./supabaseClient";
import { Bar } from "react-chartjs-2";
import { motion, useInView } from "framer-motion";
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

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } }
};
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } }
};

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

export default function Compare() {
  const [url1, setUrl1] = useState("");
  const [url2, setUrl2] = useState("");
  const [user, setUser] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const resultsRef = useRef(null);
  const inView = useInView(resultsRef, { once: true, margin: "-60px" });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

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
        score1: r1.data.score,
        score2: r2.data.score,
        perf1: r1.data.performance,
        perf2: r2.data.performance,
        seo1: r1.data.seo,
        seo2: r2.data.seo,
        acc1: r1.data.accessibility,
        acc2: r2.data.accessibility,
        issues1: r1.data.issues?.length ?? 0,
        issues2: r2.data.issues?.length ?? 0,
      });
      toast.success("Comparison complete ✅");
      try {
        await axios.post("http://localhost:5000/save-comparison", {
          userId: user.id, url1, url2,
          score1: r1.data.score, score2: r2.data.score
        });
      } catch { /* skip silently */ }
    } catch (err) {
      toast.error(err.response?.data || err.message);
    }
    setLoading(false);
  };

  const winner = result
    ? result.score1 > result.score2 ? "A"
      : result.score2 > result.score1 ? "B" : "Tie"
    : null;

  const chartData = result ? {
    labels: ["Overall", "Performance", "SEO", "Accessibility"],
    datasets: [
      {
        label: `Site A — ${url1 || "Site A"}`,
        data: [result.score1, result.perf1, result.seo1, result.acc1],
        backgroundColor: "rgba(56,189,248,0.75)",
        borderColor: "#38bdf8",
        borderWidth: 1,
        borderRadius: 6,
      },
      {
        label: `Site B — ${url2 || "Site B"}`,
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
      legend: {
        labels: { color: "#94a3b8", font: { family: "Outfit" } }
      }
    },
    scales: {
      x: { ticks: { color: "#64748b" }, grid: { color: "rgba(148,163,184,0.08)" } },
      y: { min: 0, max: 100, ticks: { color: "#64748b" }, grid: { color: "rgba(148,163,184,0.08)" } }
    }
  };

  return (
    <div className="premium-page">
      {/* BG orbs */}
      <div className="pg-orb pg-orb--1" />
      <div className="pg-orb pg-orb--2" />

      <div className="premium-page-inner">

        {/* ── Header ── */}
        <motion.div
          className="pg-header"
          variants={stagger} initial="hidden" animate="show"
        >
          <motion.span variants={fadeUp} className="section-kicker">Competitor Intelligence</motion.span>
          <motion.h1 variants={fadeUp} className="pg-title">
            Website <span className="section-title-accent">Comparison</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="pg-subtitle">
            Paste two URLs and let our AI run a full side-by-side audit in seconds.
          </motion.p>
        </motion.div>

        {/* ── Input Card ── */}
        <motion.div
          className="compare-input-card"
          variants={fadeUp} initial="hidden" animate="show"
        >
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
            {loading ? <><Spinner /> Analyzing both sites...</> : "⚡ Run Comparison"}
          </button>
        </motion.div>

        {/* ── Results ── */}
        {result && (
          <motion.div
            ref={resultsRef}
            variants={stagger}
            initial="hidden"
            animate={inView ? "show" : "hidden"}
            className="compare-results"
          >
            {/* Winner banner */}
            <motion.div variants={fadeUp} className={`winner-banner winner-banner--${winner.toLowerCase()}`}>
              {winner === "Tie"
                ? "🤝 It's a tie — both sites scored equally!"
                : `🏆 Site ${winner} wins with a higher overall score!`
              }
            </motion.div>

            {/* Score cards */}
            <div className="compare-score-row">
              {[
                { label: "Site A", url: url1, score: result.score1, color: "blue", win: winner === "A" },
                { label: "Site B", url: url2, score: result.score2, color: "purple", win: winner === "B" },
              ].map((s, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  className={`compare-score-panel compare-score-panel--${s.color} ${s.win ? "compare-score-panel--winner" : ""}`}
                >
                  {s.win && <div className="winner-crown">👑 Winner</div>}
                  <div className="csp-label">{s.label}</div>
                  <div className="csp-url">{s.url || "—"}</div>
                  <div className="csp-score">
                    <CountUp end={s.score} duration={1.5} />
                    <span className="csp-score-max">/100</span>
                  </div>
                  <div className="csp-sub-grid">
                    <div className="csp-sub"><span>Perf</span><b>{i === 0 ? result.perf1 : result.perf2}</b></div>
                    <div className="csp-sub"><span>SEO</span><b>{i === 0 ? result.seo1 : result.seo2}</b></div>
                    <div className="csp-sub"><span>A11y</span><b>{i === 0 ? result.acc1 : result.acc2}</b></div>
                    <div className="csp-sub"><span>Issues</span><b>{i === 0 ? result.issues1 : result.issues2}</b></div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Chart */}
            <motion.div variants={fadeUp} className="compare-chart-card">
              <h3 className="compare-chart-title">📊 Detailed Score Breakdown</h3>
              <Bar data={chartData} options={chartOptions} />
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
