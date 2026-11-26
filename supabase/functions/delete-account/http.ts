export function isAllowedOrigin(origin: string, allowedOrigin: string): boolean {
  return Boolean(allowedOrigin) && origin === allowedOrigin;
}

export function corsHeaders(allowedOrigin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin'
  };
}

export function jsonResponse(
  body: Record<string, unknown>,
  allowedOrigin: string,
  status = 200
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(allowedOrigin), 'Content-Type': 'application/json' }
  });
}
