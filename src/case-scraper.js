const CASE_SCRAPER = {
  setCaseLogBtnListener: function(_shadowRoot, extensionState) {
    let _self = this;
    const extractCaseLogsBtn = _shadowRoot.getElementById('case-logs');

    if (!extractCaseLogsBtn) {
      console.error("Case logs button not found in Shadow DOM");
      return;
    }

    caseLogsBtn.addEventListener('click', () => {
      _self.handleCaseLogButtonClick(extensionState);
    });
  },

  handleCaseLogButtonClick: function(extensionState) {
    const caseLogButton = document.querySelector('material-button[aria-label="Case log"]');
  
    if (!caseLogButton) {
      console.log('No "Case log" button found in the main document.');
      return;
    }
  
    if (!extensionState.isThreadExpanded) {
      this.expandCaseLogsThread(extensionState);
    } else {
      this.extractCaseDetails();
    }
  },

  expandCaseLogsThread: function(extensionState) {
    const caseLogButton = document.querySelector('material-button[aria-label="Case log"]');
    
    caseLogButton.click();
    const observer = new MutationObserver(mutationsList => {
      for (const mutation of mutationsList) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const caseLogs = document.querySelector('card[card-type="case-log"]');

          if (caseLogs && caseLogs.classList.contains('focused')) {
            observer.disconnect();

            const expandThreadsButton = document.querySelector('material-button[debug-id="collapse-expand-all-button"]');

            if (expandThreadsButton && !extensionState.isThreadExpanded) {
              expandThreadsButton.click();
              extensionState.isThreadExpanded = true;
            }
            
            break;
          }
        }
      }
    });

    observer.observe(document.body, { attributes: true, subtree: true });
  },

  extractCaseDetails: function() {

  }

}

export default CASE_SCRAPER;