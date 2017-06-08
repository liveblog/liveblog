const templates = require('./templates');

class Slideshow {
  constructor() {
    this.start = this.start.bind(this);
    this.keyboardListener = this.keyboardListener.bind(this);
    this.setFocus = this.setFocus.bind(this);
    this.launchIntoFullscreen = this.launchIntoFullscreen.bind(this);
    this.exitFullscreen = this.exitFullscreen.bind(this);
    this.toggleFullscreen = this.toggleFullscreen.bind(this);
  }

  start(e) {
    let items = [];

    this.iterations = 0;
    this.isFullscreen = false;

    e.target
      .closest('article.slideshow')
      .querySelectorAll('.lb-item img')
      .forEach((img) => {
        let matches = [];

        img.getAttribute('srcset').replace(/(\S+)\s\d+w/g, (s, match) => {
          matches.push(match);
        });

        let [baseImage, thumbnail, viewImage] = matches;

        items.push({
          item: {
            meta: {media: {renditions: {
              baseImage: {href: baseImage},
              thumbnail: {href: thumbnail},
              viewImage: {href: viewImage}
            }}},
            active: thumbnail === e.target.getAttribute('src')
          }
        });
      });

    let slideshow = templates.slideshow({
      refs: items
    });


    document.querySelector('div.lb-timeline')
      .insertAdjacentHTML('afterend', slideshow);

    window.addEventListener('keydown', this.keyboardListener);
    window.parent.postMessage('fullscreen', window.document.referrer);

    this.setFocus();

    document
      .querySelector('#slideshow button.fullscreen')
      .addEventListener('click', this.toggleFullscreen);
  }

  toggleFullscreen() {
    console.log('toggle', this.isFullscreen);
    if (!this.isFullscreen) {
      this.launchIntoFullscreen(document.getElementById('slideshow'));
    } else {
      this.exitFullscreen();
    }
  }

  launchIntoFullscreen(element) {
    if (element.requestFullscreen) {
      element.requestFullscreen();
    } else if (element.mozRequestFullScreen) {
      element.mozRequestFullScreen();
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) {
      element.msRequestFullscreen();
    }

    this.isFullscreen = true;
  }

  exitFullscreen() {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }

    this.isFullscreen = false;
  }

  setFocus() {
    const container = document.querySelector('#slideshow .container');

    container.querySelectorAll('img').forEach((img, i) => {
      if (img.classList.contains('active')) {
        this.iterations = i;
      }
    });

    if (this.iterations > 0) {
      container.style.marginTop = `-${container.offsetHeight * this.iterations}px`;
    }
  }

  keyboardListener(e) {
    const container = document.querySelector('#slideshow .container');
    const picturesCount = container.querySelectorAll('img').length;
    let offset = container.offsetHeight * this.iterations;

    switch (e.keyCode) {
    case 39: // right
      if (offset + container.offsetHeight < picturesCount * container.offsetHeight) {
        container.style.marginTop = `-${offset + container.offsetHeight}px`;
        this.iterations++;
      }

      break;
    case 37: // left
      if (offset - container.offsetHeight >= 0) {
        container.style.marginTop = `-${offset - container.offsetHeight}px`;
        this.iterations--;
      }

      break;
    case 27: // esc
      this.exitFullscreen();
      document.querySelector('#slideshow').remove();
    }
  }
}

module.exports = Slideshow;
