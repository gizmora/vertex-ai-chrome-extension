import CASE_SCRAPER from "../src/case-scraper";
import SHADOW_DOM from "../src/shadow-dom";

(() => {
  const CASE_STATE = {
    caseId: '',
    contactUsForm: [],
    timeline: [],
    isThreadExpanded: false,
  }


  // initialize SHADOW DOM
  SHADOW_DOM.init();

  
})();