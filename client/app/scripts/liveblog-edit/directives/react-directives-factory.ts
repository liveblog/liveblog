import React from 'react';
import ReactDOM from 'react-dom';

type IScopeType = '&' | '@' | '=';
type IScopeDefinitions = string | [string, IScopeType];

// We keep it simple for now. No need to put extra stuff in the
// directive. If more complex stuff is required we should create
// the directive separately
interface IDirective {
    restrict: string;
    link?: (scope: any, element: HTMLElement, attrs: any) => void;
    scope?: any;
}

/**
 * This is meant to avoid redundancy when it comes to using React components
 * in our Angular stack. basically this allows you to create simple directive
 * to mount components. The properties for the component can be provided as the
 * directive attributes and will be passed to the component
 */
export const simpleReactDirective = (
    Component: any, scopeDef: IScopeDefinitions[], restrict: string = 'E'
) => {
    const directive: IDirective = {
        restrict: restrict,
    };

    const extractProps = ($scope: any) => {
        const props = {};

        scopeDef.forEach((x) => {
            if (typeof x === 'string') {
                props[x] = $scope[x];
            } else if (Array.isArray(x) && x.length === 2) {
                const key = x[0]; // eslint-disable-line
                props[key] = $scope[key];
            }
        });

        return props;
    };

    // first let's create link attribute
    directive.link = (scope, element) => {
        const mountPoint = $(element).get(0);
        const compInstance = React.createElement(Component, extractProps(scope));

        ReactDOM.render(compInstance, mountPoint);

        scope.$on('$destroy', () => {
            ReactDOM.unmountComponentAtNode(mountPoint);
        });
    };

    // then attach the isolated scope
    directive.scope = {};
    scopeDef.forEach((x) => {
        if (typeof x === 'string') {
            directive.scope[x] = '=';
        } else if (Array.isArray(x) && x.length === 2) {
            directive.scope[x[0]] = x[1];
        } else {
            console.warn('Wrong scope definition', x);
        }
    });

    return () => directive;
};
