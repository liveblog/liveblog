declare const angular: IAngularStatic;

type Action<T = any> = {
    type: T;
};

interface AnyAction extends Action {
    [prop: string]: any;
}

type Listener = (state: any) => void;

type Reducer<S = any> = (state: S, action: AnyAction) => S;