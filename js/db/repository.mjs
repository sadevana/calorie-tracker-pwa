/**
 * @typedef {Object} Product
 * @property {string} [id] - The unique identifier for the product (auto-generated if undefined)
 * @property {string} name - Product name
 * @property {string} nameLower - Lowercase product name for case-insensitive search
 * @property {number} calories - Calories per 100g
 * @property {number} protein - Protein per 100g
 * @property {number} carbs - Carbs per 100g
 * @property {number} fat - Fat per 100g
 */

/**
 * @typedef {Object} MealProduct
 * @property {string} productID - ID of the product
 * @property {string} productName - Name of the product
 * @property {number} grams - Amount in grams
 * @property {number} calories - Total calories for this amount
 * @property {number} protein - Total protein for this amount
 * @property {number} carbs - Total carbs for this amount
 * @property {number} fat - Total fat for this amount
 */

/**
 * @typedef {Object} Meal
 * @property {string} [id] - The unique identifier for the meal (auto-generated if undefined)
 * @property {string} date - Date of the meal (YYYY-MM-DD)
 * @property {number} timestamp - Unix timestamp of the meal
 * @property {MealProduct[]} products - Products in the meal
 * @property {number} totalCalories - Total calories of the meal
 * @property {number} totalProtein - Total protein of the meal
 * @property {number} totalCarbs - Total carbs of the meal
 * @property {number} totalFat - Total fat of the meal
 */

/**
 * @typedef {Object} Settings
 * @property {string} [id] - The unique identifier for the settings
 * @property {number} targetCalories - Daily calorie goal
 * @property {number|null} targetProtein - Daily protein goal in grams
 * @property {number|null} targetCarbs - Daily carbs goal in grams
 * @property {number|null} targetFat - Daily fat goal in grams
 */

const settingsID = 'user-settings'; 

const readonly = 'readonly';
const readwrite = 'readwrite';
const ascendingCursor = 'next';
const descendingCursor = 'prev';

export class Repository {
    /** @type {IDBDatabase | null} */ db = null;
    /** @type {Promise<void>} */ initPromise;

    constructor() {
        this.dbName = 'CalorieTrackerDB';
        this.dbVersion = 1;
        this.stores = {
            products: 'products',
            meals: 'meals',
            settings: 'settings'
        };
        this.initPromise = this.init();
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = request.result;
                
                // Products store with case-insensitive search
                if (!db.objectStoreNames.contains(this.stores.products)) {
                    const productStore = db.createObjectStore(this.stores.products, { keyPath: 'id', autoIncrement: true });
                    productStore.createIndex('nameIndex', 'nameLower');
                }

                // Meals store
                if (!db.objectStoreNames.contains(this.stores.meals)) {
                    const mealStore = db.createObjectStore(this.stores.meals, { keyPath: 'id', autoIncrement: true });
                    mealStore.createIndex('dateIndex', 'date');
                }

                // Settings store
                if (!db.objectStoreNames.contains(this.stores.settings)) {
                    db.createObjectStore(this.stores.settings, { keyPath: 'id' });
                }
            };
        });
    }

    /**
     * @param {Product} product
     * @returns {Promise}
     */
    async addProduct(product) {
        return this.performTransaction(this.stores.products, readwrite, store => {
            return store.add(product);
        });
    }

    /**
     * @param {string} query
     * @returns {Promise<Product[]>}
     */
    async searchProducts(query) {
        const queryLower = query.toLowerCase();
        return this.performTransaction(this.stores.products, readonly, store => {
            return store.index('nameIndex').getAll(IDBKeyRange.bound(queryLower, queryLower + '\uffff'));
        });
    }

    /**
     * @returns {Promise<Product[]>}
     */
    async getAllProducts() {
        return this.performTransaction(this.stores.products, readonly, store => {
            return store.getAll();
        });
    }

    /**
     * @param {Meal} meal
     * @returns {Promise}
     */
    async addMeal(meal) {
        return this.performTransaction(this.stores.meals, readwrite, store => {
            return store.add(meal);
        });
    }

    /**
     * @param {number} limit
     * @returns {Promise<Meal[]>}
     */
    async getMeals(limit = 100) {
        return this.performTransaction(this.stores.meals, readonly, store => {
            return store.getAll(null, limit);
        });
    }

    /**
     * @param {Settings} settings - The settings to save
     * @returns {Promise} A promise that resolves to the result of the operation
     */
    async saveSettings(settings) {
        return this.performTransaction(this.stores.settings, readwrite, store => {
            return store.put({ ...settings, id: settingsID });
        });
    }

    /**
     * @returns {Promise<Settings>}
     */
    async getSettings() {
        return this.performTransaction(this.stores.settings, readonly, store => {
            return store.get(settingsID);
        });
    }

    // Helper method for transactions

    /**
     * @template T
     * @param {string} storeName - The name of the store to perform the transaction on
     * @param {IDBTransactionMode} mode - The mode of the transaction ('readonly' or 'readwrite')
     * @param {function(IDBObjectStore): IDBRequest<T> | Promise<T>} operation - The operation to perform on the store
     * @returns {Promise<T>} A promise that resolves to the result of the operation
     */
    async performTransaction(storeName, mode, operation) {
        await this.initPromise; // Wait for initialization to complete
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], mode);
            const store = transaction.objectStore(storeName);

            let request;
            try {
                request = operation(store);
            } catch (error) {
                reject(error);
                return;
            }

            if (request instanceof IDBRequest) {
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            } else {
                // Handle promises returned from operations
                Promise.resolve(request)
                    .then(result => resolve(result))
                    .catch(error => reject(error));
            }
        });
    }
}