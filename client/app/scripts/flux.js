export default angular.module('liveblog.flux', [])
    .factory('Dispatcher', function() {
        return {
            dispatch: function(action) {
                document.dispatchEvent(
                    new CustomEvent('dispatch', { detail: action })
                );
            }
        }
    })
    .factory('Store', function() {
        var Store = function(reducers, initialState) {
            this.dispatch = this.dispatch.bind(this);
            this.destroy = this.destroy.bind(this);

            this.reducers = reducers;
            this.listeners = [];
            this.state = initialState;

            document.addEventListener('dispatch', this.dispatch);
        };

        Store.prototype.connect = function(listener) {
            this.listeners.push(listener);
        };

        Store.prototype.dispatch = function(e) {
            this.state = this.reducers(this.state, e.detail);
            var state = this.state;

            this.listeners.forEach(function(listener) {
                listener(state);
            });
        };

        Store.prototype.destroy = function() {
            document.removeEventListener('dispatch', this.dispatch);
        }

        return Store;
    });
