const CASE_SCRAPER = {
  caseLogBtnListener: function () {
    let _self = this;
    const caseLogsBtn = _self._shadowRoot.getElementById('case-logs');

    if (caseLogsBtn) {
      caseLogsBtn.addEventListener('click', () => {
        const caseLogButton = document.querySelector('material-button[aria-label="Case log"]');

        if (caseLogButton) {
          if (!_self.isThreadExpanded) {
            caseLogButton.click();

            const observer = new MutationObserver(mutationsList => {
              for (const mutation of mutationsList) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                  const caseLogs = document.querySelector('card[card-type="case-log"]');
      
                  if (caseLogs && caseLogs.classList.contains('focused')) {
                    observer.disconnect();

                    const expandThreadsButton = document.querySelector('material-button[debug-id="collapse-expand-all-button"]');

                    if (expandThreadsButton && !_self.isThreadExpanded) {
                      expandThreadsButton.click();
                      _self.isThreadExpanded = true;
                    }
    
                  }
                }
              }
            });
      
            observer.observe(document.body, { attributes: true, subtree: true });
          } else {
            _self.extractCaseDetails();
          }
    
        } else {
          console.log('no button');
        }
      })
    } else {
      console.error("Case logs button not found in Shadow DOM");
    }
    
  },
  
  extractCaseDetails: function () {
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

      _self.contactUsForm.push({ label: labelText, value: valueText });
    });
    
    console.log(_self.contactUsForm);
  },

  resetState: function () {
    this.contactUsForm = [];
    this.timeline = [];
    this.caseId = '';
  },

  routeChangeHandler: function () {
    this.resetState();
    console.log('SHERLOCK AI: Hash changed!', window.location.hash);
    const hashUrl = window.location.hash;

    if (!hashUrl) {
      return null;
    }
  
    const pathPart = hashUrl.substring(1);
  
    if (!pathPart.startsWith('/case/')) {
      return null;
    }
  
    this.caseId = pathPart.substring('/case/'.length).trim();

    console.log(`SHERLOCK AI: Case ID is ${this.caseId}`);
  },

  buildCaseSummaryTemplate: function () {
    let _self = this;
    let caseDetails = _self.contactUsForm.map((field) => {
      return `<p>${field.label}: ${field.value}</p>`
    }).join('');
    let summaryTemplate = `<div class="case-summary">
      <h2>CASE <span>${_self.caseId}</span></h2>
      ${caseDetails}
    </div>`;
  }
}

export default CASE_SCRAPER;