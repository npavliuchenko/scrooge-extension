document.addEventListener('DOMContentLoaded', function() {
  var statusBar = document.getElementById('statusBar');
  var grabButton = document.getElementById('grab');
  var convertButton = document.getElementById('convert');
  convertButton.disabled = true;

  var textarea1 = document.getElementById('rawResult');
  var textarea2 = document.getElementById('convertedResult');

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

  function convertData(rawTitle, rawData) {
    textarea1.innerText = rawTitle + "\n" + rawData;

    const regexDate = /^\d{1,2}$/;
    // const regexPurchase = /^((\d+\.?\d+)\s*)?(([c|к|$|i|х|h]?)\s*)?(\(([a-zа-я\.]+)\))?\s*([a-zа-я, \+\-\(\)]+)$/i;
    const regexPurchase = /^((\d*\.?\d+)\s+)?(([c|к|$|i|і|и|х|h]?)\s+)?(\(([a-zа-я\.]+)\)\s+)?([a-zа-я, \+\-\(\)]+)$/i;
    // const regexPurchase = /^(a-z)*$/;

    var dateMonth = findInList(MONTH_CONVERTER, rawTitle.trim().toLowerCase()) || '--';
    var dateNow = new Date();
    var deltaYear = dateNow.getMonth() + 1 - dateMonth < 0 ? 1 : 0;
    var dateYear = dateNow.getFullYear() - deltaYear;
    var dateDay = 1;
    var firstPurchaseOnDate = true;

    var rows = rawData.split("\n");
    var result = [];

    for (var i = 0; i < rows.length; i++) {
      var row = rows[i].trim();

      if (row) {
        var dateMatch = row.match(regexDate);

        if (dateMatch) {
          dateDay = dateMatch[0];
          firstPurchaseOnDate = true;
          result.push();
        } else {
          var purchaseMatch = row.match(regexPurchase);
          console.log(purchaseMatch, row);

          if (purchaseMatch) {
            result.push([
              firstPurchaseOnDate ? dateDay + '.' + dateMonth + '.' + dateYear : '',
              purchaseMatch[2] ? purchaseMatch[2].replace('.', ',') : '', // summ
              '', // currency
              purchaseMatch[4] ? findInList(SOURCE_BY_CODE, purchaseMatch[4].toLowerCase()) : '', // source
              purchaseMatch[7] || '', // description
              predictCategory(purchaseMatch[7], purchaseMatch[6]),
              purchaseMatch[6] ? purchaseMatch[6].toLowerCase() : '', // shop
            ]);
          } else {
            result.push([
              firstPurchaseOnDate ? dateDay + '.' + dateMonth + '.' + dateYear : '',
              '', // currency
              '', // summ
              '', // source
              row,
              predictCategory(row),
              '', // shop
            ]);
          }

          firstPurchaseOnDate = false;
          result[result.length - 1] = result[result.length - 1].join("\t");
        }
      }
    }

    textarea2.innerText = result.join("\n");
  }

  function findInList(list, keyword) {
    for (key in list) {
      if (list[key].indexOf(keyword) !== -1) return key;
    }

    return '';
  }

  function predictCategory(description, shop) {
    var key = null;

    if (shop) {
      key = findInList(CATEGORY_BY_SHOP, shop);
    }

    if (!key) {
      var keywordMatch = description.match(/([a-zа-я\-]+)/gi);
      console.log(keywordMatch);

      if (keywordMatch) {
        for (var i = 0; i < keywordMatch.length; i++) {
          key = key || findInList(CATEGORY_BY_KEYWORD, keywordMatch[i]);
        }
      }
    }

    console.log('result: ' + key);

    return key ? CATEGORY[key] : '';
  }

  grabButton.addEventListener('click', grabRawData);

  chrome.runtime.onMessage.addListener(function(request, sender) {
    request.action === 'scrooge-getNoteData'
      && convertData(request.source.title, request.source.contents);
  });

  // function copyTextToClipboard(text) {
  //   var copyFrom = document.createElement("textarea");
  //   copyFrom.textContent = text;
  //   var body = document.getElementsByTagName('body')[0];
  //   body.appendChild(copyFrom);
  //   copyFrom.select();
  //   document.execCommand('copy');
  //   body.removeChild(copyFrom);
  // }

});
