import { Repository } from '../db/repository.mjs';

/**
 * @typedef {import('../db/repository.mjs').Product} DbProduct
 * @typedef {import('../db/repository.mjs').Meal} DbMeal
 * @typedef {import('../db/repository.mjs').Settings} DbSettings
 */

export class NutritionService {
    /** @type {Repository} */ repository;

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

        return await this.repository.addProduct(this.mapProductRequestToDbProduct(product));
    }

    /**
     * @param {string} query
     * @returns {Promise<Product[]>}
     */
    async searchProducts(query) {
        const dbProducts = await this.repository.searchProducts(query);
        return dbProducts.map(p => this.mapDbProductToProduct(p));
    }

    /**
     * @returns {Promise<Product[]>}
     */
    async getAllProducts() {
        const dbProducts = await this.repository.getAllProducts();
        return dbProducts.map(p => this.mapDbProductToProduct(p));
    }

    /**
     * @param {AddMealProductRequest[]} products
     * @returns {Promise<void>}
     */
    async addMeal(products) {
        if (!products || products.length === 0) {
            throw new Error('At least one product is required');
        }

        const allProducts = await this.getAllProducts();
        const productMap = new Map(allProducts.map(p => [p.id, p]));

        console.log(productMap);

        const now = new Date();
        const mealProducts = products.map(p => {
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

        /** @type {DbMeal} */
        const dbMeal = {
            date: now.toISOString().split('T')[0],
            timestamp: now.getTime(),
            products: mealProducts,
            totalCalories: mealProducts.reduce((sum, p) => sum + p.calories, 0),
            totalProtein: mealProducts.reduce((sum, p) => sum + p.protein, 0),
            totalCarbs: mealProducts.reduce((sum, p) => sum + p.carbs, 0),
            totalFat: mealProducts.reduce((sum, p) => sum + p.fat, 0)
        };

        return await this.repository.addMeal(dbMeal);
    }

    /**
     * @param {number} [limit=100]
     * @returns {Promise<Meal[]>}
     */
    async getMealHistory(limit = 100) {
        const dbMeals = await this.repository.getMeals(limit);
        return dbMeals.map(m => this.mapDbMealToMeal(m));
    }

    /**
     * @param {Settings} settings
     * @returns {Promise<void>}
     */
    async saveSettings(settings) {
        if (!settings.targetCalories) {
            throw new Error('Calories goal is required');
        }

        return await this.repository.saveSettings(this.mapSettingsToDbSettings(settings));
    }

    /**
     * @returns {Promise<Settings>}
     */
    async getSettings() {
        const dbSettings = await this.repository.getSettings();

        const defaultSettings = {
            targetCalories: 2000,
            targetFat: null,
            targetProtein: null,
            targetCarbs: null
        };
        return dbSettings ? this.mapDbSettingsToSettings(dbSettings) : defaultSettings;
    }

    // mappers

    /**
     * Convert DB product to service product
     * @param {DbProduct} dbProduct
     * @returns {Product}
     */
    mapDbProductToProduct(dbProduct) {
        const { nameLower, ...product } = dbProduct;
        return product;
    }

    /**
     * Convert service product to DB product
     * @param {AddProductRequest} request
     * @returns {DbProduct}
     */
    mapProductRequestToDbProduct(request) {
        return {
            name: request.name.trim(),
            nameLower: request.name.trim().toLowerCase(),
            calories: Number(request.calories),
            fat: Number(request.fats),
            protein: Number(request.protein),
            carbs: Number(request.carbs)
        };
    }

    /**
     * Convert DB meal to service meal
     * @param {DbMeal} dbMeal
     * @returns {Meal}
     */
    mapDbMealToMeal(dbMeal) {
        return dbMeal;
    }

    /**
     * Convert DB settings to service settings
     * @param {DbSettings} dbSettings
     * @returns {Settings}
     */
    mapDbSettingsToSettings(dbSettings) {
        const { id, ...settings } = dbSettings;
        return settings;
    }

    /**
     * Convert service settings to DB settings
     * @param {Settings} settings
     * @returns {DbSettings}
     */
    mapSettingsToDbSettings(settings) {
        return settings;
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
         * Calculate daily totals from meals
         * @param {Meal[]} meals
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

/**
 * @typedef {Object} Product
 * @property {string} [id] - The unique identifier for the product
 * @property {string} name - Product name
 * @property {number} calories - Calories per 100g
 * @property {number} protein - Protein per 100g
 * @property {number} carbs - Carbs per 100g
 * @property {number} fat - Fat per 100g
 */

/**
 * @typedef {Object} AddProductRequest
 * @property {string} name - Product name
 * @property {string|number} calories - Calories per 100g
 * @property {string|number} fats - Fat per 100g
 * @property {string|number} protein - Protein per 100g
 * @property {string|number} carbs - Carbs per 100g
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
 * @property {string} [id] - The unique identifier for the meal
 * @property {string} date - Date of the meal (YYYY-MM-DD)
 * @property {number} timestamp - Unix timestamp of the meal
 * @property {MealProduct[]} products - Products in the meal
 * @property {number} totalCalories - Total calories of the meal
 * @property {number} totalProtein - Total protein of the meal
 * @property {number} totalCarbs - Total carbs of the meal
 * @property {number} totalFat - Total fat of the meal
 */

/**
 * @typedef {Object} AddMealProductRequest
 * @property {string} productId - ID of the product to add
 * @property {string|number} grams - Amount in grams
 */

/**
 * @typedef {Object} Settings
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