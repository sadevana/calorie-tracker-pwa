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
        } catch (error) {
            console.error('Error initializing main screen:', error);
        }
    }

    async loadContent() {
        console.log('Loading content...');
        const settings = await this.service.getSettings();
        console.log('Settings loaded:', settings);
        
        const allMeals = await this.service.getMealHistory();
        console.log('Meals loaded:', allMeals);
        
        const todayMeals = allMeals.filter(m => 
            m.date === new Date().toISOString().split('T')[0]
        );
        const totals = this.service.getDailyTotals(todayMeals);
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
                    <div class="progress" style="width: ${(totals.calories / settings.targetCalories * 100)}%"></div>
                </div>
                <p>${totals.calories} / ${settings.targetCalories}</p>
            </div>
            ${this.renderNutrientCard('Fats', totals.fats, settings.targetFat)}
            ${this.renderNutrientCard('Protein', totals.protein, settings.targetProtein)}
            ${this.renderNutrientCard('Carbs', totals.carbs, settings.targetCarbs)}
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
                                <span>F: ${meal.totalFat}g</span>
                                <span>P: ${meal.totalProtein}g</span>
                                <span>C: ${meal.totalCarbs}g</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }).join('');
    }
}

// Initialize the screen
const mainScreen = new MainScreen(); 