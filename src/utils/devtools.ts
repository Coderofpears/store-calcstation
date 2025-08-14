declare global {
  interface Window {
    showadmin?: () => void;
  }
}

(function initAdminDevtools() {
  const enable = () => {
    try {
      localStorage.setItem("showAdmin", "1");
      window.dispatchEvent(new Event("showadmin"));
      console.info("[Admin] Admin center enabled. Navigate to /admin or reload the page.");
    } catch (e) {
      console.warn("[Admin] Failed to enable admin center:", e);
    }
  };

  Object.defineProperty(window, "showadmin", {
    value: enable,
    configurable: true,
    writable: false,
  });
})();
