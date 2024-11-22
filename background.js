console.log('This is your service worker that runs in background.');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('This chrome ext powered by Vertex AI');

  if (request.action === 'generatePrompt') {
    let url = 'http://localhost:8888/vertex-ai/generate-prompt';
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }

    fetch(url, options)
    .then((res) => res.json())
    .then((data) => {
      console.log('Vertex AI response: ')
      console.log(data);

      sendResponse({data: data.promptResponse})
    }).catch((error) => {
      console.error(error);
      sendResponse({error: error});
    });

    return true;
  }
});


chrome.action.onClicked.addListener((tab) => {
  chrome.windows.create({
    url: "../popup/landing.html",
    type: "popup",
    width: 400,
    height: 600
  });
});