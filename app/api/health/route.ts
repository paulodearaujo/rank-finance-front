import { NextResponse } from "next/server";

/**
 * Health check endpoint for deployment monitoring
 * Returns a simple 200 OK response with server status
 */
export async function GET() {
  return NextResponse.json(
    {
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "rank-finance",
    },
    { status: 200 },
  );
}

// Allow health checks via HEAD requests as well
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
