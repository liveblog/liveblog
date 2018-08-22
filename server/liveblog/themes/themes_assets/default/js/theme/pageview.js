'use strict';

/*
  Send pageview signal to analytics providers
  IVW and Google Analytics. Not to be tied to angular app.
*/

var sendPageview = {
  _foundProviders: [], // Cache after first lookup

  _sendIVW: function() {
    if (!window.iom) {
      return;
    }

    var iam_data = {
      "st": window._iframeDataset.szmSt, // ID
      "cp": window._iframeDataset.szmCp, // Code
      "co": window._iframeDataset.szmCo, // Comment
      "sv": "ke" // Disable Q&A invite
    };

    window.iom.c(iam_data, 1); // where's the .h? ahahaha
  },

  _sendGA: function() {
    if (window.gaAnalytics.length > 0) {
      window.gaAnalytics('create', window._iframeDataset.gaProperty, 'auto');
      window.gaAnalytics('set', 'anonymizeIp', true);
    }

    if (window.gaAnalytics.loaded) {
      // let's build a more meaningful url for ga analytics
      // and also append some utm parameters to make it even better
      var blog = window.LB.blog;
      var location = window.location.href;
      var blogTitle =  blog.title.replace(' ', '-');
      var campaignData = `utm_source=web&utm_medium=liveblog&utm_campaign=${blogTitle}`;
      var path = `/liveblog/blogs/${blog._id}/`;

      // now let's check if is possible to get document.referrer
      if ('referrer' in document) {
        var aTag = document.createElement('a');
        aTag.href = document.referrer;
        path = aTag.pathname;
        location = `${document.referrer}?${campaignData}`;
      }

      window.gaAnalytics('send', {
        hitType: 'pageview', path, location
      });
    }
  },

  _insertScript: function(src, cb) {
    // there are some situations where google analytics script could be already loaded
    // and set another name to the tracking function. So that we use our own custom name
    // to avoid this issue. In this case it's just gaAnalytics
    window.GoogleAnalyticsObject = "gaAnalytics";

    var script = document.createElement('script'); script.src = src;
    document.getElementsByTagName("body")[0].appendChild(script);
    script.addEventListener("load", cb);
  },

  _getProviders: function() {
    let foundProviders = [];

    if (this._foundProviders.length) {
      return this._foundProviders; // return early
    }

    for (var p in this._providers) {
      var provider = this._providers[p];
      var keysfound = provider.requiredData.reduce((prev, curr) =>
        window._iframeDataset.hasOwnProperty(curr)
      , true); // needs initial value for one element

      if (keysfound === true) { // all required attrs found
        if (!provider.object) {
          this._insertScript(provider.scriptURL, provider.send); // not yet loaded
        } else {
          foundProviders.push(provider.send); // list of _send funcs
        }
      }
    }

    this._foundProviders = foundProviders; // cache after initial
    return foundProviders;
  },

  send: function() { // public, invoke w/o params
    if (!window.hasOwnProperty('_iframeDataset')) {
      return; // return early
    }

    var providers = this._getProviders(); // is cached on first call

    for (var i = providers.length - 1; i >= 0; i--) {
      providers[i](); // _send function calls
    }
  },

  receiveMessage: function(e) {
    if (e.data.type === 'analytics') {
      var payload = JSON.parse(e.data.payload);

      window._iframeDataset = payload; // store dataset from parentNode
    }
  },

  init: function() {
    if (window.LB.settings.gaCode === '') {
      window.addEventListener('message', this.receiveMessage, false);
      window.addEventListener('sendpageview', this.send.bind(this), false);
    } else {
      window._iframeDataset = {gaProperty: window.LB.settings.gaCode};
      this.send = this.send.bind(this);
      this.send();
    }
  }
};

sendPageview._providers = {
  ivw: {
    send: sendPageview._sendIVW,
    requiredData: ['szmSt', 'szmCp', 'szmCo'],
    scriptURL: 'https://script.ioam.de/iam.js',
    object: window.hasOwnProperty('iom') ? window.iom : null
  },

  ga: {
    send: sendPageview._sendGA,
    requiredData: ['gaProperty'],
    scriptURL: 'https://www.google-analytics.com/analytics.js',
    object: window.hasOwnProperty('ga') ? window.ga : null
  }
};

module.exports = sendPageview;
