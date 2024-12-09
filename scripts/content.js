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
          
          _self.injectFont('https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,100;0,300;0,400;0,700;0,900;1,100;1,300;1,400;1,700;1,900&family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap');
          _self.setStyling();
          _self._shadowRoot.appendChild(newSidebar);
          _self.addChild(newSidebar);
          _self.addSubmitListener();
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
          const caseDetails = _self._shadowRoot.getElementById('case-details').value;
          
          if (_self.preprocessInput(caseDetails)) {
            _self.sendMessage({action: 'generatePrompt', prompt: caseDetails}, (response) => {
              if (response.error) {
                console.error(response.error);
              } else {
                const generatedText = response.data;
                const reasonList = document.createElement('ul');
                const reasonsDiv = _self._shadowRoot.getElementById('reasons');
                const suggestionList = document.createElement('ul');
                const suggestionsDiv = _self._shadowRoot.getElementById('suggestions');
                const skippedList = document.createElement('ul');
                const skippedDiv = _self._shadowRoot.getElementById('skipped');
      
                this._shadowRoot.getElementById('prompt-response').style.display = 'block';
    
                let failedCtr = 0;
                let passedCtr = 0;
                let skippedCtr = 0;
      
                generatedText.rules.forEach((item) => {
                  if (!item.checked) {
                    this.createListItem(item, 'skipped', skippedList);
                    skippedCtr++;
                  } else if (item.passed) {
                    this.createListItem(item, 'passed', suggestionList);
                    passedCtr++;
                  } else {
                    this.createListItem(item, 'reason', reasonList);
                    failedCtr++;
                  }
                });
    
                _self._shadowRoot.getElementById("failed-count").textContent = `(${failedCtr})`;
                _self._shadowRoot.getElementById("passed-count").textContent = `(${passedCtr})`;
                _self._shadowRoot.getElementById("skipped-count").textContent = `(${skippedCtr})`;
      
                reasonsDiv.innerHTML = '';
                suggestionsDiv.innerHTML = '';
      
                reasonsDiv.appendChild(reasonList);
                suggestionsDiv.appendChild(suggestionList);
                skippedDiv.appendChild(skippedList);
              }
            });
          }
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
      let iconPath = chrome.runtime.getURL('../assets/images/icon-128.png');
      let iconContainer = _self._shadowRoot.getElementById('sherlock-icon');

      if (iconContainer) {
        iconContainer.src = iconPath;
      } else {
        console.log('No header icon.');
      }
    },

    injectFont: function(url) {
      const preconnect1 = document.createElement('link');
      preconnect1.rel = 'preconnect';
      preconnect1.href = 'https://fonts.googleapis.com';
      document.head.appendChild(preconnect1);

      const preconnect2 = document.createElement('link');
      preconnect2.rel = 'preconnect';
      preconnect2.href = 'https://fonts.gstatic.com';
      preconnect2.crossOrigin = 'anonymous'; // Note: crossorigin attribute is set here
      document.head.appendChild(preconnect2);

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      document.head.appendChild(link);
    },

    preprocessInput: function(text) {
      let _self = this;
      let msg = '';
      let errorLabel = _self._shadowRoot.getElementById('error-label')

      if ((text.split(/\s+/).length < 3) || !/\b(is|are|was|were|have|has|had|do|does|did|\w+ing)\b/i.test(text)) { // Less than 3 words
        msg = 'Insufficient content for rule checking';
      } else {
        msg = '';
      }
      
      errorLabel.textContent = msg;

      return msg !== '' ? false : true;
    }
  }
  
  SHADOW_DOM.init();
})();