export const LINE_ALREADY_USED_MESSAGE =
  "このLINEアカウントは、別のおくのアカウントですでに使われています。";

export const LINE_UNAVAILABLE_MESSAGE =
  "このアカウントではLINE連携できません。メールのあるアカウントでログインし直してください。";

export const LINE_LINKED_MESSAGE = "LINEを連携しました。";

export const LINE_DENIED_MESSAGE = "LINEの連携がキャンセルされました。";

export function messageForLineLinkFlag(flag: string | null | undefined): string | null {
  if (flag === "conflict") return LINE_ALREADY_USED_MESSAGE;
  if (flag === "unavailable") return LINE_UNAVAILABLE_MESSAGE;
  if (flag === "denied") return LINE_DENIED_MESSAGE;
  if (flag === "linked") return LINE_LINKED_MESSAGE;
  if (flag === "expired") return "LINEの確認の有効期限が切れました。もう一度お試しください。";
  if (flag === "failed") return "LINEとの連携を完了できませんでした。もう一度お試しください。";
  return null;
}

export function lineLinkNotice(flag: string | null | undefined): { tone: "ok" | "error"; text: string } | null {
  const text = messageForLineLinkFlag(flag);
  if (!text) return null;
  return { tone: flag === "linked" ? "ok" : "error", text };
}
