/**
 * @author ps / @___paul
 */

'use strict';

import * as messages from './common/messages';

var view = require('./view')
  , viewmodel = require('./viewmodel')
  , helpers = require('./helpers')
  , polls = require('./polls');
const { permalink } = require('./view');

const Event = Object.freeze({
    SendUrl: 'permalink_url',
    UpdateTimeline: 'update_timeline',
});

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
    view.reloadScripts(pending);
  });
  view.loadEmbeds();
  view.checkPending();
  view.attachSlideshow();
  polls.checkExistingVotes();
};

var isOrderChanged = (order) => {
  const currentOrder = window.LB.settings.postOrder;
  return order !== currentOrder;
}

var buttons = {
  handlers: {
    "[data-load-more]": () => {
      let api_response = null;
      
      viewmodel.loadPostsPage({
        'tags': viewmodel.getSelectedTags()
      }).then((response) => {
          api_response = response;
          return view.renderPosts(api_response)
        })
        .then(view.displayNewPosts)
        .then(view.consent.init)
        .then(view.updateTimestamps)
        .then(() => {
          view.hideLoadMore(api_response._meta.total <= view.getItemsInView());
        })
        .catch(catchError);
    },

    "[data-js-sort_dropdown_button]": () => {
      view.toggleSortDropdown();
    },

    "[data-js-tags_filter_dropdown_button]": () => {
      view.toggleTagsFilterDropdown();
    },

    "[data-tags-filter-option]": (clickedElement) => {
      return () => {
        const tag = clickedElement.value,
          selectedTags = viewmodel.updateSelectedTags(tag);

        return viewmodel.loadPosts({
          notDeleted: true,
          tags: selectedTags
        }).then(view.renderTimeline)
          .then(view.displayNewPosts)
          .then(view.consent.init)
          .then(view.adsManager.refreshAds)
          .then(view.loadEmbeds)
          .catch(catchError);
      };
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
      return viewmodel.loadPosts({notDeleted: true})
        .then(view.renderTimeline)
        .then(view.displayNewPosts)
        .catch(catchError);
    },
    '[data-one-new-update]': showPendings,
    '[data-new-updates]': showPendings,
    '[data-counted-updates]': showPendings
  },

  attach: function() {
    Object.keys(buttons.handlers).forEach((handler) => {
      const elems = helpers.getElems(handler);

      if (handler === "[data-tags-filter-option]") {
        elems.forEach((el) => {
          el.addEventListener('click', buttons.handlers[handler](el), false);
        })
        return;
      }

      const el = elems[0]
      if (!el) {
        return false;
      }

      el.addEventListener('click', buttons.handlers[handler], false);
    });

    view.attachSlideshow();

    setTimeout(() => {
      adjustPermalinkStuff();
    }, 500);

    messages.listen(Event.SendUrl, (data) => {
      setTimeout(() => {
        adjustPermalinkStuff();
      }, 500);
    });
    
    messages.listen(Event.UpdateTimeline, (data) => {
      updateTimeline(data);
    });
  }
};

function updateTimeline(postId) {
  viewmodel.handleSharedPost(postId);
}

function adjustPermalinkStuff() {
  view.attachPermalink();
  view.attachShareBox();
  view.attachDropdownCloseEvent();

  if (!permalink._id) {
    permalink.parseHref();
  }
}

function loadSort(sortBy) {
  // fetch the data only if the sort order has changed
  if(!isOrderChanged(sortBy)) return Promise.resolve();
  sortBy = helpers.getSortBy(sortBy);
  
  return viewmodel.loadPosts({
    sort: sortBy,
    notDeleted: true,
    tags: viewmodel.getSelectedTags()
  }).then(view.renderTimeline)
    .then(view.displayNewPosts)
    .then(view.checkPending)
    .then(view.toggleSortBtn(sortBy))
    .then(view.consent.init)
    .then(view.adsManager.refreshAds)
    .then(view.loadEmbeds)
    .then(polls.checkExistingVotes)
    .then(() => {
      onYouTubeIframeAPIReady();
    })
    .catch(catchError);
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
