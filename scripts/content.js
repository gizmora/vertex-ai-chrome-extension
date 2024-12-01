console.log('This is your content script.');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggleSidebar') {
    toggleSidebar();
  }
});

function toggleSidebar() {
  const sidebar = document.getElementById('chr-sidebar');
  if (sidebar) {
    sidebar.style.display = sidebar.style.display === 'none' ? 'block' : 'none'; 
  } else {
    const newSidebar = document.createElement('div');
    newSidebar.id = 'chr-sidebar';

    fetch(chrome.runtime.getURL('../popup/landing.html'))
      .then(response => response.text())
      .then(page => {
        newSidebar.innerHTML = page;

        document.body.appendChild(newSidebar);
        addSubmitPromptListener();
      })
      .catch(error => {
        console.error('Error loading sidebar:', error);
      });
  }
}

function addSubmitPromptListener() {
  document.getElementById('submit-prompt').addEventListener('click', () => {
    console.log('CLICKED');
  
    chrome.runtime.sendMessage({ action: 'generatePrompt' }, (response) => {
      if (response.error) {
        console.error('Error:', response.error);
      } else {
        const generatedText = response.data;
        const reasonsDiv = document.getElementById('reasons');
        const suggestionsDiv = document.getElementById('suggestions');
        document.getElementById('prompt-response').style.display = 'block'; 
  
        const ul = document.createElement('ul');
        const ul2 = document.createElement('ul');
        generatedText.failed.forEach((item) => {
          const li = document.createElement('li');
          const li2 = document.createElement('li');
          li2.textContent = item.suggestion;
          li.textContent = item.reason;
          ul.appendChild(li);
          ul2.appendChild(li2);
        });
  
        reasonsDiv.innerHTML = '';
        reasonsDiv.appendChild(ul);
        suggestionsDiv.innerHTML = '';
        suggestionsDiv.appendChild(ul2);
      }
    });
  });
}