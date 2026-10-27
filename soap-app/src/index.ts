import { serve } from "bun";
import index from "./index.html";

const server = serve({
  port: Number(process.env.APP_PORT || 3001),
  routes: {
    // Serve index.html for all unmatched routes.
    "/*": index,
    "/api/config": () => Response.json({ soapUrl: process.env.BUN_PUBLIC_SOAP_URL || "http://localhost:3000/wsdl" }),
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
