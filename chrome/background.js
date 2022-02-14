chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.query({ active: true, lastFocusedWindow: true }, async (tabs) => {
    let activeTab = tabs[0];
    if (activeTab.url.includes("https://www.youtube.com/watch?v=")) {
      // tab = await chrome.tabs.create({ url: `ytdl://start` });
      // setTimeout(async () => {
      tab = await chrome.tabs.create({ url: `ytdl://${activeTab.url}` });
      // }, 1000);
      // setTimeout(() => {
      // chrome.tabs.remove(tab.id);
      // }, 500);
    }
  });
});
