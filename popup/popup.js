$(document).ready(() => {
  $('#submit-prompt').click(() => {
    console.log('CLICKED');

    chrome.runtime.sendMessage({ action: 'generatePrompt' }, (response) => {
      if (response.error) {
        console.error('Error:', response.error);
      } else {
        const generatedText = response.data;
        const $reasonsDiv = $('#reasons');
        $('#prompt-response').show(); 

        const $ul = $('<ul>');
        generatedText.failed.forEach((item) => {
          $ul.append($('<li>').text(item.reason));
        });

        $reasonsDiv.empty().append($ul);
      }
    });
  });
});