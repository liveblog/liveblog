/**
 * @author ps / @___paul
 */

'use strict';

const nunjucks = require("nunjucks/browser/nunjucks-slim");
const settings = window.LB.settings;

const defaultTemplates = {
  post: require("../../templates/template-post.html"),
  timeline: require("../../templates/template-timeline.html"),
  postComment: require("../../templates/template-post-comment.html"),
  itemImage: require("../../templates/template-item-image.html"),
  itemGalleryImage: require("../../templates/template-item-galleryImage.html"),
  itemEmbed: require("../../templates/template-item-embed.html"),
  itemQuote: require("../../templates/template-item-quote.html"),
  itemComment: require("../../templates/template-item-comment.html")
};

function getCustomTemplates() {
  let customTemplates = settings.customTemplates
    , mergedTemplates = defaultTemplates;

  for (let template in customTemplates) {
    let customTemplateName = customTemplates[template];
    defaultTemplates[template] = (ctx, cb) => {
      nunjucks.render(customTemplateName, ctx, cb);
    };
  }

  return mergedTemplates;
}

module.exports = settings.customTemplates
  ? getCustomTemplates()
  : defaultTemplates;
