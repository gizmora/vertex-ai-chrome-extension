(() => {
  // initialize SHADOW DOM
  SHADOW_DOM.init();
  SHADOW_DOM.setMessageListener();

  // Add listener for url change
  window.addEventListener('hashchange', () => {
    console.log('SHERLOCK AI: Hash changed!', window.location.hash);
    const hashUrl = window.location.hash;
    
    // Reset 
    UTILS.resetGlobals();

    if (!hashUrl) {
      return null;
    }
  
    const pathPart = hashUrl.substring(1);
  
    if (!pathPart.startsWith('/case/')) {
      return null;
    }
  
    GLOBAL.caseId = pathPart.substring('/case/'.length).trim();

    console.log(`SHERLOCK AI: Case ID is ${GLOBAL.caseId}`);
  });

})();