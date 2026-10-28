import { runDailyCheck } from "@/lib/daily-check";

export const maxDuration = 60;

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET || "";
  if (!secret) return process.env.NODE_ENV !== "production";
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return Response.json({ message: "認証が必要です。" }, { status: 401 });
  }
  const url = new URL(request.url);
  const raw = Number(url.searchParams.get("limit") || "");
  const limit = Number.isFinite(raw) && raw > 0 ? Math.min(Math.floor(raw), 50) : undefined;
  const report = await runDailyCheck(limit);
  return Response.json(report);
}
