const lory = require('lory.js').lory;

class Slideshow {
  init() {
    Array.prototype.slice.call(document.querySelectorAll('.lb-slideshow')).forEach((element, index) => {
      lory(element, {
        classNameFrame: 'lb-slideshow_frame',
        classNameSlideContainer: 'lb-slideshow_slides',
        classNamePrevCtrl: 'lb-slideshow_prev',
        classNameNextCtrl: 'lb-slideshow_next',
        rewind: true
      });
    });     
  }
}

module.exports = Slideshow;
