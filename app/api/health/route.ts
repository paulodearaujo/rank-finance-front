import { NextResponse } from "next/server";

/**
 * Health check endpoint for Render deployment
 * Returns a simple 200 OK response to indicate the service is healthy
 */
export async function GET() {
  return NextResponse.json(
    {
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "rank-finance",
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    },
  );
}

// Also handle HEAD requests for more efficient health checks
export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
