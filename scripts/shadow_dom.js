const SHADOW_DOM = {
  containerId: 'sherlock-ai',
  _shadowRoot: null, // like this

  init:  function () {
    let _self = this;

    let mainDiv = document.createElement('div');
    mainDiv.id = _self.containerId;
    document.body.appendChild(mainDiv);

    _self._shadowRoot = mainDiv.attachShadow({ mode: 'open' });
    _self.addMessageListener();
  },

  addMessageListener: function() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'toggleSidebar') {
        toggleSidebar();
      }
    });
  },

  sendMessage: function(msg, cb) {
    chrome.runtime.sendMessage(msg,cb);
  },

  fetchUrl: function (url, cb) {
    fetch(chrome.runtime.getURL(url))
      .then((response) => response.text())
      .then(res => {
        cb(res);
      }).catch(error => {
        console.error(error)
      });
  },

  addChild: function (el) {
    let _self = this;
    
    if (_self_shadowRoot) {
      _self_shadowRoot.appendChild(el);
    } else {
      console.error("Shadow root not initialized");
    }
  },

  setLayout: function() {
    let _self = this;

    const sidebar = document.getElementById('chr-sidebar');

    if (sidebar) {
      sidebar.style.display = sidebar.style.display === 'none' ? 'block' : 'none'; 
    } else {
      const newSidebar = document.createElement('div');
      newSidebar.id = 'chr-sidebar';

      _self.fetchUrl('../popup/landing.html', (page) => {
        newSidebar.innerHTML = page;

        document.body.appendChild(newSidebar);
      })
    }
  },

  addSubmitListener() {
    document.getElementById('submit-prompt').addEventListener('click', () => {
      console.log('clicked');

    })
  }
}

(() => {
  SHADOW_DOM.init();
})();