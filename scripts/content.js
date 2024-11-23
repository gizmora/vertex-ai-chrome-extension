// $(document).ready(() => {
//   console.log('This is your content script.');

//   chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//     if (request.action === 'toggleSidebar') {
//       toggleSidebar();
//     }
//   });
    
//   // Your showSidebar and hideSidebar functions
//   function toggleSidebar() {
//     if ($('#chr-sidebar').length) {
//       $('#chr-sidebar').toggle();
//     } else {
//       const sidebar = $('<div>').attr('id', 'chr-sidebar');
//       fetch(chrome.runtime.getURL('../popup/landing.html')) // Replace 'sidebar.html' with the actual path
//         .then(response => response.text())
//         .then(page => {
//           sidebar.html(page);

//           // Add the sidebar to the page
//           sidebar.append(
//             $('<link>').attr({ rel: 'stylesheet', href: chrome.runtime.getURL('popup/styles.css') })
//           );

//           injectScript('https://code.jquery.com/jquery-3.7.1.min.js', sidebar[0]);
//           injectScript(chrome.runtime.getURL('popup/popup.js'), sidebar[0]);

//           $('body').append(sidebar);
//         }).catch(error => {
//           console.error('Error loading sidebar:', error);
//         });;
//     }
//   }

//   function injectScript(src, container) {
//     const script = document.createElement('script');
//     script.setAttribute('src', src);
//     container.appendChild(script);
//   }
// });

(function() {
  // Create the sidebar iframe
  var sidebar = document.createElement('iframe');
  sidebar.src = chrome.runtime.getURL('popup/landing.html'); // URL of the sidebar HTML
  sidebar.style.position = 'fixed';
  sidebar.style.top = '0';
  sidebar.style.right = '0';
  sidebar.style.width = '300px';
  sidebar.style.height = '100%';
  sidebar.style.border = 'none';
  sidebar.style.zIndex = '10000';

  document.body.appendChild(sidebar);

  // Ensure that jQuery is injected into the iframe once it's loaded
  sidebar.onload = function() {
    console.log('AHDSAHAHAHAHHAA')
    var iframeDocument = sidebar.contentDocument || sidebar.contentWindow.document;
    
    if (iframeDocument) {
      // Inject jQuery into the iframe
      var script = document.createElement('script');
      script.src = 'https://code.jquery.com/jquery-3.7.1.min.js'; // Load jQuery from CDN
      script.onload = function() {
        injectSidebarContent(sidebar.contentWindow); // Inject custom sidebar content once jQuery is loaded
      };
      iframeDocument.head.appendChild(script);
    } else {
      console.error('Iframe document is not accessible!');
    }
  };

  function injectSidebarContent(iframeWindow) {
    // Inject custom content into the sidebar using jQuery
    const $ = iframeWindow.jQuery;
    $(iframeWindow.document).ready(function() {
      $('#sidebar-data').html('<p>Hello from jQuery in iframe!</p>');
      $('h2').click(function() {
        alert("Sidebar Header clicked!");
      });
    });
  }
})();
