console.log('This is your service worker that runs in background.');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log(`From ${sender.tab}: ${sender.url}`);

  if (request.action === 'generatePrompt') {
    const prompt = request.prompt ? request.prompt : '';
    sendPromptToVertexAI(prompt,sendResponse);
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

const sendPromptToVertexAI = function (prompt, cb) {
  let url = 'http://localhost:8888/vertex-ai/generate-prompt';
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