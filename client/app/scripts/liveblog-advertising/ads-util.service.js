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
            let found = existingItems.find((existingItem) => (item.name === existingItem.name && 
                                                (!item._id || item._id !== existingItem._id)))
            if (found) {
                invalid = gettext('must be unique');
            }
        }
        return invalid;
    }
}