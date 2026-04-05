import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App.tsx";
import { frontendEnv } from "./lib/env";
import "./index.css";

const googleClientId = frontendEnv.GOOGLE_CLIENT_ID;

if (!googleClientId) {
  console.warn("Google OAuth client_id is missing. Set VITE_GOOGLE_CLIENT_ID in your .env file.");
}

createRoot(document.getElementById("root")!).render(
	<GoogleOAuthProvider clientId={googleClientId}>
		<App />
	</GoogleOAuthProvider>,
);
