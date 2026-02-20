import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import supabase from "./supabaseClient";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
};

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const login = async () => {
    if (!email || !password) { toast.error("Please fill in all fields"); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Welcome back! 🎉");
      navigate("/");
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      {/* Background orbs */}
      <div className="auth-orb auth-orb--1" />
      <div className="auth-orb auth-orb--2" />
      <div className="auth-orb auth-orb--3" />

      <motion.div
        className="auth-card-premium"
        variants={fadeUp}
        initial="hidden"
        animate="show"
      >
        {/* Icon */}
        <div className="auth-icon-wrap">
          <span className="auth-icon">🔐</span>
        </div>

        <div className="auth-kicker">Welcome Back</div>
        <h2 className="auth-title">Sign in to your account</h2>
        <p className="auth-subtitle">
          Enter your credentials to access your AI Web Analyzer dashboard.
        </p>

        <div className="auth-fields">
          <div className="auth-field-wrap">
            <label className="auth-label">Email Address</label>
            <input
              className="input-modern"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && login()}
            />
          </div>

          <div className="auth-field-wrap">
            <label className="auth-label">Password</label>
            <input
              className="input-modern"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && login()}
            />
          </div>
        </div>

        <button
          className="btn-hero auth-btn"
          onClick={login}
          disabled={loading}
        >
          {loading ? "Signing in…" : "🚀 Sign In"}
        </button>

        <div className="auth-divider">
          <span />
          <p>Don't have an account?</p>
          <span />
        </div>

        <Link to="/signup" className="auth-link-btn">
          Create Free Account →
        </Link>
      </motion.div>
    </div>
  );
}