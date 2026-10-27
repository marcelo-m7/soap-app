import { serve } from "bun";
import index from "./index.html";

const serveProduction = async (request: Request) => {
  const pathname = new URL(request.url).pathname;
  const filename = pathname === "/" ? "index.html" : pathname.slice(1);
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(filename)) {
    return new Response("Not Found", { status: 404 });
  }
  const file = Bun.file(`dist/${filename}`);
  return await file.exists() ? new Response(file) : new Response("Not Found", { status: 404 });
};

const server = serve({
  port: Number(process.env.APP_PORT || 3001),
  routes: {
    // Serve index.html for all unmatched routes.
    "/*": process.env.NODE_ENV === "production" ? serveProduction : index,
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
