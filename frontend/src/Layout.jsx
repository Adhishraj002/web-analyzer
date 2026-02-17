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

      <div className="nav-bar">
        <div className="nav-left">
          <Hamburger />
        </div>

        <div className="nav-center">
          <div className="nav-links">
            <Link to="/" className="nav-link">Analyzer</Link>
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/signup" className="nav-link">Signup</Link>
            <Link to="/compare" className="nav-link">Compare</Link>
            <Link to="/dashboard" className="nav-link">Dashboard</Link>
          </div>
        </div>

        <div className="nav-right"></div>
      </div>

      <div className="page-shell">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route path="/" element={
            <ProtectedRoute>
              <App />
            </ProtectedRoute>
          } />

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
      </div>

    </BrowserRouter>
  );
}

export default Layout;
