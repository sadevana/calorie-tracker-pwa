import { NutritionService } from '../services/nutritionService.mjs';
import { getTypedElementById } from '../utils/html.mjs';

class AddProductScreen {
    /** @type {NutritionService} */ service;
    /** @type {HTMLInputElement} */ productName;
    /** @type {HTMLInputElement} */ calories;
    /** @type {HTMLInputElement} */ fats;
    /** @type {HTMLInputElement} */ protein;
    /** @type {HTMLInputElement} */ carbs;
    /** @type {HTMLFormElement} */ form;

    constructor() {
        this.service = new NutritionService();
        this.productName = getTypedElementById('productName');
        this.calories = getTypedElementById('calories');
        this.fats = getTypedElementById('fats');
        this.protein = getTypedElementById('protein');
        this.carbs = getTypedElementById('carbs');
        this.form = getTypedElementById('productForm');
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    async handleSubmit(event) {
        event.preventDefault();
        try {
            const product = {
                name: this.productName.value,
                calories: this.calories.value,
                fats: this.fats.value,
                protein: this.protein.value,
                carbs: this.carbs.value
            };

            await this.service.addProduct(product);
            window.location.href = 'index.html';
        } catch (error) {
            alert(error.message);
        }
    }
}


document.addEventListener('DOMContentLoaded', () => {
    const addProductScreen = new AddProductScreen();
});