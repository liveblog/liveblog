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
    .then(view.clearCommentDialog)
    .then(view.toggleCommentDialog)
    .then(() => document
        .querySelector('form.comment')
        .removeEventListener('submit', sendComment)
    )
    .then(view.showSuccessCommentMsg)
    .catch(view.displayCommentFormErrors);
};

var showPendings = (e) => {
  let pendings = document.querySelectorAll('[data-post-id].mod--displaynone');
  pendings.forEach((pending) => {
    pending.classList.toggle('mod--displaynone', false);
  });
  view.checkPending();
  view.attachSlideshow();
};

var buttons = {
  handlers: {
    "[data-load-more]": () => {
      viewmodel.loadPostsPage()
        .then(view.renderPosts)
        .then(view.displayNewPosts)
        .catch(catchError);
    },
    
    "[data-js-sort_dropdown_button]": () => {
      view.toggleSortDropdown();
    },

    "[data-js-orderby_ascending]": () => {
      loadSort('ascending');
    },

    "[data-js-orderby_descending]": () => {
      loadSort('descending');
    },

    "[data-js-orderby_editorial]": () => {
      loadSort('editorial');
    },

    "[data-js-show-comment-dialog]": () => {
      let isVisible = view.toggleCommentDialog();
      let commentForm = document.querySelector('form.comment');

      if (isVisible) {
        commentForm.addEventListener('submit', sendComment);
      } else {
        commentForm.removeEventListener('submit', sendComment);
      }
    },

    '[data-js-close-comment-dialog]': (e) => {
      e.preventDefault();
      view.toggleCommentDialog();
    },

    '[data-js-show-highlighted]': () => {
      let highlightButton = document.querySelector('.header-bar__highlight');

      highlightButton.classList.toggle('header-bar__highlight--active');
      LB.settings.onlyHighlighted = !LB.settings.onlyHighlighted;
      return viewmodel.loadPosts()
        .then(view.renderTimeline)
        .then(view.displayNewPosts)
        .catch(catchError);
    },
    '[data-one-new-update]': showPendings,
    '[data-new-updates]': showPendings
  },

  attach: function() {
    Object.keys(buttons.handlers).forEach((handler) => {
      let el = helpers.getElems(handler)[0];

      if (!el) {
        return false;
      }

      el.addEventListener('click', buttons.handlers[handler], false);
    });

    view.attachSlideshow();
    view.attachPermalink();
    view.attachShareBox();
    if (view.permalink._changedSort) {
      loadSort(LB.settings.postOrder)
        .then(checkForScroll);
    } else {
      checkForScroll();
    }
  }
};

function loadSort(sortBy) {
  // initialy on server sort params are set as newest_first, oldest_first
  // on client we dont use this, so this is temp fix
  switch (sortBy) {
  case 'oldest_first':
  case 'ascending':
    sortBy = 'ascending';
    break;
  case 'newest_first':
  case 'descending':
    sortBy = 'descending';
    break;
  default:
    sortBy = 'editorial';
  }

  return viewmodel.loadPosts({sort: sortBy, notDeleted: true})
    .then(view.renderTimeline)
    .then(view.displayNewPosts)
    .then(view.toggleSortBtn(sortBy))
    .catch(catchError);
}

function checkForScroll() {
  viewmodel.getAllPosts()
    .then((posts) => {
      if (view.checkPermalink(posts)) {
        loadForScroll();
      }
    });
}

function loadForScroll() {
  if (!view.permalinkScroll()) {
    viewmodel.loadPostsPage()
      .then(view.renderPosts)
      .then(view.displayNewPosts)
      .then(loadForScroll)
      .catch(catchError);
  }
}

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
