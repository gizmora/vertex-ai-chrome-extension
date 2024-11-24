document.getElementById('submit-prompt').addEventListener('click', () => {
  console.log('CLICKED');

  chrome.runtime.sendMessage({ action: 'generatePrompt' }, (response) => {
    if (response.error) {
      console.error('Error:', response.error);
    } else {
      const generatedText = response.data;
      const reasonsDiv = document.getElementById('reasons');
      document.getElementById('prompt-response').style.display = 'block'; 

      const ul = document.createElement('ul');
      generatedText.failed.forEach((item) => {
        const li = document.createElement('li');
        li.textContent = item.reason;
        ul.appendChild(li);
      });

      reasonsDiv.innerHTML = ''; // Clear existing content
      reasonsDiv.appendChild(ul);
    }
  });
});