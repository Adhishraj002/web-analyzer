import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import supabase from "./supabaseClient";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
};

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const signup = async () => {
    if (!email || !password) { toast.error("Please fill in all fields"); return; }
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Account created! Check your email to confirm 📧");
      navigate("/login");
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
          <span className="auth-icon">✨</span>
        </div>

        <div className="auth-kicker">Get Started Free</div>
        <h2 className="auth-title">Create your account</h2>
        <p className="auth-subtitle">
          Join thousands of teams using AI Web Analyzer to dominate SEO and performance.
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
              onKeyDown={e => e.key === "Enter" && signup()}
            />
          </div>

          <div className="auth-field-wrap">
            <label className="auth-label">Password</label>
            <input
              className="input-modern"
              type="password"
              placeholder="Min. 6 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && signup()}
            />
          </div>
        </div>

        <button
          className="btn-hero auth-btn"
          onClick={signup}
          disabled={loading}
        >
          {loading ? "Creating account…" : "🎉 Create Account"}
        </button>

        <div className="auth-divider">
          <span />
          <p>Already have an account?</p>
          <span />
        </div>

        <Link to="/login" className="auth-link-btn">
          Sign In Instead →
        </Link>
      </motion.div>
    </div>
  );
}
