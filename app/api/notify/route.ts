import { currentUser, unauthorized } from "@/lib/current-user";
import { putNotifySettings, settingsForEmail } from "@/lib/notify";

export async function GET(request: Request) {
  const user = await currentUser(request);
  if (!user) return unauthorized();
  const state = await settingsForEmail(user.email);
  return Response.json(state);
}

export async function POST(request: Request) {
  const user = await currentUser(request);
  if (!user) return unauthorized();
  let body: { enabled?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ message: "設定を読み取れませんでした。" }, { status: 400 });
  }
  if (typeof body.enabled !== "boolean") {
    return Response.json({ message: "enabled は boolean で指定してください。" }, { status: 400 });
  }
  await putNotifySettings(user.folder, body.enabled);
  const state = await settingsForEmail(user.email);
  return Response.json(state);
}
