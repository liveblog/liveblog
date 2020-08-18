import * as messages from './common/messages';

class Permalink {
  constructor() {
    this.escapeRegExp = function (string) {
      return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1');
    };

    this.PARAM_NAME = 'liveblog._id', // the parameter name for permalink.
    this.regexHash = new RegExp(this.escapeRegExp(this.PARAM_NAME) + '=([^&#]*)');

    this.href = null;

    // listen to embed.ts file when it sends parent window href
    messages.listen((type, data) => {
      if (type === 'permalink_url') {
        this.href = data;
      }
    });

    // then let's ask for the window href
    messages.send('permalink_init');

    // first of all, we make sure to have an url
    this.href = document.location.href;

    // if we are not in iframe (ESI approach) then let's use own's document href
    if (window === window.parent) {
      this.href = document.location.href;
    }

    var matches = this.href.match(this.regexHash);

    if (matches) {
      var arr = decodeURIComponent(matches[1]).split('__');
      this._id = arr[0];
      if (LB.settings.postOrder !== arr[1]) {
        LB.settings.postOrder = arr[1];
        this._changedSort = true;
      }
    }
  }

  getUrl(id) {
    var permalink = false,
      DELIMITER = LB.settings.permalinkDelimiter || '?', // delimiter can be `?` or `#`.
      newHash = this.PARAM_NAME + '=' + id + '__' + LB.settings.postOrder;

    if (this.href.indexOf(DELIMITER) === -1) {
      permalink = this.href + DELIMITER + newHash;
    } else if (this.href.indexOf(this.PARAM_NAME + '=') !== -1) {
      permalink = this.href.replace(this.regexHash, newHash);
    } else {
      permalink = this.href + '&' + newHash;
    }

    return permalink;
  }
}

module.exports = Permalink;
