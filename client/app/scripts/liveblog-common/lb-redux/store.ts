import { useReducer } from 'react';

export class SimpleStore<T = any> {
    state: T;
    dispatch: any;

    constructor(state, dispatch) {
        this.state = state;
        this.dispatch = dispatch;
    }
}

export const createStore = <T = any>(rootReducer: Reducer, initialState: any): SimpleStore<T> => {
    const [state, dispatch] = useReducer(rootReducer, initialState);

    return new SimpleStore<T>(state, dispatch);
};

export default createStore;
