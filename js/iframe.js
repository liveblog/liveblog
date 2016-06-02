'use strict';

/*
  Resize parent iframe from postmessage
  received via iframe onload event containing the iframe height
*/

function receiveMessage(e) {
  var d = e.data; // height in px  
  var m = e.data.split(':'); // should be type:data
  var h = m[1]; // height 
  
  if (!m.length===2) return; // wrong event
  if (parseInt(h, 10) && m[0] === "resize") { // if integer and msg type resize
    resizeIframeHeight(h) // set timeline height to parent iframe size
  }
}

function resizeIframeHeight(h) { // T
  document.getElementsByClassName("lb-timeline")[0].style.height = (h - 250) + "px";
}

module.exports = function() {
  window.addEventListener("message", receiveMessage, false);
  //var parentHeight = parent.document.body.clientHeight
}