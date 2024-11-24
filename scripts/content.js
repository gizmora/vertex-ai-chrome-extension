console.log('This is your content script.');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggleSidebar') {
    toggleSidebar();
  }
});

function toggleSidebar() {
  const sidebar = document.getElementById('chr-sidebar');
  if (sidebar) {
    // Sidebar exists, toggle its visibility
    sidebar.style.display = sidebar.style.display === 'none' ? 'block' : 'none'; 
  } else {
    // Sidebar doesn't exist, create and add it
    const newSidebar = document.createElement('div');
    newSidebar.id = 'chr-sidebar';

    fetch(chrome.runtime.getURL('../popup/landing.html'))
      .then(response => response.text())
      .then(page => {
        newSidebar.innerHTML = page;

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = chrome.runtime.getURL('popup/styles.css');
        injectScript(chrome.runtime.getURL('../popup/popup.js'),newSidebar);
        newSidebar.appendChild(link);

        document.body.appendChild(newSidebar);
      })
      .catch(error => {
        console.error('Error loading sidebar:', error);
      });
  }
}

function injectScript(src, container) {
  const script = document.createElement('script');
  script.setAttribute('src', src);
  container.appendChild(script);
}