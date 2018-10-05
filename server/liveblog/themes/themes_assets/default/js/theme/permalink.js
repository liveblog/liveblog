class Permalink {
  constructor() {
    this.escapeRegExp = function (string) {
      return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1');
    };

    this.PARAM_NAME = 'liveblog._id', // the parameter name for permalink.  
    this.regexHash = new RegExp(this.escapeRegExp(this.PARAM_NAME) + '=([^&#]*)');

    // first of all, we make sure to have an url
    this.href = document.location.href;

    // then let's check if we're inside of an iframe
    if (window !== window.parent && "referrer" in document) {
      this.href = document.referrer;
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
