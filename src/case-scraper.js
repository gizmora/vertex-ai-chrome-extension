const CASE_SCRAPER = {
  contactUsFormSelector: 'div.first-message.expanded',
  caseDetailsSelector: 'div.issue-details-container',
  sourceSelector: 'issue-detail-row[debugid="sourceRow"] span[debugid="issue-detail-row-value"',
  formLabelSelector: '.form-label',
  formValueSelector: '[debug-id="html-value"]',
  activeCaseLogSelector: '.case-log-container.active-case-log-container',
  chatLogSelector: '.message-header.realtime-chat',
  emailThreadSelector: 'div.message-body.email',

  setCaseLogBtnListener: function() {
    let _self = this;
    const extractCaseLogsBtn = GLOBAL._shadowRoot.getElementById('case-logs');

    if (!extractCaseLogsBtn) {
      console.error("Case logs button not found in Shadow DOM");
      return;
    }

    extractCaseLogsBtn.addEventListener('click', () => {
      _self.handleCaseLogButtonClick();
    });
  },

  handleCaseLogButtonClick: function() {
    const caseLogButton = document.querySelector('material-button[aria-label="Case log"]');
  
    if (!caseLogButton) {
      console.log('No "Case log" button found in the main document.');
      return;
    }
  
    this.expandCaseLogsThread();
  },

  expandCaseLogsThread: function() {
    const caseLogButton = document.querySelector('material-button[aria-label="Case log"]');
    
    caseLogButton.click();
    const observer = new MutationObserver(mutationsList => {
      for (const mutation of mutationsList) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const caseLogs = document.querySelector('card[card-type="case-log"]');

          if (caseLogs && caseLogs.classList.contains('focused')) {
            observer.disconnect();

            const expandThreadsButton = document.querySelector('material-button[debug-id="collapse-expand-all-button"]');

            if (expandThreadsButton) {
              const ariaLabel = expandThreadsButton.getAttribute('aria-label');
              const ariaExpanded = expandThreadsButton.getAttribute('aria-expanded');

              if (ariaLabel === "Expand all messages" && ariaExpanded === "false") {
                expandThreadsButton.click();
                GLOBAL.isThreadExpanded = true;
              } else if (ariaLabel === "Collapse all messages" && ariaExpanded === "true") {
                let emailThread = document.querySelectorAll(this.emailThreadSelector) ? document.querySelectorAll(this.emailThreadSelector) : [];
                this.extractCaseDetails();
                this.extractChatLogs();

                emailThread.forEach((email) => {
                  let text = this.extractEmailThread(email);
                  GLOBAL.emailThread += text + '\n';
                });

                console.log(GLOBAL.emailThread);
                if (GLOBAL.emailThread !== '') {
                  const textareaElement = GLOBAL._shadowRoot.querySelector('textarea#case-details');

                  if (textareaElement) {
                    textareaElement.value = GLOBAL.emailThread;
                  }
                }
              } else {
                console.error("Could not determine the thread state based on the button's attributes.");
              }
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
    const caseLogMainContainer = document.querySelector(_self.activeCaseLogSelector);
    GLOBAL.contactUsForm = [];

    if (caseLogMainContainer) {
      const contactUsForm = caseLogMainContainer.querySelector(_self.contactUsFormSelector);
      const formLabels = (contactUsForm) ? contactUsForm.querySelectorAll(_self.formLabelSelector) : [];
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
  
        GLOBAL.contactUsForm.push({ label: labelText, value: valueText });
      });
      
      console.log(GLOBAL.contactUsForm);
    }
  },

  extractChatLogs: async function() {
    let _self = this;
    const caseLogMainContainer = document.querySelector(_self.activeCaseLogSelector);

    if (caseLogMainContainer) {
      const copyChatLogButton = caseLogMainContainer.querySelector('material-button[debug-id="copy-content-button"]');

      if (copyChatLogButton) {
        copyChatLogButton.click();

        await new Promise(resolve => setTimeout(resolve, 150));
        const text = await navigator.clipboard.readText();
        const textareaElement = GLOBAL._shadowRoot.querySelector('textarea#case-details');

        if (textareaElement) {
          textareaElement.value = text;
          textareaElement.dispatchEvent(new Event('input', { bubbles: true }));
          textareaElement.dispatchEvent(new Event('change', { bubbles: true }));
          console.log('Text pasted successfully to the textarea.');
        }
        
        console.log("Sherlock AI Chat log:", text);
      }
    }
  },

  extractEmailThread: function(emailThreadContainer) {
    let allText = '';
  
    function traverse(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        allText += node.textContent;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const displayStyle = window.getComputedStyle(node).display;
        const isBlockLevel = displayStyle === 'block' || displayStyle === 'table' || displayStyle === 'list-item';
  
        if (allText.length > 0 && isBlockLevel) {
          allText += '\n';
    
          for (const child of node.childNodes) {
            traverse(child);
          }
    
          if (isBlockLevel && allText.length > 0 && !allText.endsWith('\n')) {
            allText += '\n';
          } else if (displayStyle !== 'inline' && allText.length > 0 && !allText.endsWith(' ')) {
            allText += ' ';
          }
        }
      }

      traverse(emailThreadContainer);

      
      let finalText = allText.replace(/\s+/g, ' ').replace(/\n+/g, '\n').trim();
      return finalText;
    }
  },

  extractEmailReply: function() {
    // TODO: scrape email reply
  }
}