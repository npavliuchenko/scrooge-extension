document.addEventListener('DOMContentLoaded', function() {
  var statusBar = document.getElementById('statusBar');
  var grabButton = document.getElementById('grab');
  var convertButton = document.getElementById('convert');
  convertButton.disabled = true;

  var rawTextarea = document.getElementById('rawResult');

  function showErrorMessage(msg) {
    statusBar.innerHTML = msg;
    statusBar.setAttribute('class', 'error');
    statusBar.style.color = 'red';
  }

  function showSuccessMessage(msg) {
    statusBar.innerHTML = msg;
    statusBar.setAttribute('class', 'success');
    statusBar.style.color = 'green';
  }

  function grabRawData() {
    console.log('grabbed');

    chrome.tabs.query({
      active: true,
      status: 'complete'
    }, function(tabs) {
      // check page url

      const urlToMatch = /https:\/\/keep.google.com\/u\/0\/#NOTE\/(\d\.)*/
      if (urlToMatch.test(tabs[0].url)) {

        chrome.runtime.onMessage.addListener(function(request, sender) {
          if (request.action == 'scrooge-getNoteData') {
            rawTextarea.innerText = request.source.title + "\n" + request.source.contents;
          }
        });

        chrome.tabs.executeScript({
          file: 'content-grabber.js'
        }, function() {
          convertButton.disabled = false;
          // chrome.browserAction.setIcon({path: icon});

          if (chrome.runtime.lastError) {
            showErrorMessage('Error while injecting: \n' + chrome.runtime.lastError.message);
          }
        });
      } else {
        showErrorMessage('wrong page');
      }
      // check note structure

      // grab month
      // grab contents

      // put into the textarea
    });
  }

  grabButton.addEventListener('click', grabRawData);

  convertButton.addEventListener('click', function() {
    console.log('converted');

    //
  });

});
