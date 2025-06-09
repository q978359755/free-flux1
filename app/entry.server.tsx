/**
 * By default, Remix will handle generating the HTTP Response for you.
 * You are free to delete this file if you'd like to, but if you ever want it revealed again, you can run `npx remix reveal` ✨
 * For more information, see https://remix.run/file-conventions/entry.server
 */

import type { EntryContext } from "@remix-run/cloudflare";
import { RemixServer } from "@remix-run/react";
import * as isbot from "isbot";
import { renderToReadableStream } from "react-dom/server";
// 移除 CONFIG 和 initConfig 的导入
// import { CONFIG, initConfig } from "./config";

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
  loadContext: any
) {
  // 移除这些行
  // console.log("Initializing config in entry.server.tsx");
  // initConfig(loadContext.cloudflare.env);
  // console.log("Config initialized:", JSON.stringify(CONFIG, null, 2));

  let body;
  try {
    body = await renderToReadableStream(
      <RemixServer context={remixContext} url={request.url} />,
      {
        signal: request.signal,
        onError(error: unknown) {
          console.error("Rendering error:", error);
          responseStatusCode = 500;
        },
      }
    );
  } catch (error) {
    console.error("Failed to render to stream:", error);
    return new Response("Internal Server Error", { status: 500 });
  }

  if (isbot.isbot(request.headers.get("user-agent"))) {
    try {
      await body.allReady;
    } catch (error) {
      console.error("Failed to wait for body to be ready:", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  }

  responseHeaders.set("Content-Type", "text/html");
  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}
