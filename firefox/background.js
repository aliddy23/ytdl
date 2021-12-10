chrome.browserAction.onClicked.addListener((tab) => {
  chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
    let activeTab = tabs[0];
    if (activeTab.url.includes("https://www.youtube.com/watch?v="))
      chrome.tabs.create({ url: `ytdl://${activeTab.url}` });
  });
});
