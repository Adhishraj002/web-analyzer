import { useState, useEffect } from "react";
import axios from "axios";
import supabase from "./supabaseClient";
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function Compare() {

  const [url1,setUrl1] = useState("");
  const [url2,setUrl2] = useState("");
  const [user,setUser] = useState(null);
  const [result,setResult] = useState(null);
  const [loading,setLoading] = useState(false);

  useEffect(()=>{
    supabase.auth.getUser()
      .then(({data})=> setUser(data.user));
  },[]);

  const fixUrl = u => u.startsWith("http") ? u : "https://" + u;

  const compare = async () => {

    if(!user){
      alert("Login required");
      return;
    }

    setLoading(true);

    try{

      const r1 = await axios.post(
        "http://localhost:5000/analyze",
        { url: fixUrl(url1) },
        { headers:{ userid:user.id } }
      );

      const r2 = await axios.post(
        "http://localhost:5000/analyze",
        { url: fixUrl(url2) },
        { headers:{ userid:user.id } }
      );

      setResult({
        score1:r1.data.score,
        score2:r2.data.score,
        issues1:r1.data.issues.length,
        issues2:r2.data.issues.length
      });

      await axios.post(
        "http://localhost:5000/save-comparison",
        {
            userId:user.id,
            url1,
            url2,
            score1:r1.data.score,
            score2:r2.data.score
        }
    );

    }catch(err){
      alert(err.response?.data || err.message);
    }

    setLoading(false);
  };

  const chartData = result && {
    labels:["Site A","Site B"],
    datasets:[
      {
        label:"Score",
        data:[result.score1,result.score2],
        backgroundColor:["#4caf50","#2196f3"]
      },
      {
        label:"Issues",
        data:[result.issues1,result.issues2],
        backgroundColor:["#ff5252","#ff9800"]
      }
    ]
  };
  
  return (
    <div className="page-shell page-shell--top">
      <div className="glass compare-shell analyzer-card">

      
        <h2>Website Comparison</h2>
        
        {/* INPUTS */}
        <input
          className="input-modern"
          placeholder="First URL"
          value={url1}
          onChange={e=>setUrl1(e.target.value)}
        />

        <input
          className="input-modern"
          placeholder="Second URL"
          value={url2}
          onChange={e=>setUrl2(e.target.value)}
        />

        <button className="btn-premium" onClick={compare}>
          Compare
        </button>

        {loading && <p>Analyzing...</p>}

        {/* DASHBOARD STYLE RESULT */}
        {result && (
          <div style={{ marginTop: 40 }}>

            {/* 🔹 SCORE CARDS */}
            <div style={{
              display: "flex",
              gap: 20,
              marginBottom: 30
            }}>

              <div className="glass" style={{ padding: 20, flex: 1 }}>
                <h3>Site A Score</h3>
                <h1 style={{ fontSize: 40 }}>{result.score1}</h1>
              </div>

              <div className="glass" style={{ padding: 20, flex: 1 }}>
                <h3>Site B Score</h3>
                <h1 style={{ fontSize: 40 }}>{result.score2}</h1>
              </div>

            </div>

            {/* 🔹 CHART BELOW SCORES */}
            <div style={{ maxWidth: 600 }}>
              <h3>Score Comparison Chart</h3>

              <Bar
                data={{
                  labels: ["Site A", "Site B"],
                  datasets: [{
                    label: "Overall Score",
                    data: [result.score1, result.score2],
                    backgroundColor: ["#4caf50", "#2196f3"],
                    borderRadius: 8
                  }]
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { display: false }
                  },
                  scales: {
                    y: {
                      min: 0,
                      max: 100
                    }
                  }
                }}
              />
            </div>

          </div>
        )}
        
      </div>
    </div>
 );

}
