const CLAIMED_CODES = new Set([
  "external_account_exists",
  "identification_claimed",
  "oauth_account_already_exists",
  "oauth_account_already_connected",
  "identifier_already_signed_in",
  "form_identifier_exists",
  "form_identifier_exists__email_address",
]);

const CLAIMED_HINT =
  /already (?:been )?(?:taken|claimed|associated|linked|connected|exists)|identifier.*exist|external account.*exist|この.*すでに|既に使用/i;

export const X_ALREADY_USED_MESSAGE =
  "このXアカウントは、別のおくのアカウントですでに使われています。";

type ErrorPart = {
  code?: string;
  message?: string;
  longMessage?: string;
  long_message?: string;
};

function partsOf(error: unknown): ErrorPart[] {
  if (!error || typeof error !== "object") return [];
  const e = error as ErrorPart & { errors?: ErrorPart[] };
  if (Array.isArray(e.errors) && e.errors.length) return e.errors;
  return [e];
}

function codesAndText(error: unknown): { codes: string[]; text: string } {
  const parts = partsOf(error);
  const codes = parts.map((p) => p.code || "").filter(Boolean);
  const text = parts
    .map((p) => p.longMessage || p.long_message || p.message || "")
    .filter(Boolean)
    .join(" ");
  return { codes, text };
}

export function isXAlreadyUsedError(error: unknown): boolean {
  const { codes, text } = codesAndText(error);
  if (codes.some((c) => CLAIMED_CODES.has(c))) return true;
  if (error instanceof Error && CLAIMED_HINT.test(error.message)) return true;
  return CLAIMED_HINT.test(text);
}

export const isClerkAccountConflict = isXAlreadyUsedError;

export function messageFromClerkXError(error: unknown, fallback = "Xの連携を開始できませんでした"): string {
  if (isXAlreadyUsedError(error)) return X_ALREADY_USED_MESSAGE;
  const { text } = codesAndText(error);
  if (text) return text;
  if (error instanceof Error && error.message) return `${fallback}（${error.message}）`;
  return fallback;
}

export function friendlyXAuthMessage(err: unknown): string {
  return messageFromClerkXError(err, "Xでのログインを完了できませんでした。もう一度お試しください。");
}
