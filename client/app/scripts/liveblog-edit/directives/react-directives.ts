import { createElement, createRef } from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { simpleReactDirective } from './react-directives-factory';
import { DateTimePicker } from '../components/dateTimePicker';
import { ItemEmbed } from 'liveblog-edit/components/itemEmbed';

export const dateTimePickerDirective = simpleReactDirective(DateTimePicker, ['datetime', 'onChange']);

export const lbItemEmbed = () => {
    return {
        restrict: 'AE',

        scope: {
            item: '=',
        },

        link: (scope, element, attrs) => {
            const embedRef = createRef<ItemEmbed>();
            const props = { item: scope.item, ref: embedRef };
            const mountPoint = $(element).get(0);

            render(createElement(ItemEmbed, props), mountPoint);

            scope.$on('$destroy', () => unmountComponentAtNode(mountPoint));

            scope.$watch(attrs.item, (nextItem) => {
                embedRef.current.updateItem(nextItem);
            });
        },
    };
};
