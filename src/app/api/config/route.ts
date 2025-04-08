"use server";

export async function GET() {
  return Response.json({ wsUrl: process.env.WS_URL });
}
