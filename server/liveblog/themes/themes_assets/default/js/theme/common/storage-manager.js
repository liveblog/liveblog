const { MemoryStorage } = require('./memory-storage');

const checkStorageAvailability = (storageType) => {
    try {
        const storage = window[storageType];
        storage.getItem('is-available');
        return [true, storage];
    } catch (err) {
        return [false, null];
    }
};

const storageManager = (() => {
    const storages = ['localStorage', 'sessionStorage'];

    for (const storageType of storages) {
        const [available, storage] = checkStorageAvailability(storageType);
        if (available) {
            return storage;
        } else {
            console.log(`'${storageType}' not available`);
        }
    }

    console.log('Falling back to memory storage');
    return new MemoryStorage();
})();

export {
    storageManager
}
