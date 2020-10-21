import { createContext } from 'react';

interface IContext {
    state?: any;
    dispatch?: (action: IAnyAction) => void;
}

const Context = createContext<IContext>({});

const Provider = Context.Provider;

export {
    Context,
    Provider,
};
