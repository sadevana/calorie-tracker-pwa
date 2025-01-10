class Repository {
    constructor() {
        this.dbName = 'CalorieTrackerDB';
        this.dbVersion = 1;
        this.stores = {
            products: 'products',
            meals: 'meals',
            settings: 'settings'
        };
        this.init();
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
                const db = event.target.result;
                
                // Products store
                if (!db.objectStoreNames.contains(this.stores.products)) {
                    const productStore = db.createObjectStore(this.stores.products, { keyPath: 'id', autoIncrement: true });
                    productStore.createIndex('nameIndex', 'name');
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

    async ensureDB() {
        if (!this.db) {
            await this.init();
        }
    }

    // Products methods
    async addProduct(product) {
        await this.ensureDB();
        return this.performTransaction(this.stores.products, 'readwrite', store => {
            return store.add(product);
        });
    }

    async searchProducts(query) {
        await this.ensureDB();
        return this.performTransaction(this.stores.products, 'readonly', store => {
            return store.index('nameIndex').getAll(IDBKeyRange.bound(query, query + '\uffff'));
        });
    }

    async getAllProducts() {
        await this.ensureDB();
        return this.performTransaction(this.stores.products, 'readonly', store => {
            return store.getAll();
        });
    }

    // Meals methods
    async addMeal(meal) {
        await this.ensureDB();
        return this.performTransaction(this.stores.meals, 'readwrite', store => {
            return store.add({
                ...meal,
                date: meal.date.toISOString().split('T')[0]
            });
        });
    }

    async getMealsByDate(date, limit = 10, offset = 0) {
        await this.ensureDB();
        const dateStr = date.toISOString().split('T')[0];
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.stores.meals], 'readonly');
            const store = transaction.objectStore(this.stores.meals);
            const meals = [];

            const cursorRequest = store.index('dateIndex')
                .openCursor(IDBKeyRange.only(dateStr), 'prev');

            cursorRequest.onerror = () => reject(cursorRequest.error);
            
            let skipped = 0;
            cursorRequest.onsuccess = (event) => {
                const cursor = event.target.result;
                if (!cursor || meals.length >= limit) {
                    return;
                }
                if (skipped < offset) {
                    skipped++;
                    cursor.continue();
                    return;
                }
                meals.push(cursor.value);
                cursor.continue();
            };

            transaction.oncomplete = () => resolve(meals);
            transaction.onerror = () => reject(transaction.error);
        });
    }

    // Settings methods
    async saveSettings(settings) {
        await this.ensureDB();
        return this.performTransaction(this.stores.settings, 'readwrite', store => {
            return store.put({ ...settings, id: 'user-settings' });
        });
    }

    async getSettings() {
        await this.ensureDB();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.stores.settings], 'readonly');
            const store = transaction.objectStore(this.stores.settings);
            const request = store.get('user-settings');

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Helper method for transactions
    async performTransaction(storeName, mode, operation) {
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