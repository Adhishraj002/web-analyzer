import { useEffect, useState, useRef } from "react";
import axios from "axios";
import supabase from "./supabaseClient";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import CountUp from "react-countup";
import { Bar } from "react-chartjs-2";

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
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };

function AnimSection({ children, className }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref} variants={stagger} initial="hidden" animate={inView ? "show" : "hidden"} className={className}>
      {children}
    </motion.div>
  );
}

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [comparisons, setComparisons] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      axios.get("http://localhost:5000/history", { headers: { userid: user.id } }),
      axios.get("http://localhost:5000/get-comparisons", { headers: { userid: user.id } })
    ]).then(([h, c]) => {
      setHistory(h.data);
      setComparisons(c.data);
    }).catch(() => { }).finally(() => setLoadingData(false));
  }, [user]);

  const totalScans = history.length;
  const avgScore = totalScans === 0 ? 0 : Math.round(history.reduce((a, b) => a + b.score, 0) / totalScans);
  const bestScore = totalScans === 0 ? 0 : Math.max(...history.map(h => h.score));

  const STATS = [
    { icon: "🌐", value: totalScans, suffix: "", label: "Total Scans" },
    { icon: "🎯", value: avgScore, suffix: "", label: "Average Score" },
    { icon: "🏆", value: bestScore, suffix: "", label: "Best Score" },
    { icon: "📊", value: comparisons.length, suffix: "", label: "Comparisons" },
  ];

  const chartData = {
    labels: history.slice(-10).map((_, i) => `Scan ${i + 1}`),
    datasets: [{
      label: "Score",
      data: history.slice(-10).map(s => s.score),
      backgroundColor: history.slice(-10).map(s =>
        s.score >= 80 ? "rgba(34,197,94,0.75)" :
          s.score >= 60 ? "rgba(251,191,36,0.75)" : "rgba(239,68,68,0.75)"
      ),
      borderColor: "rgba(56,189,248,0.4)",
      borderWidth: 1,
      borderRadius: 8,
    }]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false }
    },
    scales: {
      x: { ticks: { color: "#64748b" }, grid: { color: "rgba(148,163,184,0.06)" } },
      y: { min: 0, max: 100, ticks: { color: "#64748b" }, grid: { color: "rgba(148,163,184,0.06)" } }
    }
  };

  const scoreColor = s => s >= 80 ? "#4ade80" : s >= 60 ? "#fbbf24" : "#f87171";

  return (
    <div className="premium-page">
      <div className="pg-orb pg-orb--1" />
      <div className="pg-orb pg-orb--2" />

      <div className="premium-page-inner">

        {/* ── Header ── */}
        <motion.div className="pg-header" variants={stagger} initial="hidden" animate="show">
          <motion.span variants={fadeUp} className="section-kicker">Your Analytics Hub</motion.span>
          <motion.h1 variants={fadeUp} className="pg-title">
            {user ? (
              <>Welcome back, <span className="section-title-accent">{user.email?.split("@")[0]}</span> 👋</>
            ) : "Dashboard"}
          </motion.h1>
          <motion.p variants={fadeUp} className="pg-subtitle">
            All your scan history, comparisons, and performance trends in one place.
          </motion.p>
        </motion.div>

        {/* ── Stats Row ── */}
        <AnimSection className="dash-stats-row">
          {STATS.map((s, i) => (
            <motion.div key={i} variants={fadeUp} className="stat-counter-card">
              <span className="stat-counter-icon">{s.icon}</span>
              <div className="stat-counter-value">
                <CountUp end={s.value} duration={1.5} suffix={s.suffix} enableScrollSpy scrollSpyOnce />
              </div>
              <div className="stat-counter-label">{s.label}</div>
            </motion.div>
          ))}
        </AnimSection>

        {/* ── Performance Chart ── */}
        {totalScans > 0 && (
          <AnimSection className="dash-section">
            <motion.div variants={fadeUp} className="dash-card">
              <div className="dash-card-header">
                <span className="dash-card-icon">📈</span>
                <h3 className="dash-card-title">Performance Trend (Last 10 Scans)</h3>
              </div>
              <Bar data={chartData} options={chartOptions} />
            </motion.div>
          </AnimSection>
        )}

        {/* ── Scan History ── */}
        <AnimSection className="dash-section">
          <motion.div variants={fadeUp} className="section-heading-wrap" style={{ textAlign: "left", marginBottom: "1.5rem" }}>
            <span className="section-kicker">History</span>
            <h2 className="section-title" style={{ fontSize: "1.5rem" }}>Recent Scans</h2>
          </motion.div>

          {loadingData ? (
            <motion.p variants={fadeUp} style={{ color: "#64748b" }}>Loading...</motion.p>
          ) : history.length === 0 ? (
            <motion.div variants={fadeUp} className="dash-empty">
              <div className="dash-empty-icon">🔍</div>
              <p>No scans yet. <Link to="/">Analyze your first website</Link></p>
            </motion.div>
          ) : (
            <div className="dash-history-list">
              {history.map((h, i) => (
                <motion.div key={h.id || i} variants={fadeUp} className="dash-history-item">
                  <div className="dhi-left">
                    <div className="dhi-num">#{i + 1}</div>
                    <div>
                      <a href={h.url} target="_blank" rel="noreferrer" className="dhi-url">{h.url}</a>
                      {h.created_at && (
                        <div className="dhi-date">{new Date(h.created_at).toLocaleDateString()}</div>
                      )}
                    </div>
                  </div>
                  <div className="dhi-score" style={{ color: scoreColor(h.score) }}>
                    {h.score}<span className="dhi-score-max">/100</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimSection>

        {/* ── Comparisons ── */}
        {comparisons.length > 0 && (
          <AnimSection className="dash-section">
            <motion.div variants={fadeUp} className="section-heading-wrap" style={{ textAlign: "left", marginBottom: "1.5rem" }}>
              <span className="section-kicker">Benchmarks</span>
              <h2 className="section-title" style={{ fontSize: "1.5rem" }}>Past Comparisons</h2>
            </motion.div>
            <div className="dash-comp-list">
              {comparisons.map((c, i) => (
                <motion.div key={c.id || i} variants={fadeUp} className="dash-comp-item">
                  <div className="dci-sites">
                    <span className="dci-site dci-site--a">
                      <span className="dci-badge">A</span>
                      <a href={c.url1} target="_blank" rel="noreferrer">{c.url1}</a>
                    </span>
                    <span className="dci-divider">vs</span>
                    <span className="dci-site dci-site--b">
                      <span className="dci-badge">B</span>
                      <a href={c.url2} target="_blank" rel="noreferrer">{c.url2}</a>
                    </span>
                  </div>
                  <div className="dci-scores">
                    <span style={{ color: scoreColor(c.score1), fontWeight: 700 }}>{c.score1}</span>
                    <span style={{ color: "#475569" }}>—</span>
                    <span style={{ color: scoreColor(c.score2), fontWeight: 700 }}>{c.score2}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimSection>
        )}

        {/* ── CTA ── */}
        <AnimSection className="dash-section dash-cta-wrap">
          <motion.div variants={fadeUp} className="dash-cta">
            <div className="dash-cta-text">
              <h3>Ready for another scan?</h3>
              <p>Analyze any website in seconds and get a full AI audit report.</p>
            </div>
            <Link to="/">
              <button className="btn-hero">🚀 Analyze Now</button>
            </Link>
          </motion.div>
        </AnimSection>

      </div>
    </div>
  );
}
