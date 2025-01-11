class SettingsScreen {
    constructor() {
        this.service = new NutritionService();
        this.form = document.getElementById('settingsForm');
        this.initialize();
    }

    async initialize() {
        await this.loadSettings();
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    async loadSettings() {
        const settings = await this.service.getSettings();
        document.getElementById('caloriesGoal').value = settings.targetCalories;
        document.getElementById('fatsGoal').value = settings.targetFat || '';
        document.getElementById('proteinGoal').value = settings.targetProtein || '';
        document.getElementById('carbsGoal').value = settings.targetCarbs || '';
    }

    async handleSubmit(event) {
        event.preventDefault();
        try {
            const settings = {
                caloriesGoal: document.getElementById('caloriesGoal').value,
                fatsGoal: document.getElementById('fatsGoal').value || null,
                proteinGoal: document.getElementById('proteinGoal').value || null,
                carbsGoal: document.getElementById('carbsGoal').value || null
            };
            console.log(settings);
            await this.service.saveSettings(settings);
            window.location.href = 'index.html';
        } catch (error) {
            alert(error.message);
        }
    }
}

// Initialize the screen
const settingsScreen = new SettingsScreen(); 