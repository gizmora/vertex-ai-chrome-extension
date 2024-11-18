console.log('POPUP JS');

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('submit-prompt').addEventListener('click', () => {
    console.log('CLICKED')
  
    chrome.runtime.sendMessage({ action: 'generatePrompt'}, (response) => {
      if (response.error) {
        console.error('Error:', response.error);
      } else {
        const generatedText = response.generatedText;
        // Do something with the generated text
        
        document.getElementById('prompt-response').innerText(generatedText);
      }
    });
  });
});