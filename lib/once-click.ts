/** 連続タップで同じリンクが二重に開かないようにする（ページを読み直せばまた押せる） */
export function guardOnceClick(event: { currentTarget: { dataset: DOMStringMap }; preventDefault: () => void }): boolean {
  const el = event.currentTarget;
  if (el.dataset.onceClick === "1") {
    event.preventDefault();
    return false;
  }
  el.dataset.onceClick = "1";
  return true;
}
