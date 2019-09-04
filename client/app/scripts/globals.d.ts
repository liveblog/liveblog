declare const angular: IAngularStatic;

type Action<T = any> = {
    type: T;
};

interface IAnyAction extends Action {
    [prop: string]: any;
}

type Listener = (state: any) => void;

type Reducer<S = any> = (state: S, action: IAnyAction) => S;

// fix to avoid the typescript compiler warning
declare module '*.ng1' {
    const value: string;
    export default value;
}

declare const gettext: (text: string) => string;
