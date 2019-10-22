import React from 'react';
import { IStyleAction } from './actions'; // eslint-disable-line

interface IContext {
    state?: IStyleSettings;
    dispatch?: (action: IStyleAction) => void;
}

const Context = React.createContext<IContext>({});

const Provider = Context.Provider;

export {
    Context,
    Provider,
};
