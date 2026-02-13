import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import "./styles.css";
import { Toaster } from "react-hot-toast";
import MultiPage from "./MultiPage";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <MultiPage />
    <Toaster position="top-right" />
  </React.StrictMode>
);
