export function log(msg) {
  console.log(`[CookieChyan-JS] ${msg}`);
}

export function showNotification(message, color) {
  const notification = document.createElement("div");
  notification.textContent = message;
  notification.className = "cookie-chyan-notification";
  notification.style.backgroundColor = color;
  notification.style.animation = "cookieChyanSlideIn 0.3s ease-out";

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = "cookieChyanSlideOut 0.3s ease-out";
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 200);
  }, 4000);
}

export function copyToClipboardGM(text) {
  if (typeof GM_setClipboard !== "undefined") {
    log("📄 Copying cookies to clipboard via GM API");
    GM_setClipboard(text, "text");
    showNotification("Cookies successfully copied!", "#27b92788");
    return true;
  }
  return false;
}

export function copyToClipboardNav(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    log("📄 Copying cookies to clipboard via Navigator API");
    navigator.clipboard
      .writeText(text)
      .then(() => {
        showNotification("Cookies successfully copied!", "#27b92788");
      })
      .catch((err) => {
        log("❌ Failed to copy cookies to clipboard, details show below.");
        console.error(err);
        showNotification("Cookies failed to copy!", "#cc2a2a88");
      });
    return true;
  }
  return false;
}
