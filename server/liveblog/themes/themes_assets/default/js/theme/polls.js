'use strict';

import {Storage} from './common/storage';
var helpers = require('./helpers');

const POLLS_KEY = '__lb_polls_data__';
const POLLS_EXPIRY_DAYS = 365;

const apiHost = LB.api_host.match(/\/$/i) ? LB.api_host : LB.api_host + '/';
const blogId = LB.blog._id;

/**
 * Updates the UI with the new total votes and switches to the poll closed view
 */
function updatePollUI(totalVotes, selectedPoll) {
  const totalVotesElem = document.getElementById(`total-votes-${selectedPoll}`);
  const pollOpenElem = document.getElementById(`poll-open-${selectedPoll}`);
  const pollClosedElem = document.getElementById(`poll-closed-${selectedPoll}`);
  const buttonElem = document.getElementById(`vote-button-${selectedPoll}`);

  if (totalVotesElem && pollOpenElem && pollClosedElem) {
    totalVotesElem.innerText = totalVotes;
    pollOpenElem.style.display = "none";
    buttonElem.style.display = "none";
    pollClosedElem.style.display = "flex";
  }
}

/**
 * Places a vote for a poll and updates the UI with the new total votes.
 */
function placeVote(event) {
  const { selectedOption, selectedPoll } = event.detail;
  const pollEndpoint = `${apiHost}api/client_polls/${selectedPoll}`;

  helpers.get(pollEndpoint)
    .then((poll) => {
      const etag = poll._etag;
      let data = { "poll_body": { "answers" : poll.poll_body.answers }};
      data.poll_body.answers[selectedOption].votes += 1; 

      helpers.patch(pollEndpoint, data, etag)
        .then((updatedPoll) => {
          let totalVotes = updatedPoll.poll_body.answers.reduce((acc, ans) => acc + ans.votes, 0);
          updatePollUI(totalVotes, selectedPoll);
          persistVote(selectedPoll, selectedOption);
      });
    });
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
