'use strict';

var helpers = require('./helpers');

const apiHost = LB.api_host.match(/\/$/i) ? LB.api_host : LB.api_host + '/';
const pollsEndpoint = `${apiHost}api/client_polls/`;

function placeVote(event) {
  const selectedOption = event.detail.selectedOption;
  const selectedPoll = event.detail.selectedPoll;
  const totalVotesId = `total-votes-${selectedPoll}`;
  const voteButtonId = `vote-button-${selectedPoll}`;
  const pollEndpoint = pollsEndpoint + selectedPoll;

  helpers.get(pollEndpoint)
    .then((poll) => {
      const etag = poll._etag;
      let data = { "poll_body": { "answers" : poll.poll_body.answers }};
      data.poll_body.answers[selectedOption].votes += 1; 

      helpers.patch(pollEndpoint, data, etag)
        .then((updatedPoll) => {
          // Update the votes count on the readers UI and hide button for now 
          let totalVotes = updatedPoll.poll_body.answers.reduce((acc, ans) => acc + ans.votes, 0);
          document.getElementById(totalVotesId).innerText = totalVotes;
          document.getElementById(voteButtonId).style.display = "none";
      });
    });
}

module.exports = {
    init: () => {
        document.addEventListener('place_vote', function (e) {
            placeVote(e);
        });
    },
};
