const UTILS = {
  sendMessage: async function (msg) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(msg, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    });
  },

  fetchAsync: async function (url) {
    try {
      const response = await fetch(chrome.runtime.getURL(url));
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();
      return text;
    } catch (error) {
      console.error("Error fetching URL:", error);
      throw error;
    }
  },

  createLinkElement: function (url, relValue) {
    const linkElement = document.createElement("link");
    linkElement.rel = relValue;
    linkElement.href = url;
    document.head.appendChild(linkElement);

    return linkElement;
  },

  injectFont: function () {
    const font1 = this.createLinkElement('https://fonts.googleapis.com', 'preconnect');
    const font2 = this.createLinkElement('https://fonts.gstatic.com', 'preconnect');
    const style = this.createLinkElement('https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,100;0,300;0,400;0,700;0,900;1,100;1,300;1,400;1,700;1,900&family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap', 'stylesheet');
  },

  checkInputValidity: function (text) {
    return !((text.split(/\s+/).length < 3) || !/\b(is|are|was|were|have|has|had|do|does|did|\w+ing)\b/i.test(text));
  }
}