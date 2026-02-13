import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import supabase from "./supabaseClient";

export default function Login() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const login = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      alert(error.message);
    } else {
      navigate("/");
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>Login</h2>

      <input
        placeholder="Email"
        onChange={e => setEmail(e.target.value)}
      /><br />

      <input
        type="password"
        placeholder="Password"
        onChange={e => setPassword(e.target.value)}
      /><br />

      <button onClick={login}>Login</button>

      <p>
        No account?
        <Link to="/signup"> Sign Up</Link>
      </p>
    </div>
  );
}