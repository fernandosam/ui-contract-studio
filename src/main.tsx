import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./ui-runtime/app";
import "@fontsource-variable/inter/wght.css";
import "@fontsource-variable/jetbrains-mono/wght.css";
import "@fontsource-variable/playfair-display/wght.css";
import "./globals.css";
import "./index.css";

const root = document.getElementById("root");
if (!root) throw new Error("Elemento #root não encontrado");
createRoot(root).render(<StrictMode><App /></StrictMode>);
