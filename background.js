(() => {
  let sidebarVisible = false;
  const DEBUG = false;
  let idToken = '';

  const sendPromptToVertexAI = async function (prompt, cb) {
    let url = DEBUG ? 'http://localhost:8080/vertex-ai/api/v1/prompt/default' : 'https://sherlock-demo-851787392919.us-central1.run.app/api/v1/prompt/default';
    const options = {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + idToken,
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

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Extension failed: ${response.status} - ${errorText}`);
    }

    try {
      const data = await response.json();

      if (data.result) {
        cb({data: data.result})
      } else {
        cb({data: []})
      }
    } catch (error) {
      console.error(error);
      cb({error: error});
    }

  };

  const sendToProxy = async function (prompt, cb) {
    const options = {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + idToken,
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

    const response = await fetch('https://proxy-service-851787392919.us-central1.run.app/proxy', options);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Extension failed: ${response.status} - ${errorText}`);
    }

    try {
      const data = await response.json();

      if (data.result) {
        cb({data: data.result})
      } else {
        cb({data: []})
      }
    } catch (error) {
      console.error(error);
      cb({error: error});
    }

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

  const launchOAuthFlow = async function () {
    const CLIENT_ID = '851787392919-s4c25ms4bau920o2tb1e6cicd01tot0b.apps.googleusercontent.com';
    const REDIRECT_URI = chrome.identity.getRedirectURL();
    const SCOPES = ['openid','email', 'profile'];
    const RESPONSE_TYPE = 'id_token';
    const NONCE = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    const authURL = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&response_type=${RESPONSE_TYPE}` +
    `&scope=${encodeURIComponent(SCOPES.join(' '))}` +
    `&nonce=${NONCE}` +
    `&prompt=select_account`;

    return new Promise((resolve, reject) => {
      chrome.identity.launchWebAuthFlow({
        url: authURL,
        interactive: true
      }, function (redirectUri) {
        if (chrome.runtime.lastError) {
          console.error('OAuth failed:', chrome.runtime.lastError.message);
          reject(chrome.runtime.lastError.message);
        }

        const params = new URLSearchParams(new URL(redirectUri).hash.substring(1));
        idToken = params.get('id_token');
  
        if (idToken) {
          console.log('Access Token:', idToken);
          resolve(idToken);
        } else {
          reject(false);
        }
      });
    });
  }

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log(`From ${sender.tab}: ${sender.url}`);

    if (request.action === 'generatePrompt' && request.prompt) {
      sendToProxy(request.prompt, sendResponse);
      return true;
    }

    if (request.action === 'getOauthToken') {
      getOauthToken(sendResponse);
      return true;
    }
  });

  chrome.action.onClicked.addListener(async (tab) => {
    sidebarVisible = !sidebarVisible;

    if (idToken === '') {
      idToken = await launchOAuthFlow();
    }

    chrome.tabs.sendMessage(tab.id, { 
      action: 'toggleSidebar', 
      visible: sidebarVisible 
    });
  });

  console.log('This is your service worker that runs in background.');
})();