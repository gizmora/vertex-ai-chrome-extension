const SHADOW_DOM = {
  id: 'sherlock-ai',
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
  resultsData: [],

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

    GLOBAL._shadowRoot = sherlock.attachShadow({ mode: 'open' });
  },

  setMessageListener: function () {
    let _self = this;
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'toggleSidebar') {
        _self.setSidebar();
      }
    });
  },

  setSidebar: async function () {
    let _self = this;
    const sidebar = GLOBAL._shadowRoot.getElementById('chr-sidebar');

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
      CASE_SCRAPER.setCaseLogBtnListener();
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
    let iconContainer = GLOBAL._shadowRoot.getElementById('sherlock-icon');

    if (iconContainer) {
      iconContainer.src = iconPath;
    } else {
      console.log('No header icon.');
    }
  },

  setNavListener: function () {
    let _self = this;
    const nav = GLOBAL._shadowRoot.querySelector('.nav');

    nav.addEventListener('click', (event) => {
      const buttonId = event.target.dataset.navBtnName;

      if (event.target.classList.contains('nav-btn')) {
        _self.loadContent(buttonId);
      }
    });
  },

  loadContent: function(page) {
    let _self = this;
    const mainContainer = GLOBAL._shadowRoot.querySelector(_self.mainContainerSelector);

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
    const submitButton = GLOBAL._shadowRoot.getElementById('submit-prompt');

    if (submitButton) {
      submitButton.addEventListener('click', async () => {
        const caseDetails = GLOBAL._shadowRoot.getElementById('case-details').value;
        const isValidInput = UTILS.checkInputValidity(caseDetails);

        if (isValidInput) {
          _self.setErrorMsg('');
          _self.toggleLoader(true);

          const response = await UTILS.sendMessage({action: 'generatePrompt', prompt: caseDetails});
          _self.toggleLoader(false);

          if (response.error) {
            console.error(response.error);
            return;
          }

          _self.loadContent('results');
          const promptResponse = GLOBAL._shadowRoot.getElementById('prompt-response');

          if (promptResponse) {
            promptResponse.style.display = 'block';
          }
          
          const tableContainer = GLOBAL._shadowRoot.getElementById('rules-table');
          console.log({response})

          if (tableContainer && response.result) {
            _self.showScore(response);
            const generatedText = response.result;
            console.log(generatedText);
            const myTable = _self.createResultsTable(generatedText);
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
    let errorLabel = GLOBAL._shadowRoot.getElementById('error-label');
    errorLabel.textContent = msg;
  },

  addChild: function (el) {
    if (GLOBAL._shadowRoot) {
      GLOBAL._shadowRoot.appendChild(el);
    } else {
      console.error("Shadow root not initialized");
    }
  },

  toggleLoader: function(show) {
    let _self = this;

    const loader = GLOBAL._shadowRoot.getElementById('spinner');

    if (loader) {
      loader.style.display = show? 'inline-block' : 'none';
    }
  },

  createResultsTable: function(results) {
    let _self = this;
    console.log(results);

    results.failed_parameters.forEach(param => {
      _self.resultsData.push({rule: param.name, suggestion: param.suggestion, passed: false});
    });

    results.passed_parameters.forEach(param => {
      _self.resultsData.push({rule: param.name, passed: true});
    });

    const table = document.createElement('table');
    const headerRow = document.createElement('tr');

    ['Parameter', 'Status'].forEach(headerText => {
      const header = document.createElement('th');
      header.textContent = headerText;
      headerRow.appendChild(header);
    });

    table.appendChild(headerRow);
    
    for (let i=0; i < _self.resultsData.length; i++) {
      const row = document.createElement('tr');

      const ruleCell = document.createElement('td');
      let ruleTemplate = `<div>${_self.resultsData[i].rule}</div>`;

      if (!_self.resultsData[i].passed) {
        ruleTemplate += `
        <div class="suggestion">
          <div class="sherlock-says-header">
            <img src="${chrome.runtime.getURL('../assets/images/suggestion-24px.png')}" alt="Suggestion" class="bulb">
            <span class="sherlock-says">What to improve...</span>
          </div>
          <div>${_self.resultsData[i].suggestion ? '"' + _self.resultsData[i].suggestion + '"' : ''}</div>
        </div>
        `;
      }

      ruleCell.innerHTML = ruleTemplate;

      row.appendChild(ruleCell);

      const passedCell = document.createElement('td');
      const passedDiv = document.createElement('div');

      const img = document.createElement('img');
      img.src = _self.resultsData[i].passed ? chrome.runtime.getURL('../assets/images/passed-24px.png') : chrome.runtime.getURL('../assets/images/failed-24px.png'); // Set image based on passed status
      img.alt = _self.resultsData[i].passed ? 'Passed' : 'Failed';
      img.classList.add('status-icon');
      passedDiv.appendChild(img);

      passedCell.appendChild(passedDiv);
      row.appendChild(passedCell);

      table.appendChild(row);
    }

    return table;
  },

  showScore: function(results) {
    const promptResponse = GLOBAL._shadowRoot.getElementById('prompt-response');
    const score = document.createElement('p');
    const highlights = document.createElement('p');
    const lowlights = document.createElement('p');
    const data = results.result;

    score.innerHTML = `<span class="sherlock-says">Score: </span> ${data.passed_count}/${data.failed_count + data.passed_count} ~ ${Math.round(data.score * 100)}%, <span class="sherlock-says">Skipped: </span> ${data.skipped_count}`;
    highlights.innerHTML = `<span class="sherlock-says">Highlights: </span> ${data.highlights}`;
    lowlights.innerHTML = `<span class="sherlock-says">Lowlights: </span> ${data.lowlights}`;
    
    promptResponse.prepend(highlights);
    promptResponse.prepend(lowlights);
    promptResponse.prepend(score);
  }

}