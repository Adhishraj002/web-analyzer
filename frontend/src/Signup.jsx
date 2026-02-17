import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import supabase from "./supabaseClient";

export default function Signup() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const signup = async () => {
    const { error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      alert(error.message);
    } else {
      alert("Check email confirmation");
      navigate("/login");
    }
  };

  return (
    <div className="auth-container page-shell--top">
      <div className="glass auth-card analyzer-card">
        
        <h2>Sign Up</h2>

        <input
          className="input-modern"
          placeholder="Email"
          onChange={e => setEmail(e.target.value)}
        /><br />

        <input
          type="password"
          placeholder="Password"
          onChange={e => setPassword(e.target.value)}
        /><br />

        <button onClick={signup}>Create Account</button>

        <p>
          Already registered?
          <Link to="/login"> Login</Link>
        </p>
      </div>
    </div>
  );
}
