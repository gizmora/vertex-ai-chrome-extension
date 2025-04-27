const CASE_SCRAPER = {
  contactUsFormSelector: 'div.first-message.expanded',
  caseDetailsSelector: 'div.issue-details-container',
  sourceSelector: 'issue-detail-row[debugid="sourceRow"] span[debugid="issue-detail-row-value"',
  formLabelSelector: '.form-label',
  formValueSelector: '[debug-id="html-value"]',

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
      this.extractCaseDetails(extensionState);
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
    let _self = this;
    const data = [];
    const contactUsForm = document.querySelector(_self.contactUsFormSelector);
    const formLabels = contactUsForm.querySelectorAll(_self.formLabelSelector);

    formLabels.forEach(formLabelElement => {
      const labelText = formLabelElement.textContent.trim();
      let valueText = null;

      const valueWrapper = formLabelElement.nextElementSibling;

      if (valueWrapper) {
        const fieldValue = valueWrapper.querySelector(_self.formValueSelector);

        if (fieldValue) {
          valueText = fieldValue.textContent.trim();
        }
      
      }

      extensionState.contactUsForm.push({ label: labelText, value: valueText });
    });
    
    console.log(extensionState.contactUsForm);
  }

}

export default CASE_SCRAPER;