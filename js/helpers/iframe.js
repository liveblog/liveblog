'use strict';

/*
  Resize parent iframe from postmessage
  received via iframe onload event containing the iframe height
*/

function receiveMessage(e) {
  if (parseInt(e.data.payload, 10) && e.data.type === "resize") { // if integer and msg type resize
    resizeIframeHeight(e.data.payload) // set timeline height to parent iframe size
  }
};

function resizeIframeHeight(h) { // T
  document.getElementsByClassName("lb-timeline")[0].style.height = (h - 250) + "px";
};

function onElementHeightChange(elem, callback) {
  var lastHeight = elem.clientHeight, newHeight; // persist over calls

  (function run() {
    newHeight = elem.clientHeight;
    if (lastHeight != newHeight) callback(newHeight);
    lastHeight = newHeight;
    if (elem.onElemHeightChangeTimer) clearTimeout(elem.onElemHeightChangeTimer);
    elem.onElemHeightChangeTimer = setTimeout(run, 800);
  })();
};

module.exports = {
  registerMessageHandler: function() {
    window.addEventListener("message", receiveMessage, false);
  },

  adjustBody: function() {
    if (!!window.FRAME_HEIGHT && parseInt(window.FRAME_HEIGHT)) resizeIframeHeight(window.FRAME_HEIGHT);
  },

  sendHeight: function(h) {
    parent.postMessage({type: 'iframe', updatedHeight: h+300}, "*");
  },

  onElemHeightChange: onElementHeightChange
}