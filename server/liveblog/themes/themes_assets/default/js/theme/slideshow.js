const lory = require('lory.js').lory;
const imagesLoaded = require('imagesloaded');


class Slideshows {
  constructor() {
    this.slideshows = [];
  }

  init() {
    this.slideshows.forEach((inst) => {
      inst.destroy();
    });

    this.slideshows = [];

    Array.prototype.slice.call(document.querySelectorAll('.lb-slideshow')).forEach((element, index) => {
      new imagesLoaded(element, () => {
        const inst = this.wirePlugin(element);
        this.slideshows.push(inst);
      });
    });
  }

  wirePlugin(element) {
    let inst = lory(element, {
      classNameFrame: 'lb-slideshow_frame',
      classNameSlideContainer: 'lb-slideshow_slides',
      classNamePrevCtrl: 'lb-slideshow_prev',
      classNameNextCtrl: 'lb-slideshow_next',
      rewind: true
    });

    return inst;
  }
}

const Slideshow = (() => {
  let instance;

  const createInstance = () => {
    const object = new Slideshows();

    return object;
  };

  return {
    getInstance: () => {
      if (!instance) {
        instance = createInstance();
      }
      return instance;
    }
  };
})();

module.exports = Slideshow;
