import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

import App from "./App";
import Login from "./Login";
import Signup from "./Signup";
import Compare from "./Compare";
import ProtectedRoute from "./ProtectedRoute";
import Dashboard from "./Dashboard";
import Hamburger from "./Hamburger";

function Layout() {
  return (
    <BrowserRouter>

      {/* ── Fixed Navbar (always visible) ── */}
      <div className="nav-bar">
        <div className="nav-left">
          <Hamburger />
        </div>

        <div className="nav-center">
          <div className="nav-links">
            <Link to="/" className="nav-link">🌐 Analyzer</Link>
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/signup" className="nav-link">Sign Up</Link>
            <Link to="/compare" className="nav-link">Compare</Link>
            <Link to="/dashboard" className="nav-link">Dashboard</Link>
          </div>
        </div>

        <div className="nav-right">
          <span className="nav-logo-text">AI Web Analyzer</span>
        </div>
      </div>

      {/* ── Route Content — NO page-shell wrapper for any page (each handles its own layout) ── */}
      <Routes>
        {/* PUBLIC home route — shows full hero + analyzer */}
        <Route path="/" element={<App />} />

        {/* Auth pages — each has its own auth-page layout */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected pages — each has its own premium-page layout */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />

        <Route path="/compare" element={
          <ProtectedRoute>
            <Compare />
          </ProtectedRoute>
        } />
      </Routes>

    </BrowserRouter>
  );
}

export default Layout;
