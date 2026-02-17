import { useState, useEffect } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Bar } from "react-chartjs-2";
import supabase from "./supabaseClient";
import { motion } from "framer-motion";
import { ClipLoader } from "react-spinners";
import CountUp from "react-countup";
import { toast } from "react-hot-toast";

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

function App() {

  const [url,setUrl] = useState("");
  const [result,setResult] = useState(null);
  const [loading,setLoading] = useState(false);
  const [history,setHistory] = useState([]);
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [user,setUser] = useState(null);
  const [chat,setChat] = useState([]);
  const [question,setQuestion] = useState("");
  const [competitors,setCompetitors] = useState([]);
  const [expanded, setExpanded] = useState(false);

  const analyze = async () => {

    if(!user){
      toast.error("Login required")
      return;
    }
    setExpanded(true);   // expand immediately
    setLoading(true);

    try {

      let fixedUrl = url;
      if(!fixedUrl.startsWith("http"))
        fixedUrl = "https://" + fixedUrl;

      try {
        new URL(fixedUrl);
      } catch {
        alert("Invalid URL format");
        setLoading(false);
        return;
      }

      const res = await axios.post(
        "http://localhost:5000/analyze",
        { url: fixedUrl },
        {
          headers:{ userid:user.id }
        }
      );

      setResult(res.data);
      fetchHistory();

      // ⭐ AUTO COMPETITOR SCAN
      try {
        const comp = await axios.post(
          "http://localhost:5000/competitors",
          { url: fixedUrl }
        );
        setCompetitors(comp.data);
      } catch (err) {
        console.log("Competitor scan skipped");
      }

      toast.success("Analysis complete ");

    } catch(err){
      console.error(err);
      alert(err.response?.data || err.message);
    }

    setLoading(false);
  };
  
  const askAI = async () => {
    
    if(!question || !result) return;
    
    const userMsg = { role:"user", text:question };
    setChat(prev=>[...prev,userMsg]);
    
    // ⭐ SEND SMALL DATA ONLY// 
    const compact = {
      score: result.score,
      issues: result.issues,
      suggestions: result.suggestions,
      loadTime: result.rawData?.loadTime,
      brokenLinks: result.rawData?.brokenLinks,
      inputsWithoutLabel: result.rawData?.inputsWithoutLabel
    };

    const res = await axios.post(
      "http://localhost:5000/ai-chat",
      {
        scanData: compact,
        question
      }
    );

    const aiMsg = { role:"ai", text:res.data.reply };
    setChat(prev=>[...prev, aiMsg]);
    setQuestion("");
  };

  const runCompetitorAI = async () => {

  const fixed = url.startsWith("http") ? url : "https://"+url;

  const res = await axios.post(
    "http://localhost:5000/competitors",
    { url: fixed }
  );

  setCompetitors(res.data);
  };

  const fetchHistory = async () => {
    try {
      const res = await axios.get(
 
        "http://localhost:5000/history",
 
        {
          headers:{
            userid:user.id
          }
        }
      );

      setHistory(res.data);
    } catch {
      console.log("History fetch error");
    }
  };
  useEffect(()=>{
    if(user) fetchHistory();
  },[user]);
 
  useEffect(() => {

    supabase.auth.getUser() 
    .then(({data})=>setUser(data.user));

    const { data: listener } =
    supabase.auth.onAuthStateChange(
      (_event, session)=>{
        setUser(session?.user || null);
      } 
    );

    return ()=> listener.subscription.unsubscribe();
  },[]);


  const downloadPDF = async () => {

    if (!result) return;

    const pdf = new jsPDF("p", "mm", "a4");

    const pageWidth = 210;
    const margin = 20;
    let y = 20;

    // ===== TITLE =====
    pdf.setFontSize(20);
    pdf.text("AI Website Audit Report", margin, y);
    y += 10;

    pdf.setFontSize(10);
    pdf.text(`URL: ${url}`, margin, y);
    y += 6;
    pdf.text(`Generated: ${new Date().toLocaleString()}`, margin, y);
    y += 12;

    // ===== OVERALL SCORE =====
    pdf.setFontSize(16);
    pdf.text("Overall Score", margin, y);
    y += 12;

    pdf.setFontSize(30);
    pdf.text(`${result.score}/100`, margin, y);
    y += 15;

    // ===== CATEGORY BREAKDOWN =====
    pdf.setFontSize(14);
    pdf.text("Category Breakdown", margin, y);
    y += 8;

    pdf.setFontSize(11);
    pdf.text(`Performance: ${result.performance}`, margin, y); y += 6;
    pdf.text(`Accessibility: ${result.accessibility}`, margin, y); y += 6;
    pdf.text(`SEO: ${result.seo}`, margin, y); y += 6;
    pdf.text(`Best Practices: ${result.bestPractices}`, margin, y); y += 12;

    // ===== ISSUES =====
    pdf.setFontSize(14);
    pdf.text("Detected Issues", margin, y);
    y += 8;

    pdf.setFontSize(11);

    if (result.issues.length === 0) {
      pdf.text("No major issues detected.", margin, y);
      y += 6;
    } else {
      result.issues.forEach(issue => {
        pdf.text(`• ${issue}`, margin, y);
        y += 6;
      });
    }

    y += 6;

    // ===== SUGGESTIONS =====
    pdf.setFontSize(14);
    pdf.text("Recommendations", margin, y);
    y += 8;

    pdf.setFontSize(11);
    result.suggestions.forEach(s => {
      pdf.text(`• ${s}`, margin, y);
      y += 6;
    });

    y += 10;

    // ===== COMPETITOR SECTION =====
    if (competitors.length > 0) {

      if (y > 260) {
        pdf.addPage();
        y = 20;
      }

      pdf.setFontSize(14);
      pdf.text("Competitor Benchmark", margin, y);
      y += 8;

      pdf.setFontSize(11);
      competitors.forEach(c => {
        pdf.text(`${c.url} — Score: ${Math.round(c.score)}`, margin, y);
        y += 6;
      });
    }

    // ===== AI SUMMARY =====
    if (result.aiReport) {

      pdf.addPage();
      y = 20;

      pdf.setFontSize(16);
      pdf.text("AI Expert Analysis", margin, y);
      y += 10;

      pdf.setFontSize(11);

      const splitText = pdf.splitTextToSize(result.aiReport, 170);
      pdf.text(splitText, margin, y);
    }

    pdf.save("AI-Website-Audit-Report.pdf");
  };

  const signUp = async () => {
    const { error } = await supabase.auth.signUp({
      email,
      password
    });
    
    if(error){
      alert(error.message);
    } else {
      alert("Check your email to confirm account!");
    }
  };

  const signIn = async () => {
    const { data,error } =
    await supabase.auth.signInWithPassword({
      email,
      password
    });

    if(error) alert(error.message);
    else setUser(data.user);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const chartData =
  result ? {
    labels: [
      "Performance",
      "Accessibility",
      "SEO",
      "Best Practices"
    ],

    datasets: [{
      label:"Audit Breakdown",
      data:[result.performance, result.accessibility, result.seo, result.bestPractices],
      backgroundColor:[
        "#4caf50",
        "#ff9800",
        "#2196f3",
        "#9c27b0"
      ]
    }]
  } : null;

  return (
    <>
      {/* NAVBAR */}


      {/* MAIN CONTENT */}
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          paddingTop: "120px"
        }}
      >
        <div
          className={`glass analyzer-transition ${expanded ? "expanded" : ""}`}
          style={{ padding: "35px" }}
        >

          {/* YOUR EXISTING ANALYZER CONTENT STAYS HERE */}


    
      {!user && (
        <div>
          <input
           className="input-modern"
           placeholder="Email"
           onChange={e=>setEmail(e.target.value)}
          />
          
          <input
           className="input-modern"
           type="password"
           placeholder="Password"
           onChange={e=>setPassword(e.target.value)}
          />

        <button onClick={signUp}>Sign Up</button>
        <button onClick={signIn}>Login</button>
      </div>
      )}

      {user && (
      <button onClick={signOut}>
      Logout
      </button>
     )}
     
     <h1>AI Website Analyzer</h1>
     
       <input
         className="input-modern"
         value={url}
         onChange={e=>setUrl(e.target.value)}
         placeholder="Enter Website URL"
       />
       
       <button className="btn-premium" onClick={analyze}>
         Analyze Website
       </button>

       {loading && <p>Loading...</p>}

       {result && (
         <div
           id="report"
           style={{ marginTop: "20px" }}
        >
          
          <button
            onClick={downloadPDF}
            style={{
            marginTop:"15px",
            padding:"10px 16px",
            background:"#2196f3",
            border:"none",
            borderRadius:"6px",
            color:"white",
            cursor:"pointer"
          }}
        >
            Download Report PDF
          </button>
            
          <h2>Overall Score</h2>
          <h1 style={{fontSize:40}}>
            <CountUp end={result.score} duration={1.5}/>
          </h1>

          {result.crawl && (
          <div className="glass" style={{marginTop:30,padding:20}}>

          <h2>🌐 Site Score: {result.crawl.siteScore}</h2>

          <h3>Best Page</h3>
          <p>{result.crawl.best.url}</p>

          <h3>normal Page</h3>
          <p>{result.crawl.worst.url}</p>

          <h3>Pages Analyzed</h3>

          {result.crawl.pages.map(p=>(
          <div key={p.url} style={{
          border:"1px solid #333",
          padding:10,
          marginBottom:10
          }}>
          <b>{p.url}</b>
          <br/>
          Score: {Math.round(p.score)}
          </div>
          ))}

          </div>
          )}

          {competitors.length > 0 && (

          <div className="glass" style={{marginTop:40,padding:20}}>
          <h2>Competitor Benchmark</h2>

          {competitors.map(c=>(
          <div key={c.url}>
          <b>{c.url}</b> — Score: {Math.round(c.score)}
          </div>
          ))}

          </div>
          )}
          
          <div style={{marginTop:20}}>
            
            <p>Performance: {result.performance}</p>
            <div className="progress">
              <div className="progress-fill"
                style={{width:`${result.performance}%`}} />
            </div>
              
            <p>Accessibility: {result.accessibility}</p>
            <div className="progress">
              <div className="progress-fill"
                style={{width:`${result.accessibility}%`}} />
            </div>
                
            <p>SEO: {result.seo}</p>
            <div className="progress">
              <div className="progress-fill"
                style={{width:`${result.seo}%`}} />
            </div>
                  
            <p>Best Practices: {result.bestPractices}</p>
            <div className="progress">
              <div className="progress-fill"
                style={{width:`${result.bestPractices}%`}} />
            </div>
          </div>

            <h3>Issues:</h3>
            <ul>
            {result.issues?.map((i,index)=>{
              let color = "#4caf50";   // default green// 
              
              if(i.includes("missing"))
                color = "#ff5252";   // red
              
              if(i.includes("No"))
                color = "#ffc107";   // yellow
              
              return (
                <li key={index} style={{
                  color,
                  marginBottom:"6px",
                  fontWeight:"bold"
                }}>
                  {i}
                </li>
              );
            })}
          </ul>

          <h3>Website Preview:</h3>
          <img
            src={`data:image/png;base64,${result.rawData?.screenshot}`}
            alt="preview"
 
            style={{
              width:"80%",
              borderRadius:"10px",
              marginTop:"10px"
            }}
          />

          <h3>AI Expert Analysis</h3>
          <div style={{
            background:"#111",
            padding:"15px",
            borderRadius:"10px",
            whiteSpace:"pre-wrap"
          }}>
            {result.aiReport}
          </div>



          <h3>AI Suggestions:</h3>
          <ul>
            {result.suggestions?.map((s,i)=>(
              <li key={i} style={{color:"#00e676"}}>
                {s}
              </li>
            ))}
          </ul>

          {chartData && (
            <div style={{marginTop:"30px"}}>
              <h3>Analysis Chart</h3>
              <Bar data={chartData} />
            </div>
          )}

          <h3 style={{marginTop:40}}>AI Website Consultant</h3>
          
          <div className="glass" style={{padding:20}}>
            
            {/* Chat history */}
            <div style={{maxHeight:200, overflowY:"auto"}}>
              {chat.map((c,i)=>(
                <div key={i} style={{
                  textAlign:c.role==="user"?"right":"left",
                  marginBottom:10
                }}>
                  <b>{c.role==="user"?"You":"AI"}:</b>
                  <div>{typeof c.text === "string"
                    ? c.text
                    : JSON.stringify(c.text)}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Input */}
            <input
              className="input-modern"
              value={question}
              onChange={e=>setQuestion(e.target.value)}
              placeholder="Ask about this website..."
            />
            
            <button
              className="btn-premium"
              onClick={askAI}
            >
              Ask AI
            </button>
          
          </div>

          
          <h3 style={{marginTop:"30px"}}>Recent Scans</h3>
          <ul>
            {history.map((scan,i)=>(
              <li key={i} style={{
                marginBottom:"8px",
                background:"#2a2a2a",
                padding:"8px",
                borderRadius:"6px"
              }}>
                <b>{scan.url}</b> — Score: {scan.score}
              </li>
            ))}
          </ul>
        </div>

      )}

        </div>
      </div>
    </>
  );
}

export default App;
