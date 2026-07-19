// Isolated-world storage bridge for the Halcyon browser extension.
//
// This content script runs in the extension's isolated world, where chrome.*
// is available. It relays chrome.storage.local to and from the Halcyon payload
// in the page's main world over window.postMessage. Only keys under the
// "halcyon:" namespace ever cross the boundary.
//
// Plain ES5-ish JavaScript on purpose: it is copied verbatim, not bundled.

(function () {
  "use strict";

  var FROM_MAIN = "halcyon:ext:main";
  var FROM_BRIDGE = "halcyon:ext:bridge";
  var PREFIX = "halcyon:";

  function sendHydrate() {
    try {
      chrome.storage.local.get(null, function (all) {
        var entries = {};
        for (var key in all) {
          if (Object.prototype.hasOwnProperty.call(all, key) && key.indexOf(PREFIX) === 0) {
            entries[key] = all[key];
          }
        }
        window.postMessage({ channel: FROM_BRIDGE, kind: "hydrate", entries: entries }, "*");
      });
    } catch (err) {
      // If storage is unavailable, report an empty hydrate so the payload can
      // proceed on defaults instead of waiting.
      window.postMessage({ channel: FROM_BRIDGE, kind: "hydrate", entries: {} }, "*");
    }
  }

  window.addEventListener("message", function (event) {
    if (event.source !== window) return;
    var data = event.data;
    if (!data || data.channel !== FROM_MAIN) return;

    if (data.kind === "hydrate") {
      sendHydrate();
    } else if (data.kind === "write" && typeof data.key === "string") {
      try {
        var write = {};
        write[data.key] = data.value;
        chrome.storage.local.set(write);
      } catch (err) {
        /* ignore: a failed write is not worth crashing over */
      }
    } else if (data.kind === "remove" && typeof data.key === "string") {
      try {
        chrome.storage.local.remove(data.key);
      } catch (err) {
        /* ignore */
      }
    }
  });

  // Proactively hydrate on load, covering the case where the main-world payload
  // posted its request before this listener was attached.
  sendHydrate();
})();
