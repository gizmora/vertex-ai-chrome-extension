console.log('This is your service worker that runs in background.');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log(`From ${sender.tab}: ${sender.url}`);

  if (request.action === 'generatePrompt') {
    let url = 'https://vertex-demo-service-851787392919.us-central1.run.app/vertex-ai/generate-prompt';
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }

    fetch(url, options)
    .then((res) => res.json())
    .then((data) => {
      console.log('Vertex AI response: ')
      console.log(data);

      sendResponse({data: data.promptResponse})
    }).catch((error) => {
      console.error(error);
      sendResponse({error: error});
    });

    return true;
  }
});

let sidebarVisible = false; 

chrome.action.onClicked.addListener((tab) => {
  sidebarVisible = !sidebarVisible; // Toggle visibility

  chrome.tabs.sendMessage(tab.id, { 
    action: 'toggleSidebar', 
    visible: sidebarVisible 
  });
});