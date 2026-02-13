import { useState } from "react";
import { Link } from "react-router-dom";

export default function Hamburger(){

  const [open,setOpen] = useState(false);

  return (
    <>
      {/* Button */}
      <div
        style={{
          fontSize:26,
          cursor:"pointer",
          color:"white"
        }}
        onClick={()=>setOpen(!open)}
      >
        ☰
      </div>

      {/* Drawer */}
      {open && (
        <div style={{
          position:"fixed",
          top:0,
          left:0,
          width:220,
          height:"100%",
          background:"#111",
          padding:20,
          zIndex:999
        }}>

          <h3 style={{color:"white"}}>Menu</h3>

          <Link to="/" onClick={()=>setOpen(false)}>Analyzer</Link><br/><br/>
          <Link to="/compare" onClick={()=>setOpen(false)}>Compare</Link><br/><br/>
          <Link to="/dashboard" onClick={()=>setOpen(false)}>Dashboard</Link>

        </div>
      )}
    </>
  );
}
