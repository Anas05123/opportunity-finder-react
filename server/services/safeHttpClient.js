import axios from 'axios';
import dns from 'dns/promises';
import net from 'net';
import http from 'http';
import https from 'https';

/**
 * SSRF-Safe HTTP Client (V3 Remediated)
 * - Prohibits automatic redirects (maxRedirects: 0)
 * - Enforces manual redirect inspection and re-validation on every single hop
 * - Resolves DNS and checks ALL returned addresses against private/internal/cloud CIDR ranges
 * - Protects against IPv4-mapped IPv6, DNS rebinding, and metadata endpoints (169.254.169.254)
 */

// Private & Cloud Metadata Subnets to block
const BLOCKED_IP_PATTERNS = [
  /^127\./,                         // 127.0.0.0/8 (Loopback)
  /^10\./,                          // 10.0.0.0/8 (Private Class A)
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12 (Private Class B)
  /^192\.168\./,                    // 192.168.0.0/16 (Private Class C)
  /^169\.254\./,                    // 169.254.0.0/16 (Link-Local / Cloud Metadata AWS/GCP/Azure)
  /^0\./,                           // 0.0.0.0/8 (Broadcast/This host)
  /^100\.(6[4-9]|[7-9][0-9]|1[0-1][0-9]|12[0-7])\./, // 100.64.0.0/10 (Carrier-Grade NAT)
  /^198\.(1[8-9])\./,               // 198.18.0.0/15 (Benchmarking)
  /^::1$/,                          // IPv6 loopback
  /^::$/,                           // IPv6 unspecified
  /^fc00:/i,                        // IPv6 Unique Local (ULA)
  /^fd[0-9a-f]{2}:/i,               // IPv6 Unique Local (ULA)
  /^fe80:/i,                        // IPv6 Link-Local
  /^::ffff:127\./i,                 // IPv4-mapped IPv6 loopback
  /^::ffff:10\./i,                  // IPv4-mapped IPv6 Class A
  /^::ffff:172\.(1[6-9]|2[0-9]|3[0-1])\./i, // IPv4-mapped IPv6 Class B
  /^::ffff:192\.168\./i,            // IPv4-mapped IPv6 Class C
  /^::ffff:169\.254\./i,            // IPv4-mapped IPv6 Metadata
  /^::ffff:0\./i                    // IPv4-mapped IPv6 This host
];

function isIpRestricted(ipAddress) {
  const normalized = ipAddress.toLowerCase().trim();
  for (const pattern of BLOCKED_IP_PATTERNS) {
    if (pattern.test(normalized)) {
      return true;
    }
  }
  return false;
}

export async function validateSafeUrl(urlStr) {
  let parsed;
  try {
    parsed = new URL(urlStr);
  } catch (e) {
    throw new Error(`SSRF Blocked: Invalid URL structure "${urlStr}"`);
  }

  // 1. Protocol allowlist (Only http: and https: allowed)
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`SSRF Blocked: Forbidden protocol "${parsed.protocol}". Only http: and https: allowed.`);
  }

  const hostname = parsed.hostname.toLowerCase().trim();

  // 2. Prohibit localhost variations
  if (hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.local') || hostname === '0.0.0.0') {
    throw new Error(`SSRF Blocked: Forbidden destination host "${hostname}".`);
  }

  // 3. Direct IP format check
  if (net.isIP(hostname)) {
    if (isIpRestricted(hostname)) {
      throw new Error(`SSRF Blocked: Destination IP ${hostname} is in a restricted/internal subnet.`);
    }
    return { url: parsed.toString(), ip: hostname, protocol: parsed.protocol };
  }

  // 4. DNS Resolution check (resolve all IPv4 and IPv6 records)
  try {
    const lookup = await dns.lookup(hostname, { all: true });
    if (!lookup || lookup.length === 0) {
      throw new Error(`SSRF Blocked: DNS resolution returned no addresses for "${hostname}".`);
    }

    for (const entry of lookup) {
      if (isIpRestricted(entry.address)) {
        throw new Error(`SSRF Blocked: Hostname "${hostname}" resolved to restricted IP "${entry.address}".`);
      }
    }

    const resolvedIp = lookup[0].address;
    return { url: parsed.toString(), ip: resolvedIp, protocol: parsed.protocol };
  } catch (err) {
    if (err.message.includes('SSRF Blocked')) throw err;
    throw new Error(`SSRF Blocked: DNS resolution failed for "${hostname}": ${err.message}`);
  }
}

/**
 * Perform safe HTTP fetch with manual hop-by-hop redirect re-validation
 */
export async function safeFetch(initialUrl, options = {}) {
  const maxRedirects = 3;
  const timeoutMs = options.timeout || 6000;
  const maxContentLength = options.maxContentLength || 10 * 1024 * 1024; // 10 MB

  let currentUrl = initialUrl;
  let redirectCount = 0;
  const visitedUrls = new Set();

  while (redirectCount <= maxRedirects) {
    // Validate target URL before every single request
    const validated = await validateSafeUrl(currentUrl);
    visitedUrls.add(validated.url);

    const instance = axios.create({
      timeout: timeoutMs,
      maxContentLength: maxContentLength,
      maxBodyLength: maxContentLength,
      maxRedirects: 0, // STRICT: Disable automatic axios redirects
      validateStatus: (status) => status >= 200 && status < 400, // Accept 2xx and 3xx
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 (OpportunityHub-Probe/3.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,application/json;q=0.8,*/*;q=0.7',
        ...(options.headers || {})
      },
      httpAgent: new http.Agent({ keepAlive: false }),
      httpsAgent: new https.Agent({ keepAlive: false, rejectUnauthorized: true })
    });

    let response;
    try {
      response = await instance.get(validated.url, {
        params: options.params,
        responseType: options.responseType || 'text'
      });
    } catch (fetchErr) {
      if (fetchErr.response && [301, 302, 303, 307, 308].includes(fetchErr.response.status)) {
        response = fetchErr.response;
      } else {
        throw fetchErr;
      }
    }

    // Check for HTTP Redirect (301, 302, 303, 307, 308)
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const locationHeader = response.headers.location;
      if (!locationHeader) {
        throw new Error(`SSRF Error: HTTP ${response.status} redirect received without Location header from ${currentUrl}`);
      }

      // Resolve relative redirect against current URL
      let nextUrl;
      try {
        nextUrl = new URL(locationHeader, currentUrl).toString();
      } catch (urlErr) {
        throw new Error(`SSRF Error: Invalid redirect Location URL "${locationHeader}" from ${currentUrl}`);
      }

      // Check redirect loop
      if (visitedUrls.has(nextUrl)) {
        throw new Error(`SSRF Error: Circular redirect loop detected to "${nextUrl}"`);
      }

      redirectCount++;
      if (redirectCount > maxRedirects) {
        throw new Error(`SSRF Error: Maximum redirect limit (${maxRedirects}) exceeded`);
      }

      currentUrl = nextUrl;
      continue; // Loop to validate and fetch next hop
    }

    // Return final 2xx response
    return response;
  }

  throw new Error(`SSRF Error: Request failed after ${redirectCount} redirects`);
}

export default { validateSafeUrl, safeFetch };
