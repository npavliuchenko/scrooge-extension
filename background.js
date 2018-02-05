//@TODO: scope this

/**
 * checkst that current tab is Google Keep
 * & injects grabber script to get title and body from current open note
 *
 * tab - current Chrome tab (Tab)
 */
function injectDataGrabber(tab) {
  const urlToMatch = /https:\/\/keep.google.com\/u\/0\/#NOTE\/(\d\.)*/;

  if (urlToMatch.test(tab.url)) {
    chrome.tabs.executeScript(tab.id, {
      file: 'content-grabber.js'
    });
  } else {
    alert('Wrong page to grab data!');
  }
}

/**
 * converts note text to sheet-formatted array
 *
 * rawTitle - note title (String)
 * rawData - note body (String)
 *
 * result - Array of Arrays of Strings:
 * [ [date, summ, currency, source, description, category, shop] ]
 */
function convertData(rawTitle, rawData) {
  const regexDate = /^\d{1,2}$/;
  const regexPurchase = /^((\d*\.?\d+)\s+)?(([c|к|$|i|і|и|х|h]?)\s+)?(\(([a-zа-я\.]+)\)\s+)?([a-zа-я, \+\-\(\)]+)$/i;
  const rows = rawData.split("\n");
  const result = [];

  const dateNow = new Date();
  const dateMonth = _findInList(MONTH_CONVERTER, rawTitle.trim().toLowerCase()) || '--'; // month to use in output
  const deltaYear = dateNow.getMonth() + 1 - dateMonth < 0 ? 1 : 0; // take previous year if the month seems to be in future
  const dateYear = dateNow.getFullYear() - deltaYear; // year to use in output
  let dateDay = 1; // let's start from beginning
  let firstPurchaseOnDate = true; // don't print the date for all purchases, only 1 per day

  for (let i = 0; i < rows.length; i++) { // now process each row of the text grabbed
    let row = rows[i].trim();

    if (row) { // ignore empty rows
      let dateMatch = row.match(regexDate);

      if (dateMatch) { // save date
        dateDay = dateMatch[0];
        firstPurchaseOnDate = true;
        result.push();
      } else { // else it is purchase
        let purchaseMatch = row.match(regexPurchase);
        // console.log(purchaseMatch, row);

        if (purchaseMatch) {
          result.push([
            firstPurchaseOnDate ? dateDay + '.' + dateMonth + '.' + dateYear : '',
            purchaseMatch[2] ? purchaseMatch[2].replace('.', ',') : '', // summ
            '', // currency
            purchaseMatch[4] ? _findInList(SOURCE_BY_CODE, purchaseMatch[4].toLowerCase()) : '', // source
            purchaseMatch[7] || '', // description
            _predictCategory(purchaseMatch[7], purchaseMatch[6]),
            purchaseMatch[6] ? purchaseMatch[6].toLowerCase() : '', // shop
          ]);
        } else { // if we can't translate it automatically, leave it to user
          result.push([
            firstPurchaseOnDate ? dateDay + '.' + dateMonth + '.' + dateYear : '',
            '', // currency
            '', // summ
            '', // source
            row,
            _predictCategory(row),
            '', // shop
          ]);
        }

        firstPurchaseOnDate = false;
        // result[result.length - 1] = result[result.length - 1].join("\t");
      }
    }
  }

  // textarea2.innerText = result.join("\n");
  return result;
}

/**
 * Find key by content in hash
 *
 * list - list to search in (Object)
 *
 * result - string
 */
function _findInList(list, needle) {
  for (let key in list) {
    if (list[key].indexOf(needle) !== -1) return key;
  }

  return '';
}

/**
 * predicts category by purchase data
 *
 * description - purchase description (String)
 * shop - purchase shop (String)
 *
 * result - string
 */
function _predictCategory(description, shop) {
  let key = null;

  if (shop) { // the most of known shops have 1 category of goods
    key = _findInList(CATEGORY_BY_SHOP, shop);
  }

  if (!key) { // if that didn't help, try to analyse purchase description
    // get separate words from description (that are usually things purchased)
    const keywordMatch = description.match(/([a-zа-я\-]+)/gi);
    // console.log(keywordMatch);

    // and use them as keywords to search for the categories they belong to
    if (keywordMatch) {
      for (let i = 0; i < keywordMatch.length; i++) {
        key = key || _findInList(CATEGORY_BY_KEYWORD, keywordMatch[i]);
      }
    }
  }
  // console.log('result: ' + key);

  return key ? CATEGORY[key] : '';
}


// inject grabber on extension icon click
chrome.browserAction.onClicked.addListener(injectDataGrabber);

// wait for data to be grabbed and convert it
chrome.runtime.onMessage.addListener(function(request, sender) {
  request.action === 'scrooge-getNoteData'
    && copyData(convertData(request.source.title, request.source.contents));
});

/**
 * formats data to the GoogleSheet-compatible
 * & copies it to the clipboard
 *
 * data - converted data (Array of Arrays of String)
 */
function copyData(data) {
  const clip = document.createElement('textarea');
  const result = data.map(function(row) {
      return row.join("\t");
    }).join("\r\n");

  function listener(e) {
    // e.clipboardData.setData("text/html", result);
    e.clipboardData.setData("text/plain", result);
    e.preventDefault();
  }




  // document.body.appendChild(clip);

  // clip.innerText = result;
  // clip.select();

  try {
    document.addEventListener("copy", listener);
    document.execCommand("copy");
    document.removeEventListener("copy", listener);
    // document.execCommand('copy');
    // console.log(clip);
    // console.log(clip.innerHtml);
    // console.log(clip.innerText);
    // clip.blur();
    alert('Take here:' + "\n\n" + result);
  }
  catch (err) {
    alert('Error while copying to clipboard. Take here:' + "\n\n" + result);
  }

  // document.body.removeChild(clip);
}
