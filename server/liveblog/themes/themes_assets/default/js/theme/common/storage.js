class Storage {
    static read(name) {
        var itemStr = localStorage.getItem(name);

        // if the item doesn't exist, return null
        if (!itemStr)
            return null;

        var item = JSON.parse(itemStr);
        var now = new Date();

        // compare the expiry time of the item with the current time
        if (now.getTime() > item.expiry) {
            // If the item is expired, delete the item from storage
            // and return null
            localStorage.removeItem(name);
            return null;
        }

        return item.value;
    }

    static write(name, value, days) {
        var date = new Date();

        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);

        // `item` is an object which contains the original value
        // as well as the time when it's supposed to expire
        var item = {
            value: value,
            expiry: date.getTime(),
        };

        localStorage.setItem(name, JSON.stringify(item));
    }
}

export {Storage};