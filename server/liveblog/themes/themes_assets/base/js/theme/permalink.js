class Permalink {
  constructor() {
    this.escapeRegExp = function (string) {
      return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1');
    };

    this.PARAM_NAME = 'liveblog._id', // the parameter name for permalink.  
    this.regexHash = new RegExp(this.escapeRegExp(this.PARAM_NAME) + '=([^&#]*)');

    if (document.parent) {
      // use document parent if avalible, see iframe cors limitation.
      try {
        this.href = document.location.href; 
      } catch (e) {
        // if not use the referrer of the iframe.
        this.href = document.referrer; 
      }
    } else {                
      this.href = document.location.href; // use this option if it is access directly not via iframe.
    }

    var matches = this.href.match(this.regexHash);
        
    if (matches) {
      var arr = decodeURIComponent(matches[1]).split('->');
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
      newHash = this.PARAM_NAME + '=' + id + '->' + LB.settings.postOrder;

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
