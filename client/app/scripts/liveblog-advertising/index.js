import './styles/advertising.scss';
import activities from './activities';

var liveblogAdvertisingModule = angular.module('liveblog.advertising', ['liveblog.edit'])
.config(activities);