(function () {
  var textboxes = document.querySelectorAll('[role="textbox"][contentEditable="true"]');

  if (textboxes.length > 2) {
    var noteTitle = textboxes[textboxes.length - 2].innerText;
    var noteContents = textboxes[textboxes.length - 1].innerText;

    chrome.runtime.sendMessage({
        action: "scrooge-getNoteData",
        source: {
          title: noteTitle,
          contents: noteContents
        }
    });
  }
}());
