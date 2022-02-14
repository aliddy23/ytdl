chrome.browserAction.onClicked.addListener((tab) => {
  chrome.tabs.query({ active: true, lastFocusedWindow: true }, async (tabs) => {
    let activeTab = tabs[0];
    if (activeTab.url.includes("https://www.youtube.com/watch?v=")) {
      let tab = await chrome.tabs.create({ url: `ytdl://${activeTab.url}` });
      setTimeout(() => {
        chrome.tabs.remove(tab.id);
      }, 500);
    }
  });
});
