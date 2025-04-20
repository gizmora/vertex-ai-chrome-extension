const SHADOW_DOM = {
  containerId: 'sherlock-ai',
  _shadowRoot: null,
  mainContainerSelector: '.main-container',
  homeTemplate: 
  `<div class="case-input">
    <div class="main-heading">Case Details</div>
    <div class="subheading">Narrate case details here to identify points for correction</div>
    <textarea placeholder="Ex: Email exchange between agent and customer" id="case-details"></textarea>
    <div id="error-label"></div>
  </div>
  <div class="__action-btn">
    <button id="submit-prompt" class="mat-raised-button">Run Diagnostics</button>
    <button id="case-logs" class="mat-raised-button">Click Case Logs</button>
    <div id="spinner"></div>
  </div>`,
  resultsTemplate: 
  `<div id="prompt-response">
    <div id="rules-table"></div>
  </div>`,

  init: function () {
    let mainDiv = document.createElement('div');
    mainDiv.id = this.containerId;
    document.body.appendChild(mainDiv);
    this._shadowRoot = mainDiv.attachShadow({ mode: 'open' });
  },

  addChild: function (el) {
    let _self = this;
    
    if (_self._shadowRoot) {
      _self._shadowRoot.appendChild(el);
    } else {
      console.error("Shadow root not initialized");
    }
  },

  addMessageListener: function() {
    let _self = this;
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'toggleSidebar') {
        _self.setLayout();
      }
    });
  },

  sendMessage: function(msg, cb) {
    chrome.runtime.sendMessage(msg, (response) => {
      cb(response);
    });
  },
};

export default SHADOW_DOM;