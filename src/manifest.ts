export const manifest = {
  manifest_version: 3,
  name: "Local Tab Organizer",
  version: "1.0.0",
  description: "Pure local smart tab organizer using Chrome native Tab Groups.",
  permissions: ["tabs", "tabGroups", "storage", "sidePanel", "activeTab"],
  action: {
    default_title: "Local Tab Organizer",
    default_popup: "popup.html"
  },
  side_panel: {
    default_path: "sidepanel.html"
  },
  options_page: "options.html",
  background: {
    service_worker: "serviceWorker.js",
    type: "module"
  },
  icons: {
    "16": "icons/icon16.png",
    "32": "icons/icon32.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
} satisfies chrome.runtime.ManifestV3;
