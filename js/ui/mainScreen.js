class MainScreen {
    constructor() {
        this.service = new NutritionService();
        this.nutritionSummary = document.getElementById('nutritionSummary');
        this.mealsList = document.getElementById('mealsList');
        this.loadMore = document.getElementById('loadMore');
        this.initialize();
    }

    async initialize() {
        console.log('Initializing main screen...');
        try {
            await this.loadContent();
            this.setupInfiniteScroll();
        } catch (error) {
            console.error('Error initializing main screen:', error);
        }
    }

    async loadContent() {
        console.log('Loading content...');
        const settings = await this.service.getSettings();
        console.log('Settings loaded:', settings);
        
        const meals = await this.service.getMealHistory(new Date());
        console.log('Meals loaded:', meals);
        
        const totals = this.service.getDailyTotals(meals);
        console.log('Totals calculated:', totals);
        
        this.renderNutritionSummary(totals, settings);
        this.renderMealsList(meals);
    }

    renderNutritionSummary(totals, settings) {
        console.log('Rendering nutrition summary...');
        this.nutritionSummary.innerHTML = `
            <div class="nutrient-card">
                <h3>Calories</h3>
                <div class="progress-bar">
                    <div class="progress" style="width: ${(totals.calories / settings.caloriesGoal * 100)}%"></div>
                </div>
                <p>${totals.calories} / ${settings.caloriesGoal}</p>
            </div>
            ${this.renderNutrientCard('Fats', totals.fats, settings.fatsGoal)}
            ${this.renderNutrientCard('Protein', totals.protein, settings.proteinGoal)}
            ${this.renderNutrientCard('Carbs', totals.carbs, settings.carbsGoal)}
        `;
    }

    renderNutrientCard(name, value, goal) {
        if (!goal) return '';
        return `
            <div class="nutrient-card">
                <h3>${name}</h3>
                <div class="progress-bar">
                    <div class="progress" style="width: ${(value / goal * 100)}%"></div>
                </div>
                <p>${value?.toFixed(1) || 0}g / ${goal}g</p>
            </div>
        `;
    }

    renderMealsList(meals) {
        console.log('Rendering meals list...');
        if (meals.length === 0) {
            this.mealsList.innerHTML = '<p>No meals recorded today</p>';
            return;
        }

        this.mealsList.innerHTML = meals.map(meal => `
            <div class="meal-entry">
                <div class="meal-header">
                    <span class="meal-time">${new Date(meal.date).toLocaleTimeString()}</span>
                    <span class="meal-total">${meal.totalCalories} cal</span>
                </div>
                <div class="meal-details">
                    ${meal.products.map(p => `
                        <div class="product-line">
                            <span>${p.productName}</span>
                            <span>${p.grams}g</span>
                            <span>${p.calories} cal</span>
                        </div>
                    `).join('')}
                </div>
                <div class="meal-nutrients">
                    <span>F: ${meal.totalFats}g</span>
                    <span>P: ${meal.totalProtein}g</span>
                    <span>C: ${meal.totalCarbs}g</span>
                </div>
            </div>
        `).join('');
    }

    setupInfiniteScroll() {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                this.loadMoreMeals();
            }
        });
        observer.observe(this.loadMore);
    }

    async loadMoreMeals() {
        const currentMeals = document.querySelectorAll('.meal-entry').length;
        const newMeals = await this.service.getMealHistory(new Date(), 10, currentMeals);
        
        if (newMeals.length === 0) {
            this.loadMore.style.display = 'none';
            return;
        }

        const newMealsHtml = newMeals.map(meal => `
            <div class="meal-entry">
                <div class="meal-header">
                    <span class="meal-time">${new Date(meal.date).toLocaleTimeString()}</span>
                    <span class="meal-total">${meal.totalCalories} cal</span>
                </div>
                <div class="meal-details">
                    ${meal.products.map(p => `
                        <div class="product-line">
                            <span>${p.productName}</span>
                            <span>${p.grams}g</span>
                            <span>${p.calories} cal</span>
                        </div>
                    `).join('')}
                </div>
                <div class="meal-nutrients">
                    <span>F: ${meal.totalFats}g</span>
                    <span>P: ${meal.totalProtein}g</span>
                    <span>C: ${meal.totalCarbs}g</span>
                </div>
            </div>
        `).join('');

        this.mealsList.insertAdjacentHTML('beforeend', newMealsHtml);
    }
}

// Initialize the screen
const mainScreen = new MainScreen(); 