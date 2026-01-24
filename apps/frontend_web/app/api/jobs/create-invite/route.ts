import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_BASE_URL =
  process.env.SERVER_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE ||
  "https://api.iayos.online";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (sessionCookie) {
      headers["Cookie"] = `session=${sessionCookie.value}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/jobs/create-invite`, {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const rawBody = await response.text();
    const isJson = response.headers
      .get("content-type")
      ?.includes("application/json");
    const data = isJson ? JSON.parse(rawBody || "{}") : rawBody;

    if (!response.ok) {
      const errorPayload =
        typeof data === "string"
          ? { error: data }
          : data || { error: "Unknown error" };
      return NextResponse.json(errorPayload, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("⚠️ Error proxying create-invite request:", error);
    return NextResponse.json(
      { error: "Failed to create invite job. Please try again." },
      { status: 500 }
    );
  }
}
