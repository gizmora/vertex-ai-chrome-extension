(() => {
  const SHADOW_DOM = {
    containerId: 'sherlock-ai',
    _shadowRoot: null,
  
    init:  function () {
      let _self = this;
  
      let mainDiv = document.createElement('div');
      mainDiv.id = _self.containerId;
      document.body.appendChild(mainDiv);
  
      _self._shadowRoot = mainDiv.attachShadow({ mode: 'open' });
      _self.addMessageListener();   
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
      
      if (_self._shadowRoot) {
        _self._shadowRoot.appendChild(el);
      } else {
        console.error("Shadow root not initialized");
      }
    },
  
    setLayout: function() {
      let _self = this;
  
      const sidebar = _self._shadowRoot.getElementById('chr-sidebar');
  
      if (sidebar) {
        sidebar.style.display = sidebar.style.display === 'none' ? 'block' : 'none'; 
      } else {
        const newSidebar = document.createElement('div');
        newSidebar.id = 'chr-sidebar';
  
        _self.fetchUrl('../popup/landing.html', (page) => {
          newSidebar.innerHTML = page;
  
          document.body.appendChild(newSidebar);
          _self.addChild(newSidebar);
          _self.addSubmitListener();
  
          _self.setStyling();
          _self.setHeaderIcon();
        });
      }
    },
  
    setStyling: function() {
      let _self = this;
  
      _self.fetchUrl('../popup/styles.css', (css) => {
        const styledEl = document.createElement('style');
        styledEl.textContent = css;
  
        _self.addChild(styledEl);
      });
    },
  
    addSubmitListener() {
      let _self = this;
      const submitButton = _self._shadowRoot.getElementById('submit-prompt');
  
      if (submitButton) {
        submitButton.addEventListener('click', () => {
          console.log('clicked');
    
          _self.sendMessage({action: 'generatePrompt'}, (response) => {
            if (response.error) {
              console.error(response.error);
            } else {
              const generatedText = response.data;
              const reasonList = document.createElement('ul');
              const reasonsDiv = _self._shadowRoot.getElementById('reasons');
              const suggestionList = document.createElement('ul');
              const suggestionsDiv = _self._shadowRoot.getElementById('suggestions');
    
              this._shadowRoot.getElementById('prompt-response').style.display = 'block';
  
              let failedCtr = 0;
              let passedCtr = 0;
    
              generatedText.rules.forEach((item) => {
                if (item.passed) {
                  this.createListItem(item, 'passed', suggestionList);
                  passedCtr++;
                } else {
                  this.createListItem(item, 'reason', reasonList);
                  failedCtr++;
                }
              });
  
              _self._shadowRoot.getElementById("failed-count").textContent = `(${failedCtr})`;
              _self._shadowRoot.getElementById("passed-count").textContent = `(${passedCtr})`;
    
              reasonsDiv.innerHTML = '';
              suggestionsDiv.innerHTML = '';
    
              reasonsDiv.appendChild(reasonList);
              suggestionsDiv.appendChild(suggestionList);
            }
          })
        })
      } else {
        console.error("Submit button not found in Shadow DOM");
      }
      
    },
  
    createListItem: function (item, type, parent) {
      let li = document.createElement('li');
  
      li.textContent = type === 'reason' ? item.reason : item.rule;
      parent.appendChild(li);
    },

    setHeaderIcon: function () {
      let _self = this;
      let iconPath = chrome.runtime.getURL('../images/icon-128.png');
      let iconContainer = _self._shadowRoot.getElementById('sherlock-icon');

      if (iconContainer) {
        iconContainer.src = iconPath;
      } else {
        console.log('No header icon.');
      }
    }
  }
  
  SHADOW_DOM.init();
})();