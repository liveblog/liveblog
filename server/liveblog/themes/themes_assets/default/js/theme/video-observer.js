module.exports = {
    init: function () {
        var timelineNode = document.querySelector('[data-timeline-normal]');

        // Options for the observer (which mutations to observe)
        var config = { childList: true };

        // Callback function to execute when mutations are observed
        var callback = function(mutationsList, observer) {
            window.onYouTubeIframeAPIReady();
            window.onPlayerJSReady();
        };

        // Create an observer instance linked to the callback function
        var observer = new MutationObserver(callback);

        // Start observing the target node for configured mutations
        observer.observe(timelineNode, config);
    }
}