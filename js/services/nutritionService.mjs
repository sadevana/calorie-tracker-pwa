/**
 * @typedef {Object} Product
 * @property {number} [id] - The unique identifier for the product
 * @property {string} name - Product name
 * @property {string} [nameLower] - Lowercase product name for case-insensitive search (internal use)
 * @property {number} calories - Calories per 100g
 * @property {number} protein - Protein per 100g
 * @property {number} carbs - Carbs per 100g
 * @property {number} fat - Fat per 100g
 */

/**
 * @typedef {Object} MealProduct
 * @property {number} productID - ID of the product
 * @property {string} productName - Name of the product
 * @property {number} grams - Amount in grams
 * @property {number} calories - Total calories for this amount
 * @property {number} protein - Total protein for this amount
 * @property {number} carbs - Total carbs for this amount
 * @property {number} fat - Total fat for this amount
 */

/**
 * @typedef {Object} Meal
 * @property {number} [id] - The unique identifier for the meal
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

/**
 * @typedef {Object} DailyTotals
 * @property {number} calories - Total calories
 * @property {number} fats - Total fats in grams
 * @property {number} protein - Total protein in grams
 * @property {number} carbs - Total carbs in grams
 */

const settingsID = 'user-settings';
const readonly = 'readonly';
const readwrite = 'readwrite';

export class NutritionService {
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

    /**
     * @typedef {Object} AddProductRequest
     * @property {string} name - Product name
     * @property {string|number} calories - Calories per 100g
     * @property {string|number} fats - Fat per 100g
     * @property {string|number} protein - Protein per 100g
     * @property {string|number} carbs - Carbs per 100g
     */

    /**
     * @param {AddProductRequest} product
     * @returns {Promise<void>}
     */
    async addProduct(product) {
        if (!product.name || !product.calories || !product.fats || !product.protein || !product.carbs) {
            throw new Error('All nutritional values are required');
        }

        if (Number(product.calories) < 0 || Number(product.fats) < 0 || Number(product.protein) < 0 || Number(product.carbs) < 0) {
            throw new Error('Nutritional values must be positive numbers');
        }

        /** @type {Product} */
        const newProduct = {
            name: product.name.trim(),
            nameLower: product.name.trim().toLowerCase(),
            calories: Number(product.calories),
            fat: Number(product.fats),
            protein: Number(product.protein),
            carbs: Number(product.carbs)
        };

        await this.performTransaction(this.stores.products, readwrite, store => {
            return store.add(newProduct);
        });
    }

    /**
     * @param {string} query
     * @returns {Promise<Product[]>}
     */
    async searchProducts(query) {
        const queryLower = query.toLowerCase();
        const products = await this.performTransaction(this.stores.products, readonly, store => {
            return store.index('nameIndex').getAll(IDBKeyRange.bound(queryLower, queryLower + '\uffff'));
        });
        return products;
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
     * @typedef {Object} AddMealProductRequest
     * @property {number} productId - ID of the product to add
     * @property {number} grams - Amount in grams
     */

    /**
     * @param {AddMealProductRequest[]} products
     * @returns {Promise<void>}
     */
    async addMeal(products) {
        if (!products || products.length === 0) {
            throw new Error('At least one product is required');
        }

        const allProducts = await this.getAllProducts();
        console.log(allProducts);
        const productMap = new Map(allProducts.map(p => [p.id, p]));

        const now = new Date();
        const mealProducts = products.map(p => {
            console.log(p, productMap);
            const product = productMap.get(p.productId);
            if (!product) {
                throw new Error(`Product with ID ${p.productId} not found`);
            }

            const grams = Number(p.grams);
            return {
                productID: p.productId,
                productName: product.name,
                grams,
                calories: this.calculateNutrient(product.calories, grams),
                protein: this.calculateNutrient(product.protein, grams),
                carbs: this.calculateNutrient(product.carbs, grams),
                fat: this.calculateNutrient(product.fat, grams)
            };
        });

        /** @type {Meal} */
        const meal = {
            date: now.toISOString().split('T')[0],
            timestamp: now.getTime(),
            products: mealProducts,
            totalCalories: mealProducts.reduce((sum, p) => sum + p.calories, 0),
            totalProtein: mealProducts.reduce((sum, p) => sum + p.protein, 0),
            totalCarbs: mealProducts.reduce((sum, p) => sum + p.carbs, 0),
            totalFat: mealProducts.reduce((sum, p) => sum + p.fat, 0)
        };

        await this.performTransaction(this.stores.meals, readwrite, store => {
            return store.add(meal);
        });
    }

    /**
     * @param {number} [limit=100]
     * @returns {Promise<Meal[]>}
     */
    async getMealHistory(limit = 100) {
        return this.performTransaction(this.stores.meals, readonly, store => {
            return store.getAll(null, limit);
        });
    }

    /**
     * @param {Settings} settings
     * @returns {Promise<void>}
     */
    async saveSettings(settings) {
        if (!settings.targetCalories) {
            throw new Error('Calories goal is required');
        }

        await this.performTransaction(this.stores.settings, readwrite, store => {
            return store.put({ ...settings, id: settingsID });
        });
    }

    /**
     * @returns {Promise<Settings>}
     */
    async getSettings() {
        const settings = await this.performTransaction(this.stores.settings, readonly, store => {
            return store.get(settingsID);
        });

        if (!settings) {
            // default settings
            return {
                targetCalories: 2000,
                targetFat: null,
                targetProtein: null,
                targetCarbs: null
            };
        }

        const { id, ...rest } = settings;
        return rest;
    }

    // helpers
    /**
     * Calculate nutrient value for a given amount of grams
     * @param {number} value - Value per 100g
     * @param {number} grams - Amount in grams
     * @returns {number}
     */
    calculateNutrient(value, grams) {
        return parseFloat(((value * grams) / 100).toFixed(1));
    }

    /**
     * Deletes a product by ID
     * @param {number} productId - The ID of the product to delete
     * @returns {Promise<void>}
     */
    async deleteProduct(productId) {
        await this.performTransaction(this.stores.products, readwrite, store => {
            return store.delete(productId);
        });
    }
}