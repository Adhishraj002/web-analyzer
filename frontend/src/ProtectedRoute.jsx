import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import supabase from "./supabaseClient";

export default function ProtectedRoute({ children }) {

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser()
      .then(({ data }) => {
        setUser(data.user);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Checking authentication...</p>;

  if (!user) return <Navigate to="/login" />;

  return children;
}
