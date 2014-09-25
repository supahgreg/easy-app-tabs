"use strict";

const utils = require("sdk/window/utils");
const winUtils = require("sdk/deprecated/window-utils");

// Handles Double-Click and Ctrl-Click.
function handleEvent(e) {
  // No modifiers other than ctrl allowed.
  if (e.shiftKey || e.altKey || e.metaKey) return;

  // Handle single clicks only with ctrl.
  if (e.ctrlKey != (e.type == "click")) return;

  // Only care about primary clicking
  if (e.button !== 0) return;

  // Ignore invalid targets.
  let target = e.originalTarget;
  if (!isValidTarget(target)) return;

  // Toggle the tab's pinned status.
  let tab = findTab(target);
  if (tab) {
    toggleTab(tab);
  }
}

// Returns whether the given target is valid.
function isValidTarget(target) {
  let classes = target.classList;

  // Ignore clicks on the tabContainer and close buttons.
  return !classes.contains("tab-close-button") &&
         !classes.contains("tabbrowser-tabs");
}

// Finds the parent <tab> for a given node.
function findTab(node) {
  if (!node) {
    return null;
  }

  if (node.classList && node.classList.contains("tabbrowser-tab")) {
    return node;
  }

  // Check the parent if |node| is not a <tab>.
  return findTab(node.parentNode);
}

// Convert a tab to its opposite type (app->reg, reg->app)
function toggleTab(tab) {
  let tabbrowser = tab.ownerDocument.defaultView.gBrowser;

  if (tab.pinned) {
    tabbrowser.unpinTab(tab);
  } else {
    tabbrowser.pinTab(tab);
  }
}

new winUtils.WindowTracker({
  onTrack: function (window) {
    if (utils.isBrowser(window)) {
      window.gBrowser.tabContainer.addEventListener("click", handleEvent);
      window.gBrowser.tabContainer.addEventListener("dblclick", handleEvent);
    }
  },

  onUntrack: function (window) {
    if (utils.isBrowser(window)) {
      window.gBrowser.tabContainer.removeEventListener("click", handleEvent);
      window.gBrowser.tabContainer.removeEventListener("dblclick", handleEvent);
    }
  }
});
