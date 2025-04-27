import SHADOW_DOM from './src/shadow-dom.js';

(() => {
  const CASE_STATE = {
    caseId: '',
    contactUsForm: [],
    timeline: [],
    isThreadExpanded: false,
  }

  // initialize SHADOW DOM
  SHADOW_DOM.init();
  SHADOW_DOM.setMessageListener(CASE_STATE);

  // Add listener for url change
  window.addEventListener('hashchange', () => {
    console.log('SHERLOCK AI: Hash changed!', window.location.hash);
    const hashUrl = window.location.hash;
    
    // Reset 
    CASE_STATE.contactUsForm = [];
    CASE_STATE.timeline = [];
    CASE_STATE.caseId = '';
    CASE_STATE.isThreadExpanded = false;

    if (!hashUrl) {
      return null;
    }
  
    const pathPart = hashUrl.substring(1);
  
    if (!pathPart.startsWith('/case/')) {
      return null;
    }
  
    this.CASE_STATE.caseId = pathPart.substring('/case/'.length).trim();

    console.log(`SHERLOCK AI: Case ID is ${this.caseId}`);
  });

})();