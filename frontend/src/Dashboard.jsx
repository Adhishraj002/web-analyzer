import { useEffect, useState } from "react";
import axios from "axios";
import supabase from "./supabaseClient";
import { Link } from "react-router-dom";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";

import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function Dashboard() {

  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [comparisons,setComparisons] = useState([]);

  // Get user
  useEffect(() => {
    supabase.auth.getUser()
      .then(({ data }) => setUser(data.user));
  }, []);

  // Fetch history
  useEffect(() => {
    if (!user) return;

    axios.get("http://localhost:5000/history", {
      headers: { userid: user.id }
    })
    .then(res => setHistory(res.data));

    axios.get("http://localhost:5000/get-comparisons",{
      headers:{ userid:user.id }
    })
    .then(res=>setComparisons(res.data));

  }, [user]);


  // Stats
  const totalScans = history.length;

  const avgScore =
    totalScans === 0
      ? 0
      : Math.round(
          history.reduce((a, b) => a + b.score, 0) / totalScans
        );

  const chartData = {
    labels: history.map((s,i) => `Scan ${i+1}`),
    datasets: [{
      label: "Scan Scores",
      data: history.map(s => s.score),
      backgroundColor: "#4caf50"
    }]
  };

  return (
    <div style={{ padding: 40 }}>

      <h1>Dashboard</h1>
      {user && <h3>Welcome: {user.email}</h3>}

      {/* Stats */}
      <div style={{display:"flex",gap:20,marginTop:20}}>
        <div style={{background:"#222", padding:20, borderRadius:10}}>
          <h4>Total Scans</h4>
          <h2>{totalScans}</h2>
        </div>

        <div style={{background:"#222", padding:20, borderRadius:10}}>
          <h4>Average Score</h4>
          <h2>{avgScore}</h2>
        </div>
      </div>

      {/* Performance Chart */}
      <div style={{marginTop:40}}>
        <h2>Performance Chart</h2>
        {totalScans > 0 && <Bar data={chartData} />}
      </div>

      {/* Scan History */}
      <h2 style={{marginTop:40}}>Scan History</h2>

      {history.map(h=>(
        <div key={h.id} className="glass" style={{padding:10,marginBottom:10}}>
          <a href={h.url} target="_blank" rel="noreferrer">
            {h.url}
          </a>
          <br/>
          Score: {h.score}
        </div>
      ))}

      {/* Comparisons */}
      <h2 style={{marginTop:40}}>Past Comparisons</h2>

      {comparisons.map(c=>{

        const compChart = {
          labels:["Site A","Site B"],
          datasets:[{
            label:"Score",
            data:[c.score1,c.score2],
            backgroundColor:["#4caf50","#2196f3"]
          }]
        };

        return (
          <div key={c.id} className="glass" style={{padding:20,marginBottom:20}}>

            <h4>
              <a href={c.url1} target="_blank">{c.url1}</a>
              {" vs "}
              <a href={c.url2} target="_blank">{c.url2}</a>
            </h4>

            <p>Scores: {c.score1} — {c.score2}</p>

            <Bar data={compChart}/>

          </div>
        );

      })}

      {/* Navigation */}
      <div style={{marginTop:30}}>
        <Link to="/">
          <button>Go To Analyzer</button>
        </Link>
      </div>

    </div>
  );
}
