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
        
        // Get meals for the last 7 days
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 6);
        
        const allMeals = [];
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const meals = await this.service.getMealHistory(new Date(d));
            if (meals && meals.length > 0) {
                allMeals.push(...meals);
            }
        }
        console.log('Meals loaded:', allMeals);
        
        const totals = this.service.getDailyTotals(allMeals.filter(m => 
            m.date === endDate.toISOString().split('T')[0]
        ));
        console.log('Totals calculated:', totals);
        
        this.renderNutritionSummary(totals, settings);
        this.renderMealsList(allMeals);
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
            this.mealsList.innerHTML = '<p>No meals recorded</p>';
            return;
        }

        // Group meals by date
        const mealsByDate = meals.reduce((groups, meal) => {
            const date = meal.date;
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(meal);
            return groups;
        }, {});

        // Sort dates in descending order
        const sortedDates = Object.keys(mealsByDate).sort().reverse();

        this.mealsList.innerHTML = sortedDates.map(date => {
            const dayMeals = mealsByDate[date];
            const dayTotals = this.service.getDailyTotals(dayMeals);
            const dateObj = new Date(date);
            const isToday = date === new Date().toISOString().split('T')[0];
            const dateDisplay = isToday ? 'Today' : dateObj.toLocaleDateString();

            return `
                <div class="day-group">
                    <div class="day-header">
                        <h3>${dateDisplay}</h3>
                        <div class="day-totals">
                            <span>${dayTotals.calories} cal</span>
                            <span>F: ${dayTotals.fats}g</span>
                            <span>P: ${dayTotals.protein}g</span>
                            <span>C: ${dayTotals.carbs}g</span>
                        </div>
                    </div>
                    ${dayMeals.map(meal => `
                        <div class="meal-entry">
                            <div class="meal-header">
                                <span class="meal-time">${new Date(meal.timestamp).toLocaleTimeString()}</span>
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
                    `).join('')}
                </div>
            `;
        }).join('');
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