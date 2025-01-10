class NutritionService {
    constructor() {
        this.repository = new Repository();
    }

    // Products methods
    async addProduct(product) {
        if (!product.name || !product.calories || !product.fats || !product.protein || !product.carbs) {
            throw new Error('All nutritional values are required');
        }

        if (product.calories < 0 || product.fats < 0 || product.protein < 0 || product.carbs < 0) {
            throw new Error('Nutritional values must be positive numbers');
        }

        // Clean and standardize the product data
        const cleanProduct = {
            name: product.name.trim(),
            calories: parseInt(product.calories),
            fats: parseFloat(product.fats),
            protein: parseFloat(product.protein),
            carbs: parseFloat(product.carbs),
            servingSize: 100 // Fixed serving size of 100g
        };

        return await this.repository.addProduct(cleanProduct);
    }

    async searchProducts(query) {
        return await this.repository.searchProducts(query);
    }

    async getAllProducts() {
        return await this.repository.getAllProducts();
    }

    // Meals methods
    async addMeal(products) {
        if (!products || products.length === 0) {
            throw new Error('At least one product is required');
        }

        const allProducts = await this.repository.getAllProducts();
        
        const productMap = new Map(allProducts.map(p => [p.id, p]));

        const meal = {
            date: new Date(),
            products: products.map(p => {
                const product = productMap.get(p.productId);
                if (!product) {
                    throw new Error(`Product with ID ${p.productId} not found`);
                }

                return {
                    productId: p.productId,
                    productName: product.name,
                    grams: p.grams,
                    calories: this.calculateNutrient(product.calories, p.grams),
                    fats: this.calculateNutrient(product.fats, p.grams),
                    protein: this.calculateNutrient(product.protein, p.grams),
                    carbs: this.calculateNutrient(product.carbs, p.grams)
                };
            })
        };

        // Calculate totals
        meal.totalCalories = meal.products.reduce((sum, p) => sum + p.calories, 0);
        meal.totalFats = meal.products.reduce((sum, p) => sum + p.fats, 0);
        meal.totalProtein = meal.products.reduce((sum, p) => sum + p.protein, 0);
        meal.totalCarbs = meal.products.reduce((sum, p) => sum + p.carbs, 0);

        return await this.repository.addMeal(meal);
    }

    async getMealHistory(date, limit = 10, offset = 0) {
        console.log('Getting meal history for date:', date, 'limit:', limit, 'offset:', offset);
        const meals = await this.repository.getMealsByDate(date, limit, offset);
        console.log('Retrieved meals:', meals);
        return meals;
    }

    // Settings methods
    async saveSettings(settings) {
        if (!settings.caloriesGoal) {
            throw new Error('Calories goal is required');
        }

        const cleanSettings = {
            caloriesGoal: parseInt(settings.caloriesGoal),
            fatsGoal: settings.fatsGoal ? parseFloat(settings.fatsGoal) : null,
            proteinGoal: settings.proteinGoal ? parseFloat(settings.proteinGoal) : null,
            carbsGoal: settings.carbsGoal ? parseFloat(settings.carbsGoal) : null
        };

        return await this.repository.saveSettings(cleanSettings);
    }

    async getSettings() {
        return await this.repository.getSettings() || {
            caloriesGoal: 2000,
            fatsGoal: null,
            proteinGoal: null,
            carbsGoal: null
        };
    }

    // Helper methods
    calculateNutrient(value, grams) {
        return parseFloat(((value * grams) / 100).toFixed(1));
    }

    getDailyTotals(meals) {
        return {
            calories: meals.reduce((sum, meal) => sum + meal.totalCalories, 0),
            fats: meals.reduce((sum, meal) => sum + meal.totalFats, 0),
            protein: meals.reduce((sum, meal) => sum + meal.totalProtein, 0),
            carbs: meals.reduce((sum, meal) => sum + meal.totalCarbs, 0)
        };
    }
} 