
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css"; // Or './App.css' if that's your styling file

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
