(function () {
  function handlePaste (e) {
    var clipboardData, pastedData;

    // Stop data actually being pasted into div
    e.stopPropagation();
    e.preventDefault();
    console.log(3, e);

    // Get pasted data via clipboard API
    clipboardData = e.clipboardData || window.clipboardData;
    console.log(clipboardData);
    pastedData = clipboardData.getData('Text');
    console.log(pastedData);

    e.clipboardData.setData('text/plain', 'Hello World!');

    // Do whatever with pasteddata
    // alert(pastedData);

    document.execCommand('insertText', false, 'HELLO!');
  }

  document.body.addEventListener('paste', handlePaste);

  console.log(document.body);
}());
