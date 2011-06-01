Components.utils.import("resource://gre/modules/Services.jsm");

let cleanupAry = [];
function addUnloader(cleaner) cleanupAry.push(cleaner) - 1;
function addUnloaderForWindow(win, cleaner) {
  let index1 = addUnloader(cleaner);
  let index2 = addUnloader(function() {
    win.removeEventListener("unload", winUnload, false);
  });

  // Remove unload funcs above if the window is closed.
  function winUnload() {
    cleanupAry[index1] = null;
    cleanupAry[index2] = null;
  }
  win.addEventListener("unload", winUnload, false);
}

/**
 * Helper that adds event listeners and remembers to remove on unload
 */
function listen(win, node, event, func) {
  node.addEventListener(event, func, true);
  addUnloaderForWindow(win, function() {
    node.removeEventListener(event, func, true);
  });
}

function main(win) {
  let tabBrowser = win.getBrowser();

  function bindTab(tab) {
    // Double-click
    listen(win, tab, "dblclick", function(e) {
      // Only care about primary clicking
      if (e.button !== 0) return;

      // Convert a tab to its opposite type (app->reg, reg->app)
      if (tab.pinned)
        tabBrowser.unpinTab(tab);
      else
        tabBrowser.pinTab(tab);
    });

    // Ctrl + primary click
    listen(win, tab, "click", function(e) {
      // Only care about primary clicking
      if (e.button !== 0) return;

      // Only allow ctrl
      if (!e.ctrlKey || e.shiftKey || e.altKey || e.metaKey) return;

      // Convert a tab to its opposite type (app->reg, reg->app)
      if (tab.pinned)
        tabBrowser.unpinTab(tab);
      else
        tabBrowser.pinTab(tab);
    });
  }

  // Listen for new tabs
  listen(win, win, "TabOpen", function(event) {
    let tab = event.target;
    bindTab(tab);
  });

  // Bind listener to existing tabs
  for (let [, tab] in Iterator(tabBrowser.tabs))
    bindTab(tab);
}

function install(){}
function uninstall(){}
function startup() {
  let browserWins = Services.wm.getEnumerator("navigator:browser");
  while (browserWins.hasMoreElements())
    main(browserWins.getNext());

  function winObs(aSubject, aTopic) {
    if ("domwindowopened" != aTopic) return;
    let winLoad = function() {
      aSubject.removeEventListener("load", winLoad, false);
      if ("navigator:browser" ==
          aSubject.document.documentElement.getAttribute("windowtype"))
        main(aSubject);
    }
    aSubject.addEventListener("load", winLoad, false);
  }
  Services.ww.registerNotification(winObs);
  cleanupAry.push(function() Services.ww.unregisterNotification(winObs));
}
function shutdown(data, reason) {
  if (reason !== APP_SHUTDOWN)
    for (let [, cleaner] in Iterator(cleanupAry)) cleaner && cleaner();
}
