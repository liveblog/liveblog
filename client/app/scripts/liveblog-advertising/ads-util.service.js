import angular from 'angular';

export default function adsUtil() {
	return {
		uniqueNameInItems: uniqueNameInItems
	}

	function uniqueNameInItems (item, existingItems) {
        var invalid = false;
        if (!item || !item.name) {
            invalid = gettext('required');
        }
        if (!invalid) {
            angular.forEach(existingItems, function(existingItem) {
                // make sure name is unique but don't compare with itself
                if (item.name === existingItem.name && (!item._id || item._id !== existingItem._id)) {
                    invalid = gettext('must be unique');
                }
            });
        }
        return invalid;
    }
}