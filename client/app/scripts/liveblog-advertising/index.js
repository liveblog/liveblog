import './styles/advertising.scss';
import activities from './activities';
import adsUtil from './ads-util.service.js';

angular.module('liveblog.advertising', ['liveblog.edit'])
    .config(activities)
    .service('adsUtilSevice', adsUtil);