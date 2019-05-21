class RetryHandler {
    constructor() {
        this.interval = 1000; // Start at one second
        this.maxInterval = 60 * 1000; // Don't wait longer than a minute
    }

    /**
     * Invoke the function after waiting
     *
     * @param {function} fn Function to invoke
     */
    retry(fn) {
        setTimeout(fn, this.interval);
        this.interval = this.nextInterval_();
    }

    /**
     * Reset the counter (e.g. after successful request.)
     */
    reset() {
        this.interval = 1000;
    }

    /**
     * Calculate the next wait time.
     * @return {number} Next wait interval, in milliseconds
     *
     * @private
     */
    nextInterval_() {
        var interval = this.interval * 2 + this.getRandomInt_(0, 1000);

        return Math.min(interval, this.maxInterval);
    }

    /**
     * Get a random int in the range of min to max. Used to add jitter to wait times.
     *
     * @param {number} min Lower bounds
     * @param {number} max Upper bounds
     * @private
     */
    getRandomInt_(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }
}

export default RetryHandler;
