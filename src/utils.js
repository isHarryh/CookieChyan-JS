export function log(msg) {
  console.log(`[CookieChyan-JS] ${msg}`);
}

export function copyToClipboardGM(text) {
  if (typeof GM_setClipboard !== "undefined") {
    log("📄 Copying cookies to clipboard via GM API");
    GM_setClipboard(text, "text");
    return true;
  }
  return false;
}

export function copyToClipboardNav(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    log("📄 Copying cookies to clipboard via Navigator API");
    return navigator.clipboard
      .writeText(text)
      .then(() => {
        return true;
      })
      .catch((err) => {
        log("❌ Failed to copy cookies to clipboard, details show below.");
        console.error(err);
        return false;
      });
  }
  return false;
}
