(() => {
  let sidebarVisible = false;
  const DEBUG = false;

  const sendPromptToVertexAI = function (prompt, cb) {
    let url = DEBUG ? 'http://localhost:8080/vertex-ai/generate-prompt' : 'https://sherlock-demo-851787392919.us-central1.run.app/api/v1/prompt/default';
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }

    if (prompt && prompt !== '') {
      options.body = JSON.stringify({
        prompt: {
          text: prompt
        }
      });
    }

    fetch(url, options)
    .then((res) => res.json())
    .then((data) => {
      console.log('Vertex AI response: ')
      console.log(data);

      cb({data: data.promptResponse})
    }).catch((error) => {
      console.error(error);
      cb({error: error});
    });
  };

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log(`From ${sender.tab}: ${sender.url}`);

    if (request.action === 'generatePrompt' && request.prompt) {
      sendPromptToVertexAI(request.prompt, sendResponse);
      return true;
    }
  });

  chrome.action.onClicked.addListener((tab) => {
    sidebarVisible = !sidebarVisible; // Toggle visibility

    chrome.tabs.sendMessage(tab.id, { 
      action: 'toggleSidebar', 
      visible: sidebarVisible 
    });
  });

  console.log('This is your service worker that runs in background.');
})();