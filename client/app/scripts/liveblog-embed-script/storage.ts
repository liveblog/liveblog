export default class LBStorage {
    static read(name: string) {
        const itemStr = localStorage.getItem(name);

        // tslint:disable-next-line:curly
        if (!itemStr)
            return null;

        const item = JSON.parse(itemStr);
        const now = new Date();

        if (now.getTime() > item.expiry) {
            // If the item is expired, delete the item from storage
            // and return null
            localStorage.removeItem(name);
            return null;
        }

        return item.value;
    }

    static write(name: string, value: any, days: number) {
        const date = new Date();

        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);

        // `item` is an object which contains the original value
        // as well as the time when it's supposed to expire
        const item = {
            value: value,
            expiry: date.getTime(),
        };

        localStorage.setItem(name, JSON.stringify(item));
    }
}
