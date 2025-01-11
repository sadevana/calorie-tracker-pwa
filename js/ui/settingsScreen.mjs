import { NutritionService } from '../services/nutritionService.mjs';
import { getTypedElementById } from '../utils/html.mjs';

class SettingsScreen {
    /** @type {NutritionService} */ service;
    /** @type {HTMLInputElement} */ caloriesTarget;
    /** @type {HTMLInputElement} */ fatsTarget;
    /** @type {HTMLInputElement} */ proteinTarget;
    /** @type {HTMLInputElement} */ carbsTarget;
    /** @type {HTMLFormElement} */ form;

    constructor() {
        this.service = new NutritionService();
        this.caloriesTarget = getTypedElementById('caloriesTarget');
        this.fatsTarget = getTypedElementById('fatsTarget');
        this.proteinTarget = getTypedElementById('proteinTarget');
        this.carbsTarget = getTypedElementById('carbsTarget');
        this.form = getTypedElementById('settingsForm');
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    async init() {
        const settings = await this.service.getSettings();
        if (!settings) {
            alert('No settings found. Please set your target values.');
            return;
        }
        this.caloriesTarget.value = String(settings.targetCalories);
        this.fatsTarget.value = settings.targetFat ? String(settings.targetFat) : '';
        this.proteinTarget.value = settings.targetProtein ? String(settings.targetProtein) : '';
        this.carbsTarget.value = settings.targetCarbs ? String(settings.targetCarbs) : '';
    }

    async handleSubmit(event) {
        event.preventDefault();
        try {
            const caloriesInput = this.caloriesTarget.value;
            const fatsInput = this.fatsTarget.value;
            const proteinInput = this.proteinTarget.value;
            const carbsInput = this.carbsTarget.value;

            const settings = {
                targetCalories: Number(caloriesInput),
                targetFat: fatsInput ? Number(fatsInput) : null,
                targetProtein: proteinInput ? Number(proteinInput) : null,
                targetCarbs: carbsInput ? Number(carbsInput) : null
            };
            console.log(settings);
            await this.service.saveSettings(settings);
            window.location.href = 'index.html';
        } catch (error) {
            alert(error.message);
        }
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const settingsScreen = new SettingsScreen();
    await settingsScreen.init();
});