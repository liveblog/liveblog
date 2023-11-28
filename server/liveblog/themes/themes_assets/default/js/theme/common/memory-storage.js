/**
 * MemoryStorage provides an in-memory key-value storage system similar to localStorage and sessionStorage.
 * It's especially useful when these are not available, e.g., in some browsing contexts or privacy settings.
 */
class MemoryStorage {
    constructor() {
        this.memory = new Map();
    }

    /**
     * Retrieves the value associated with a given key.
     * @param {string} key - The key to look up.
     * @returns {string|null} - The value for the key, or null if the key does not exist.
     */
    getItem(key) {
        return this.memory.has(key) ? this.memory.get(key) : null;
    }

    /**
     * Sets a key to a given value. If the key already exists, its value is updated.
     * @param {string} key - The key to set.
     * @param {string} value - The value to set.
     */
    setItem(key, value) {
        this.memory.set(key, value);
    }

    /**
     * Removes an item with a given key.
     * @param {string} key - The key to remove.
     * @returns {boolean} - True if the key existed and was removed, false otherwise.
     */
    removeItem(key) {
        return this.memory.delete(key);
    }

    /**
     * Clears all items from the storage.
     */
    clear() {
        this.memory.clear();
    }

    /**
     * Gets the number of items stored.
     * @returns {number} - The number of items in the storage.
     */
    get length() {
        return this.memory.size;
    }
}

export { MemoryStorage };
