/**
 * @typedef {Object} AddProductRequest
 * @property {string} name - Product name
 * @property {string|number} calories - Calories per 100g
 * @property {string|number} fats - Fat per 100g
 * @property {string|number} protein - Protein per 100g
 * @property {string|number} carbs - Carbs per 100g
 */

/**
 * @typedef {Object} AddMealProductRequest
 * @property {string} productId - ID of the product to add
 * @property {string|number} grams - Amount in grams
 */

/**
 * @typedef {Object} SaveSettingsRequest
 * @property {string|number} caloriesGoal - Daily calorie goal
 * @property {string|number|null} fatsGoal - Daily fat goal in grams
 * @property {string|number|null} proteinGoal - Daily protein goal in grams
 * @property {string|number|null} carbsGoal - Daily carbs goal in grams
 */

/**
 * @typedef {Object} DailyTotals
 * @property {number} calories - Total calories
 * @property {number} fats - Total fats in grams
 * @property {number} protein - Total protein in grams
 * @property {number} carbs - Total carbs in grams
 */

class NutritionService {
    constructor() {
        this.repository = new Repository();
    }

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

        // Clean and standardize the product data
        const cleanProduct = {
            name: product.name.trim(),
            nameLower: product.name.trim().toLowerCase(),
            calories: Number(product.calories),
            fat: Number(product.fats),
            protein: Number(product.protein),
            carbs: Number(product.carbs)
        };

        return await this.repository.addProduct(cleanProduct);
    }

    /**
     * @param {string} query
     * @returns {Promise<DbProduct[]>}
     */
    async searchProducts(query) {
        return await this.repository.searchProducts(query);
    }

    /**
     * @returns {Promise<DbProduct[]>}
     */
    async getAllProducts() {
        return await this.repository.getAllProducts();
    }

    /**
     * @param {AddMealProductRequest[]} products
     * @returns {Promise<void>}
     */
    async addMeal(products) {
        if (!products || products.length === 0) {
            throw new Error('At least one product is required');
        }

        const allProducts = await this.repository.getAllProducts();
        const productMap = new Map(allProducts.map(p => [p.id, p]));

        const now = new Date();
        const mealProducts = products.map(p => {
            const product = productMap.get(p.productId);
            if (!product) {
                throw new Error(`Product with ID ${p.productId} not found`);
            }

            return {
                productID: p.productId,
                productName: product.name,
                grams: Number(p.grams),
                calories: this.calculateNutrient(product.calories, Number(p.grams)),
                protein: this.calculateNutrient(product.protein, Number(p.grams)),
                carbs: this.calculateNutrient(product.carbs, Number(p.grams)),
                fat: this.calculateNutrient(product.fat, Number(p.grams))
            };
        });

        /** @type {DbMeal} */
        const meal = {
            date: now.toISOString().split('T')[0],
            timestamp: now.getTime(),
            products: mealProducts,
            totalCalories: mealProducts.reduce((sum, p) => sum + p.calories, 0),
            totalProtein: mealProducts.reduce((sum, p) => sum + p.protein, 0),
            totalCarbs: mealProducts.reduce((sum, p) => sum + p.carbs, 0),
            totalFat: mealProducts.reduce((sum, p) => sum + p.fat, 0)
        };

        return await this.repository.addMeal(meal);
    }

    /**
     * @param {number} [limit=100]
     * @returns {Promise<DbMeal[]>}
     */
    async getMealHistory(limit = 100) {
        return await this.repository.getMeals(limit);
    }

    /**
     * @param {SaveSettingsRequest} settings
     * @returns {Promise<void>}
     */
    async saveSettings(settings) {
        if (!settings.caloriesGoal) {
            throw new Error('Calories goal is required');
        }

        /** @type {DbSettings} */
        const cleanSettings = {
            targetCalories: Number(settings.caloriesGoal),
            targetFat: settings.fatsGoal ? Number(settings.fatsGoal) : null,
            targetProtein: settings.proteinGoal ? Number(settings.proteinGoal) : null,
            targetCarbs: settings.carbsGoal ? Number(settings.carbsGoal) : null
        };

        return await this.repository.saveSettings(cleanSettings);
    }

    /**
     * @returns {Promise<DbSettings>}
     */
    async getSettings() {
        return await this.repository.getSettings() || {
            targetCalories: 2000,
            targetFat: null,
            targetProtein: null,
            targetCarbs: null
        };
    }

    /**
     * @param {number} value
     * @param {number} grams
     * @returns {number}
     */
    calculateNutrient(value, grams) {
        return parseFloat(((value * grams) / 100).toFixed(1));
    }

    /**
     * @param {DbMeal[]} meals
     * @returns {DailyTotals}
     */
    getDailyTotals(meals) {
        return {
            calories: meals.reduce((sum, meal) => sum + meal.totalCalories, 0),
            fats: meals.reduce((sum, meal) => sum + meal.totalFat, 0),
            protein: meals.reduce((sum, meal) => sum + meal.totalProtein, 0),
            carbs: meals.reduce((sum, meal) => sum + meal.totalCarbs, 0)
        };
    }
} 