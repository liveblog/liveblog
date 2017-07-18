const templates = require('./templates');

class Slideshow {
  constructor() {
    this.start = this.start.bind(this);
    this.stop = this.stop.bind(this);
    this.keyboardListener = this.keyboardListener.bind(this);
    this.setFocus = this.setFocus.bind(this);
    this.launchIntoFullscreen = this.launchIntoFullscreen.bind(this);
    this.onResize = this.onResize.bind(this);
    this.exitFullscreen = this.exitFullscreen.bind(this);
    this.toggleFullscreen = this.toggleFullscreen.bind(this);
    this.addEventListeners = this.addEventListeners.bind(this);
    this.removeEventListeners = this.removeEventListeners.bind(this);
    this.touchStart = this.touchStart.bind(this);
    this.touchMove = this.touchMove.bind(this);
  }

  start(e) {
    let items = [];

    this.iterations = 0;
    this.isFullscreen = false;
    this.xDown = null;
    this.yDown = null;

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
            meta: {
              media: {renditions: {
                baseImage: {href: baseImage},
                thumbnail: {href: thumbnail},
                viewImage: {href: viewImage}
              }},
              caption: img.parentNode.querySelector('span.caption').textContent,
              credit: img.parentNode.querySelector('span.credit').textContent,
            },
            active: thumbnail === e.target.getAttribute('src')
          }
        });
      });

    let slideshow = templates.slideshow({
      refs: items
    });

    document.querySelector('div.lb-timeline')
      .insertAdjacentHTML('afterend', slideshow);

    if (window.self !== window.top) {
      window.parent.postMessage('fullscreen', window.document.referrer);
    }

    this.setFocus();
    this.addEventListeners();
  }

  stop() {
    this.exitFullscreen();
    this.removeEventListeners();
    document.querySelector('#slideshow').remove();
  }

  onResize() {
    const container = document.querySelector('#slideshow .container');
    let offset = container.offsetHeight * this.iterations;

    container.style.marginTop = `-${offset}px`;
  }

  addEventListeners() {
    window.addEventListener('keydown', this.keyboardListener);

    document
      .querySelector('#slideshow button.fullscreen')
      .addEventListener('click', this.toggleFullscreen);

    document
      .querySelector('#slideshow button.arrows.next')
      .addEventListener('click', () => this.keyboardListener({keyCode: 39}));

    document
      .querySelector('#slideshow button.arrows.prev')
      .addEventListener('click', () => this.keyboardListener({keyCode: 37}));

    document
      .querySelector('#slideshow button.close')
      .addEventListener('click', this.stop);

    document
      .querySelector('#slideshow')
      .addEventListener('touchstart', this.touchStart);

    document
      .querySelector('#slideshow')
      .addEventListener('touchmove', this.touchMove);

    window.addEventListener('resize', this.onResize);
  }

  removeEventListeners() {
    window.removeEventListener('keydown', this.keyboardListener);

    document
      .querySelector('#slideshow button.fullscreen')
      .removeEventListener('click', this.toggleFullscreen);

    document
      .querySelector('#slideshow button.arrows.next')
      .removeEventListener('click', () => this.keyboardListener({keyCode: 39}));

    document
      .querySelector('#slideshow button.arrows.prev')
      .removeEventListener('click', () => this.keyboardListener({keyCode: 37}));

    document
      .querySelector('#slideshow button.close')
      .removeEventListener('click', this.stop);

    document
      .querySelector('#slideshow')
      .removeEventListener('touchstart', this.touchStart);

    document
      .querySelector('#slideshow')
      .removeEventListener('touchmove', this.touchMove);

    window.removeEventListener('resize', this.onResize);
  }

  touchStart(e) {
    this.xDown = e.touches[0].clientX;
    this.yDown = e.touches[0].clientY;
  }

  touchMove(e) {
    if (!this.xDown || !this.yDown) {
      return;
    }

    var xUp = e.touches[0].clientX;
    var yUp = e.touches[0].clientY;

    var xDiff = this.xDown - xUp;
    var yDiff = this.yDown - yUp;

    if (Math.abs(xDiff) > Math.abs(yDiff) && xDiff > 0) {
      // Left swipe
      this.keyboardListener({keyCode: 39});
    } else {
      // Right swipe
      this.keyboardListener({keyCode: 37});
    }

    this.xDown = null;
    this.yDown = null;
  }

  toggleFullscreen() {
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
      this.stop();
    }
  }
}

module.exports = Slideshow;
