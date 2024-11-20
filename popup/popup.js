console.log('POPUP JS');

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('submit-prompt').addEventListener('click', () => {
    console.log('CLICKED')
  
    chrome.runtime.sendMessage({ action: 'generatePrompt'}, (response) => {
      if (response.error) {
        console.error('Error:', response.error);
      } else {
        const generatedText = response.data;
        const reasonsDiv = document.getElementById('reasons');
        const promptResponse = document.getElementById('prompt-response');
        promptResponse.style.display = 'block';
        // Do something with the generated text
        const ul = document.createElement('ul');

        generatedText.failed.forEach((item) => {
          const li = document.createElement('li');

          li.textContent = item.reason;
          ul.appendChild(li);
        });

        reasonsDiv.innerHTML = '';
        reasonsDiv.appendChild(ul);
      }
    });
  });
});


$(document).ready(function(){
  alert('popup: JQUERY works!');
});