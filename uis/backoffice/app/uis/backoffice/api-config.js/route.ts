export const dynamic = 'force-dynamic';

export function GET() {
  const script = process.env.TRACKFLOW_API_PROXY === '1'
    ? "window.TRACKFLOW_API_BASE_URL='/api';"
    : '// Keep existing API configuration.\n';
  return new Response(script, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
