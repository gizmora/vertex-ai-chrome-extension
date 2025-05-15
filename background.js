(() => {
  let sidebarVisible = false;
  const DEBUG = true;
  const CLIENT_ID = DEBUG ? '851787392919-gbida80kl9df7sk7pucn6c2rhu0njqr1.apps.googleusercontent.com' : '189965926617-0q0hu88kporp7fe0iuo2g0210p3qh7lk.apps.googleusercontent.com';
  const REDIRECT_URI = chrome.identity.getRedirectURL();
  const TOKEN_STORAGE_KEY = 'auth_tokens';

  const sendPromptToVertexAI = async function (prompt, cb) {
    // const idToken = await getValidIdToken();
    let url = DEBUG ? 'https://sherlock-demo-851787392919.us-central1.run.app/api/v1/prompt/default' : 'https://sherlock-ai-service-189965926617.us-central1.run.app/api/v1/prompt/default';
    const options = {
      method: 'POST',
      headers: {
        // 'Authorization': 'Bearer ' + idToken,
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
        cb(data)
      } else {
        cb({})
      }
    } catch (error) {
      console.error(error);
      cb({error: error});
    }

  };

  const sendToProxy = async function (prompt, cb) {
    const idToken = await getValidIdToken();
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

  const base64URLEncode = function (str) {
    return btoa(String.fromCharCode(...new Uint8Array(str)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  
  const generateCodeChallenge = async function (verifier) {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return base64URLEncode(digest);
  }
  
  const generateVerifier = function() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return base64URLEncode(array);
  }

  const launchPKCEFlow = async function () {
    const SCOPES = ['openid','email', 'profile'];
    const RESPONSE_TYPE = 'code';
    const VERIFIER = generateVerifier();
    const CHALLENGE = await generateCodeChallenge(VERIFIER);
    const CHALLENGE_METHOD = 'S256';
    const PROMPT = 'consent';
    const ACCESS_TYPE = 'offline';

    const authURL = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&response_type=${RESPONSE_TYPE}` +
    `&scope=${encodeURIComponent(SCOPES.join(' '))}` +
    `&code_challenge=${CHALLENGE}` +
    `&code_challenge_method=${CHALLENGE_METHOD}` +
    `&access_type=${ACCESS_TYPE}` + 
    `&prompt=${PROMPT}`;

    return new Promise((resolve, reject) => {
      chrome.identity.launchWebAuthFlow({
        url: authURL,
        interactive: true
      }, function (redirectUri) {
        if (chrome.runtime.lastError || !redirectUri) {
          reject(chrome.runtime.lastError.message);
          return;
        }

        const url = new URL(redirectUri);
        const code = new URLSearchParams(url.search).get('code');
        if (!code) return reject('No auth code returned');
        
        resolve(exchangeCodeForTokens(code,VERIFIER));
      });
    });
  }

  async function exchangeCodeForTokens(code, verifier) {
    const tokenUrl = 'https://oauth2.googleapis.com/token';
  
    const data = {
      client_id: CLIENT_ID,
      code,
      code_verifier: verifier,
      grant_type: 'authorization_code',
      redirect_uri: REDIRECT_URI
    };
  
    const res = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(data)
    });
  
    const tokens = await res.json();

    if (tokens.error) {
      return (tokens.error_description || 'Token exchange failed');
    }

    await chrome.storage.local.set({ [TOKEN_STORAGE_KEY]: {
      id_token: tokens.id_token,
      refresh_token: tokens.refresh_token
    }});

    return tokens.id_token;
  }

  async function refreshToken(refreshToken) {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })
    });
  
    const result = await response.json();

    if (result.error) {
      throw new Error(result.error_description || 'Failed to refresh token');
    }

    await chrome.storage.local.set({ [TOKEN_STORAGE_KEY]: {
      id_token: result.id_token,
      refresh_token: refresh_token // Keep original
    }});

    return result.id_token;
  }

  function isTokenExpired(idToken) {
    const payload = JSON.parse(atob(idToken.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
  }

  async function getValidIdToken() {
    const result = await chrome.storage.local.get(TOKEN_STORAGE_KEY);
    const { id_token, refresh_token } = result[TOKEN_STORAGE_KEY] || {};
  
    if (id_token && !isTokenExpired(id_token)) {
      return id_token;
    }
  
    if (refresh_token) {
      try {
        return await refreshToken(refresh_token);
      } catch (e) {
        console.warn('Refresh failed, falling back to login:', e.message);
      }
    }
  
    // No valid token, re-authenticate
    return await launchPKCEFlow();
  }
  

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log(`From ${sender.tab}: ${sender.url}`);

    if (request.action === 'generatePrompt' && request.prompt) {
      sendPromptToVertexAI(request.prompt, sendResponse);
      return true;
    }

  });

  chrome.action.onClicked.addListener(async (tab) => {
    sidebarVisible = !sidebarVisible;

    chrome.tabs.sendMessage(tab.id, { 
      action: 'toggleSidebar', 
      visible: sidebarVisible 
    });
  });

  console.log('This is your service worker that runs in background.');
})();