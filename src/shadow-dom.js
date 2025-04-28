const SHADOW_DOM = {
  id: 'sherlock-ai',
  _shadowRoot: null,
  pageTemplate: {
    home: `<div class="case-input">
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
    results: `<div id="prompt-response">
      <div id="rules-table"></div>
    </div>`,
  },
  mainContainerSelector: '.main-container',

  createDiv: function (id = '') {
    let div = document.createElement('div');

    if (id !== '') {
      div.id = id;
    }

    return div;
  },

  init: function () {
    let sherlock = this.createDiv('sherlock-ai');
    document.body.appendChild(sherlock);

    this._shadowRoot = sherlock.attachShadow({ mode: 'open' });
  },

  setMessageListener: function (extensionState) {
    let _self = this;
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'toggleSidebar') {
        _self.setSidebar(extensionState);
      }
    });
  },

  setSidebar: async function (extensionState) {
    let _self = this;
    const sidebar = _self._shadowRoot.getElementById('chr-sidebar');

    if (sidebar) {
      sidebar.style.display = sidebar.style.display === 'none' ? 'block' : 'none';
    } else {
      const newSidebar = _self.createDiv('chr-sidebar');
      const page = await UTILS.fetchAsync('../popup/landing.html');

      newSidebar.innerHTML = page;

      UTILS.injectFont();
      _self.setStyling();
      _self.addChild(newSidebar);
      _self.setHeaderIcon();
      _self.setNavListener();
      _self.loadContent('home');
      _self.setSubmitListener();
      CASE_SCRAPER.setCaseLogBtnListener(_self._shadowRoot, extensionState);
    }
  },

  setStyling: async function() {
    let _self = this;

    const css = await UTILS.fetchAsync('../popup/styles.css');
    const styledEl = document.createElement('style');
    styledEl.textContent = css;

    _self.addChild(styledEl);
  },

  setHeaderIcon: async function () {
    let _self = this;
    let iconPath = chrome.runtime.getURL('../assets/images/icon-128.png');
    let iconContainer = _self._shadowRoot.getElementById('sherlock-icon');

    if (iconContainer) {
      iconContainer.src = iconPath;
    } else {
      console.log('No header icon.');
    }
  },

  setNavListener: function () {
    let _self = this;
    const nav = _self._shadowRoot.querySelector('.nav');

    nav.addEventListener('click', (event) => {
      const buttonId = event.target.dataset.navBtnName;

      if (event.target.classList.contains('nav-btn')) {
        _self.loadContent(buttonId);
      }
    });
  },

  loadContent: function(page) {
    let _self = this;
    const mainContainer = _self._shadowRoot.querySelector(_self.mainContainerSelector);

    const contentSections = mainContainer.querySelectorAll('.section-content');
    contentSections.forEach(section => {
      section.style.display = 'none';
    });

    let contentSection = mainContainer.querySelector(`#${page}-content`);

    if (!contentSection) {
      contentSection = _self.createDiv(`${page}-content`);
      contentSection.classList.add('section-content');
      mainContainer.appendChild(contentSection);
      contentSection.innerHTML = _self.pageTemplate[page] || _self.pageTemplate.home;
    }

    contentSection.style.display = 'block';
  },

  setSubmitListener: function() {
    let _self = this;
    const submitButton = _self._shadowRoot.getElementById('submit-prompt');

    if (submitButton) {
      submitButton.addEventListener('click', async () => {
        const caseDetails = _self._shadowRoot.getElementById('case-details').value;
        const isValidInput = UTILS.preprocessPrompt(caseDetails);

        if (isValidInput) {
          _self.setErrorMsg('');
          _self.toggleLoader(true);

          const results = await UTILS.sendMessage({action: 'generatePrompt', prompt: caseDetails});
          _self.toggleLoader(false);

          if (response.error) {
            console.error(response.error);
            return;
          }

          _self.loadContent('results');
          const promptResponse = _self._shadowRoot.getElementById('prompt-response');

          if (promptResponse) {
            promptResponse.style.display = 'block';
          }
          
          const tableContainer = _self._shadowRoot.getElementById('rules-table');

          if (tableContainer && response.data) {
            const generatedText = response.data;
            const myTable = _self.createResultsTable(generatedText.rules);
            tableContainer.innerHTML = '';
            tableContainer.appendChild(myTable); 
          }

        } else {
          _self.setErrorMsg('Insufficient content for checking.');
        }
      });
    } else {
      console.error("Submit button not found in Shadow DOM");
    }
  },

  setErrorMsg: function (msg) {
    let errorLabel = this._shadowRoot.getElementById('error-label');
    errorLabel.textContent = msg;
  },

  addChild: function (el) {
    let _self = this;
    
    if (_self._shadowRoot) {
      _self._shadowRoot.appendChild(el);
    } else {
      console.error("Shadow root not initialized");
    }
  },

  toggleLoader: function(show) {
    let _self = this;

    const loader = _self._shadowRoot.getElementById('spinner');

    if (loader) {
      loader.style.display = show? 'inline-block' : 'none';
    }
  }

}