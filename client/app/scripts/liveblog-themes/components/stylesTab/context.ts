import React from 'react';
import { IStyleAction } from './actions'; // eslint-disable-line
import type { IStylesTabProps } from './types';

interface IContext {
    state?: IStylesTabProps;
    dispatch?: (action: IStyleAction) => void;
}

const Context = React.createContext<IContext>({});

const Provider = Context.Provider;

export {
    Context,
    Provider,
};
