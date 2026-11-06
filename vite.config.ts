// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import type { Plugin } from "vite";

const isVercel = Boolean(process.env.VERCEL || process.env.NITRO_PRESET === "vercel");

function ttsDevServerPlugin(): Plugin {
  return {
    name: "tts-dev-server",
    configureServer(server) {
      server.middlewares.use("/api/tts", async (req, res) => {
        // CORS headers
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, xi-api-key");

        if (req.method === "OPTIONS") {
          res.statusCode = 204;
          res.end();
          return;
        }

        if (req.method === "GET") {
          const { getDiagnosticStatus } = await import("./src/server/ttsService");
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(getDiagnosticStatus()));
          return;
        }

        if (req.method === "POST") {
          let body = "";
          req.on("data", (chunk: Buffer | string) => {
            body += chunk.toString();
          });
          req.on("end", async () => {
            try {
              const data = JSON.parse(body);
              const { synthesizeSpeech } = await import("./src/server/ttsService");
              const result = await synthesizeSpeech(data);
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              if (result.success) {
                res.setHeader(
                  "Cache-Control",
                  "public, max-age=86400, stale-while-revalidate=604800",
                );
              }
              res.end(JSON.stringify(result));
            } catch (err: unknown) {
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(
                JSON.stringify({
                  success: false,
                  reason: "DEV_SERVER_ERROR",
                  fallback: "browser-tts",
                  error: (err as Error)?.message,
                }),
              );
            }
          });
        } else {
          res.statusCode = 405;
          res.end("Method Not Allowed");
        }
      });
    },
  };
}

export default defineConfig({
  vite: {
    plugins: [ttsDevServerPlugin()],
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  nitro: isVercel ? { preset: "vercel" } : undefined,
});
