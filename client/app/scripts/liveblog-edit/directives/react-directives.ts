import { simpleReactDirective } from './react-directives-factory';
import { DateTimePicker } from '../components/dateTimePicker';

export const dateTimePickerDirective = simpleReactDirective(DateTimePicker, ['label']);
