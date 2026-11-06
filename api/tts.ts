import { synthesizeSpeech, getDiagnosticStatus, type TTSRequest } from "../src/server/ttsService";

export interface UniversalRequest {
  method?: string;
  body?: unknown;
  on?: (event: string, listener: (chunk: unknown) => void) => void;
  json?: () => Promise<unknown>;
}

export interface UniversalResponse {
  statusCode?: number;
  setHeader: (name: string, value: string) => void;
  end: (data?: string) => void;
}

// Vercel Serverless Function: handles /api/tts
export default async function handler(
  req: Request | UniversalRequest,
  res?: UniversalResponse,
): Promise<Response | void> {
  const isWebReq =
    req instanceof Request || (req?.method && typeof req.json === "function" && !res);

  // 1. Web Standard Request/Response (Vercel Edge/Web Runtime)
  if (isWebReq) {
    const webReq = req as Request;
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, xi-api-key",
    };

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
  if (!res) {
    return;
  }

  const nodeReq = req as UniversalRequest;
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, xi-api-key");

  if (nodeReq.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (nodeReq.method === "GET") {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(getDiagnosticStatus()));
    return;
  }

  if (nodeReq.method === "POST") {
    try {
      let body = nodeReq.body;
      if (typeof body === "string") {
        try {
          body = JSON.parse(body);
        } catch {
          body = {};
        }
      } else if (!body && typeof nodeReq.on === "function") {
        // Read stream body if not pre-parsed
        body = await new Promise((resolve, reject) => {
          let str = "";
          nodeReq.on?.("data", (chunk: unknown) => {
            str += String(chunk);
          });
          nodeReq.on?.("end", () => {
            try {
              resolve(str ? JSON.parse(str) : {});
            } catch (e) {
              reject(e);
            }
          });
          nodeReq.on?.("error", reject);
        });
      }

      const result = await synthesizeSpeech((body as TTSRequest) || {});
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
