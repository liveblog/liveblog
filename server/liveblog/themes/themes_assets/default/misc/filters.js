/**
 * Simple template filter to convert some html tags
 * into AMP compatible ones
 * @param  {string} html content that contains the unparsed tags
 * @return {string}      Sanitized html string compatible to amp standards
 */

const ampifyFilter = (html) => {

  if (html.search(/<\S*iframe/i) > 0) {
    // html contains iframe
    const src = (/src=\"([^\"]+)\"/).exec(html)[1];
    var width = (/width=\"([^\"]+)\"/).exec(html)[1];
    var height = (/height=\"([^\"]+)\"/).exec(html)[1];

    if (!width || width.search("%") >= 0) {
      width = '350';
    }

    if (!height) {
      height = '350';
    }

    return `
      <amp-iframe
          width=${width}
          height=${height}
          layout="responsive"
          frameborder="0"
          sandbox="allow-scripts
          allow-same-origin allow-popups"
          src="${src}">
              <p placeholder>Loading...</p>
      </amp-iframe>`;
  }

  // brightcove url recognition
  if (html.search(/players\.brightcove\.net\/\d*\/[a-z0-9\-]*_\w*\/index\.html\?videoId/i) > 0) {
    let account, playerEmbed, player, embed, videoId = '';

    account = (/net\/(\d*)\//).exec(html)[1];
    playerEmbed = (/\w*(-[a-zA-Z0-9]+)*_\w*/i).exec(html)[0];
    playerEmbed = playerEmbed.split('_');
    player = playerEmbed[0];
    embed = playerEmbed[1];
    videoId = (/videoId=(\S*)/i).exec(html)[1];

    return `
      <amp-brightcove
      data-account="${account}"
      data-player="${player}"
      data-embed="${embed}"
      data-video-id="${videoId}"
      layout="responsive"
      width="480" height="270">
      </amp-brightcove>`;
  }

  // brightcove in-page embed recognition
  if (html.search(/players\.brightcove\.net\/\d*\/[a-z0-9\-]*_\w*\/index\.min\.js/i) > 0) {
    let account, playerEmbed, player, embed, videoId = '';

    account = (/data-account="(\d*)"/).exec(html)[1];
    player = (/data-player="([a-zA-Z0-9-]*)"/i).exec(html)[1];
    embed = (/data-embed="([a-zA-Z0-9-]*)"/i).exec(html)[1];
    videoId = (/data-video-id="(\d*)"/i).exec(html)[1];

    return `
      <amp-brightcove
      data-account="${account}"
      data-player="${player}"
      data-embed="${embed}"
      data-video-id="${videoId}"
      layout="responsive"
      width="480" height="270">
      </amp-brightcove>`;
  }

  return html;
};

/**
 * Dummy filter to extract the year from a given date and adds 10 years to extracted year
 * @param  {string} date String date
 * @return {int}
 */
var addtenFilter = function(date) {
  var year = date.substring(0, 4);
  var rest = date.substring(4);
  var newYear = parseInt(year) + 10;
  return newYear + rest;
};

module.exports = { ampifyFilter, addtenFilter };
