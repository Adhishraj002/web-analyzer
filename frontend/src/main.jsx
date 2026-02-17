import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import "./styles.css";
import Layout from "./Layout";
import { Toaster } from "react-hot-toast";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Layout />
    <Toaster position="top-right" />
  </React.StrictMode>
);
