/** LINEアプリ内ブラウザかどうか */
export function isLineInApp(ua: string): boolean {
  return /\bLine\//i.test(ua);
}

/** LINEで開いたときに外部ブラウザへ飛ばすURL（openExternalBrowser=1） */
export function externalBrowserUrl(href: string): string {
  const u = new URL(href);
  u.searchParams.set("openExternalBrowser", "1");
  return u.toString();
}
