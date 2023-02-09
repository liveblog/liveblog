import { simpleReactDirective } from './react-directives-factory';
import { DateTimePicker } from '../components/dateTimePicker';
import { ItemEmbed } from 'liveblog-edit/components/itemEmbed';

export const dateTimePickerDirective = simpleReactDirective(DateTimePicker, ['datetime', 'onChange']);

export const lbItemEmbed = simpleReactDirective(ItemEmbed, ['meta', 'htmlContent']);
