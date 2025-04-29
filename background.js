(() => {
  let sidebarVisible = false;
  const DEBUG = false;

  const sendPromptToVertexAI = async function (prompt, cb) {
    const token = await getOauthToken();
    
    let url = DEBUG ? 'http://localhost:8080/vertex-ai/api/v1/prompt/default' : 'https://sherlock-ai-service-189965926617.us-central1.run.app/api/v1/prompt/default';
    const options = {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
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

      if (data.result) {
        cb({data: data.result})
      } else {
        cb({data: []})
      }

    }).catch((error) => {
      console.error(error);
      cb({error: error});
    });
  };

  const getOauthToken = async function (interactive = false) {
    return new Promise ((resolve, reject) => {
      chrome.identity.getAuthToken({interactive}, function(token) {
        if (chrome.runtime.lastError) {
          console.error('[Sherlock AI] Auth failed:', chrome.runtime.lastError.message);
          reject(chrome.runtime.lastError.message);
        } else {
          console.log('[Sherlock AI] Token retrieved:', token);
          resolve(token);
        }
      });
    });
  }

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log(`From ${sender.tab}: ${sender.url}`);

    if (request.action === 'generatePrompt' && request.prompt) {
      sendPromptToVertexAI(request.prompt, sendResponse);
      return true;
    }

    if (request.action === 'getOauthToken') {
      getOauthToken(sendResponse);
      return true;
    }
  });

  chrome.action.onClicked.addListener((tab) => {
    sidebarVisible = !sidebarVisible;

    chrome.tabs.sendMessage(tab.id, { 
      action: 'toggleSidebar', 
      visible: sidebarVisible 
    });
  });

  console.log('This is your service worker that runs in background.');
})();