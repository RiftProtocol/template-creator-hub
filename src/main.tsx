import { Buffer } from "buffer";

// Polyfill Buffer for Solana web3.js browser compatibility
window.Buffer = Buffer;

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
