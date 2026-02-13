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

      <div style={{
        display: "flex",
        gap: 20,
        padding: 15,
        background: "#111",
        color: "white"
      }}>

        <div style={{padding:15, background:"#111"}}>
          <Hamburger/>
        </div>

        <Link to="/">Analyzer</Link>
        <Link to="/login">Login</Link>
        <Link to="/signup">Signup</Link>
        <Link to="/compare">Compare</Link>
        <Link to="/dashboard">Dashboard</Link>
      </div>

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

    </BrowserRouter>
  );
}

export default Layout;
