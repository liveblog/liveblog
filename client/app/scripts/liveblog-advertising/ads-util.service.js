export default function adsUtil() {
    return {
        uniqueNameInItems: uniqueNameInItems,
    };

    function uniqueNameInItems(item, existingItems) {
        let invalid = false;

        if (!item || !item.name) {
            invalid = gettext('required');
        }
        if (!invalid) {
            const found = existingItems.find((existingItem) => item.name === existingItem.name &&
                                                (!item._id || item._id !== existingItem._id));

            if (found) {
                invalid = gettext('must be unique');
            }
        }
        return invalid;
    }
}