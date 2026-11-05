import { synthesizeSpeech, getDiagnosticStatus, type TTSRequest } from "../src/server/ttsService";

// Vercel Serverless Function: handles /api/tts
export default async function handler(req: any, res?: any) {
  // 1. Web Standard Request/Response (Vercel Edge/Web Runtime)
  if (req instanceof Request || (req?.method && typeof req.json === "function" && !res)) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, xi-api-key",
    };

    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (req.method === "GET") {
      return new Response(JSON.stringify(getDiagnosticStatus()), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (req.method === "POST") {
      try {
        const body = (await req.json()) as TTSRequest;
        const result = await synthesizeSpeech(body);
        return new Response(JSON.stringify(result), {
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
            "Cache-Control": result.success
              ? "public, max-age=86400, stale-while-revalidate=604800"
              : "no-store",
          },
        });
      } catch (err: unknown) {
        return new Response(
          JSON.stringify({
            success: false,
            reason: "INVALID_REQUEST",
            fallback: "browser-tts",
            error: (err as Error)?.message,
          }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
        );
      }
    }

    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  }

  // 2. Node.js IncomingMessage / ServerResponse (Vercel Node.js Serverless Function)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, xi-api-key");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method === "GET") {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(getDiagnosticStatus()));
    return;
  }

  if (req.method === "POST") {
    try {
      let body = req.body;
      if (typeof body === "string") {
        try {
          body = JSON.parse(body);
        } catch {
          body = {};
        }
      } else if (!body) {
        // Read stream body if not pre-parsed
        body = await new Promise((resolve, reject) => {
          let str = "";
          req.on("data", (chunk: any) => (str += chunk));
          req.on("end", () => {
            try {
              resolve(str ? JSON.parse(str) : {});
            } catch (e) {
              reject(e);
            }
          });
          req.on("error", reject);
        });
      }

      const result = await synthesizeSpeech(body as TTSRequest);
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      if (result.success) {
        res.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
      }
      res.end(JSON.stringify(result));
    } catch (err: unknown) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          success: false,
          reason: "INVALID_REQUEST",
          fallback: "browser-tts",
          error: (err as Error)?.message,
        }),
      );
    }
    return;
  }

  res.statusCode = 405;
  res.end("Method Not Allowed");
}

