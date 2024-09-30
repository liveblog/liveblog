'use strict';

import {Storage} from './common/storage';
const helpers = require('./helpers');

const POLLS_KEY = '__lb_polls_data__';
const POLLS_EXPIRY_DAYS = 365;

const apiHost = LB.api_host.match(/\/$/i) ? LB.api_host : LB.api_host + '/';
const blogId = LB.blog._id;

/**
 * Updates the UI with the new total votes and switches to the poll closed view
 */
function updatePollUI(selectedPoll) {
  const pollElem = document.getElementById(`poll-container-${selectedPoll}`);

  if (pollElem) {
    const postId = pollElem.closest('[data-post-id]').getAttribute('data-post-id');
    const postEndpoint = `${apiHost}api/client_posts/${postId}`;

    helpers.get(postEndpoint, true)
      .then((post) => {
        var view = require('./view');
        const rendered = view.renderSinglePost(post, false);
        
        if (!view.updatePost(post, rendered)) {
          console.warn("Failed to update post");
        }
      });
  }
}

/**
 * Checks if poll is already voted on by the user in another tab
 * Returns true if voted, false otherwise
 */
function hasVoted(selectedPoll) {
  const pollsData = Storage.read(POLLS_KEY) || {};
  const blogPolls = pollsData[blogId];
  
  if(blogPolls && blogPolls[selectedPoll]) {
    updatePollUI(selectedPoll);
    return true;
  }

  return false;
}

/**
 * Places a vote for a poll and updates the UI with the new total votes.
 * 
 * This function first checks if the user has already voted on the poll to 
 * prevent duplicate voting.
 * 
 * A retry mechanism is implemented to handle potential ETag mismatches 
 * This can occur if another client updates the poll between the time the 
 * client fetches the poll and the time it tries to send the update.
 */
function placeVote(event) {
  const { selectedOption, selectedPoll } = event.detail;
  const pollEndpoint = `${apiHost}api/client_polls/${selectedPoll}`;
  
  // Check if voting happened on another tab
  if (hasVoted(selectedPoll)) {
    alert("You have already voted on this poll.")
    return;
  }

  /**
   * Function to fetch the poll data, and send PATCH request to update poll
   * with selected option.
   */
  function updateVote() {
    return helpers.get(pollEndpoint, true)
      .then((poll) => {
        const etag = poll._etag;
        let data = { "poll_body": { "answers" : poll.poll_body.answers }};
        
        for (let answer of data.poll_body.answers) {
          if (answer.option === selectedOption) {
            answer.votes += 1;
            break; 
          }
        }
        
        return helpers.patch(pollEndpoint, data, etag, true);
      });
  }

  /**
   * Attempts to update the poll with the user's vote, with a retry mechanism
   * to handle potential ETag mismatches (HTTP 412 error).
   */
  function tryVote(retries = 3) {
    updateVote()
      .then((updatedPoll) => {
        updatePollUI(selectedPoll);
        persistVote(selectedPoll, selectedOption);
      })
      .catch((error) => {
        if (error.code === 412 && retries > 0) {
          console.log("ETag mismatch, retrying...", retries);
          tryVote(retries - 1);
        } else {
          console.log("Error occurred:", error);
        }
      });
  }

  tryVote();
}

/**
 * Persists the user's vote for a poll in local storage.
 */
function persistVote(selectedPoll, selectedOption) {
  let pollsData = Storage.read(POLLS_KEY) || {};

  pollsData[blogId] = {
    ...pollsData[blogId],
    [selectedPoll]: selectedOption,
  };

  Storage.write(POLLS_KEY, pollsData, POLLS_EXPIRY_DAYS);
}

/**
 * Checks for existing votes in local storage and updates the UI accordingly
 */
function checkExistingVotes() {
  const pollsData = Storage.read(POLLS_KEY) || {};
  const blogPolls = pollsData[blogId];

  if(blogPolls) {
    Object.entries(blogPolls).forEach(([pollId, selectedOption]) => {
      const pollOpenElem = document.getElementById(`poll-open-${pollId}`);
      const pollClosedElem = document.getElementById(`poll-closed-${pollId}`);
      const buttonElem = document.getElementById(`vote-button-${pollId}`);

      if (pollOpenElem && pollClosedElem && buttonElem) {
        pollOpenElem.style.display = "none";
        buttonElem.style.display = "none";
        pollClosedElem.style.display = "flex";
      } 
    });

    pollsData[blogId] = blogPolls;
    Storage.write(POLLS_KEY, pollsData, POLLS_EXPIRY_DAYS);
  }
}

module.exports = {
    init: () => {
        document.addEventListener('place_vote', function (e) {
            placeVote(e);
        });
        checkExistingVotes();
    },
    checkExistingVotes: checkExistingVotes,
};
