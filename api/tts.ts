import type { IncomingMessage, ServerResponse } from "node:http";
import { synthesizeSpeech, getDiagnosticStatus, type TTSRequest } from "../src/server/ttsService";

// Vercel Serverless Function: handles /api/tts
// Supports both Web Standard Request/Response and Node.js req/res
export default async function handler(
  req: Request | (IncomingMessage & { body?: unknown; method?: string }),
  res?: ServerResponse,
) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, xi-api-key",
  };

  // 1. Web Standard Request/Response
  if (req instanceof Request || (req?.method && "json" in req && !res)) {
    const webReq = req as Request;
    if (webReq.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (webReq.method === "GET") {
      return new Response(JSON.stringify(getDiagnosticStatus()), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (webReq.method === "POST") {
      try {
        const body = (await webReq.json()) as TTSRequest;
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
            fallback: "none",
            error: (err as Error)?.message,
          }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
        );
      }
    }

    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  }

  // 2. Node.js IncomingMessage / ServerResponse
  if (!res) {
    return;
  }

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
      let body = (req as { body?: unknown }).body;
      if (typeof body === "string") {
        try {
          body = JSON.parse(body);
        } catch {
          body = {};
        }
      } else if (!body) {
        body = await new Promise((resolve, reject) => {
          let str = "";
          (req as IncomingMessage).on("data", (chunk: Buffer | string) => (str += chunk));
          (req as IncomingMessage).on("end", () => {
            try {
              resolve(str ? JSON.parse(str) : {});
            } catch (e) {
              reject(e);
            }
          });
          (req as IncomingMessage).on("error", reject);
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
          fallback: "none",
          error: (err as Error)?.message,
        }),
      );
    }
    return;
  }

  res.statusCode = 405;
  res.end("Method Not Allowed");
}
