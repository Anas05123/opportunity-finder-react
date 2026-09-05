export async function onRequest(context) {
  const url = new URL(context.request.url);
  const targetHost = "https://opportunity-finder-gsxr.onrender.com";
  const targetUrl = new URL(url.pathname + url.search, targetHost);

  const reqHeaders = new Headers(context.request.headers);
  reqHeaders.set("host", "opportunity-finder-gsxr.onrender.com");
  reqHeaders.set("x-forwarded-host", url.host);
  reqHeaders.set("x-forwarded-proto", url.protocol.replace(":", ""));

  try {
    const backendResponse = await fetch(targetUrl.toString(), {
      method: context.request.method,
      headers: reqHeaders,
      body: ["GET", "HEAD"].includes(context.request.method) ? null : context.request.body,
      redirect: "follow"
    });

    const responseHeaders = new Headers(backendResponse.headers);
    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.set("Access-Control-Allow-Credentials", "true");

    return new Response(backendResponse.body, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers: responseHeaders
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: "The Careerly API is currently waking up on Render. Please wait a few seconds and try again.",
        details: err.message
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
