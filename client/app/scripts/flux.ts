export default angular.module('liveblog.flux', [])
    .factory('Dispatcher', () => ({
        dispatch: (action: AnyAction) => {
            document.dispatchEvent(
                new CustomEvent<AnyAction>('dispatch', {detail: action})
            );
        },
    }))
    .factory('Store', () => {
        class Store<S = any> {
            state: S;
            reducer: Reducer<S>;
            listeners: Array<Listener>;

            constructor(reducer, initialState: S) {
                this.state = initialState;
                this.reducer = reducer;
                this.listeners = [];

                document.addEventListener('dispatch', this.dispatcher);
            }

            connect = (listener: Listener) => {
                this.listeners.push(listener);
            }

            dispatch = (action: AnyAction) => {
                this.state = this.reducer(this.state, action);
                const state = this.state;

                this.listeners.forEach((listener) => {
                    listener(state);
                });
            }

            dispatcher = (evData: CustomEvent<AnyAction>) => {
                this.dispatch(evData.detail);
            }

            destroy = () => {
                document.removeEventListener('dispatch', this.dispatcher);
            }
        }

        return Store;
    });
