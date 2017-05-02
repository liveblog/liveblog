/**
 * @author ps / @___paul
 */

'use strict';

var view = require('./view')
  , viewmodel = require('./viewmodel')
  , helpers = require('./helpers');

/**
 * Contains a mapping of element data-selectors and click handlers
 * buttons.attach {function} - registers handlers found in handlers object
 */

const sendComment = (e) => {
  e.preventDefault();

  let name = document.querySelector('#comment-name').value;
  let comment = document.querySelector('#comment-content').value;

  view.clearCommentFormErrors();

  return viewmodel.sendComment(name, comment)
    .then(view.toggleCommentDialog)
    .then(() => document
        .querySelector('form.comment')
        .removeEventListener('submit', sendComment)
    )
    .then(view.showSuccessCommentMsg)
    .catch(view.displayCommentFormErrors);
};

var buttons = {
  handlers: {
    "[data-js-loadmore]": () => {
      viewmodel.loadPostsPage()
        .then(view.renderPosts)
        .then(view.displayNewPosts)
        .catch(catchError);
    },

    "[data-js-orderby_ascending]": () => {
      viewmodel.loadPosts({sort: 'ascending'})
        .then(view.renderTimeline)
        .then(view.displayNewPosts)
        .then(view.toggleSortBtn('ascending'))
        .catch(catchError);
    },

    "[data-js-orderby_descending]": () => {
      viewmodel.loadPosts({sort: 'descending'})
        .then(view.renderTimeline)
        .then(view.displayNewPosts)
        .then(view.toggleSortBtn('descending'))
        .catch(catchError);
    },

    "[data-js-show-comment-dialog]": () => {
      let isVisible = view.toggleCommentDialog();
      let commentForm = document.querySelector('form.comment');

      if (isVisible) {
        commentForm.addEventListener('submit', sendComment);
      } else {
        commentForm.removeEventListener('submit', sendComment);
      }
    }
  },

  attach: function() {
    for (var handler in buttons.handlers) {
      var el = helpers.getElems(handler)[0];

      if (!el) {
        return false;
      }

      el.addEventListener('click', buttons.handlers[handler], false);
    }
  }
};

function catchError(err) {
  console.error("Handler error: ", err);
}

var events = {
  attach: function() {} // todo
};

module.exports = {
  buttons: buttons,
  events: events
};
