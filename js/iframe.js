'use strict';

/*
  Resize parent iframe from postmessage
  received via iframe onload event containing the iframe height
*/

function receiveMessage(e) {
  if (parseInt(e.data.payload, 10) && e.data.type === "resize") { // if integer and msg type resize
    resizeIframeHeight(e.data.payload) // set timeline height to parent iframe size
  }
}

function resizeIframeHeight(h) { // T
  document.getElementsByClassName("lb-timeline")[0].style.height = (h - 250) + "px";
}

module.exports = function() {
  window.addEventListener("message", receiveMessage, false);
  //var parentHeight = parent.document.body.clientHeight
}