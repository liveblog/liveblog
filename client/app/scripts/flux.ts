export default angular.module('liveblog.flux', [])
    .factory('Dispatcher', () => ({
        dispatch: (action) => {
            document.dispatchEvent(
                new CustomEvent('dispatch', {detail: action})
            );
        },
    }))
    .factory('Store', () => {
        const Store = (reducers, initialState) => {
            this.dispatch = this.dispatch.bind(this);
            this.destroy = this.destroy.bind(this);

            this.reducers = reducers;
            this.listeners = [];
            this.state = initialState;

            document.addEventListener('dispatch', this.dispatch);
        };

        Store.prototype.connect = (listener) => {
            this.listeners.push(listener);
        };

        Store.prototype.dispatch = (e) => {
            this.state = this.reducers(this.state, e.detail);
            const state = this.state;

            this.listeners.forEach((listener) => {
                listener(state);
            });
        };

        Store.prototype.destroy = () => {
            document.removeEventListener('dispatch', this.dispatch);
        };

        return Store;
    });
