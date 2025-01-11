import { NutritionService } from '../services/nutritionService.mjs';

/** @typedef {import('../services/nutritionService.mjs').Product} Product */

class AddMealScreen {
    constructor() {
        this.service = new NutritionService();
        this.searchInput = /** @type {HTMLInputElement} */ (document.getElementById('productSearch'));
        this.searchResults = /** @type {HTMLDivElement} */ (document.getElementById('searchResults'));
        this.selectedProducts = /** @type {HTMLDivElement} */ (document.getElementById('selectedProducts'));
        this.submitButton = /** @type {HTMLButtonElement} */ (document.getElementById('submitMeal'));
        this.initialize();
    }

    initialize() {
        this.searchInput.addEventListener('input', () => this.handleSearch());
        this.submitButton.addEventListener('click', () => this.handleSubmit());
    }

    async handleSearch() {
        const query = this.searchInput.value;
        if (!query) {
            this.searchResults.innerHTML = '';
            return;
        }

        const products = await this.service.searchProducts(query);
        this.searchResults.innerHTML = products.map(product => `
            <div class="search-result" onclick="addMealScreen.addProduct(${JSON.stringify(product).replace(/"/g, '&quot;')})">
                <div class="product-name">${product.name}</div>
                <div class="product-nutrients">
                    <span>${product.calories} cal</span>
                    <span>F: ${product.fat}g</span>
                    <span>P: ${product.protein}g</span>
                    <span>C: ${product.carbs}g</span>
                </div>
            </div>
        `).join('');
    }

    /**
     * @param {Product} product
     */
    addProduct(product) {
        const productId = `meal-product-${product.id}`;
        
        if (document.getElementById(productId)) {
            return;
        }

        const productElement = document.createElement('div');
        productElement.id = productId;
        productElement.className = 'selected-product';
        productElement.innerHTML = `
            <div class="product-info">
                <div class="product-name">${product.name}</div>
                <input type="number" placeholder="Grams" class="grams-input" 
                       onchange="addMealScreen.updateNutrients(this, ${JSON.stringify(product).replace(/"/g, '&quot;')})">
                <div class="product-nutrients"></div>
            </div>
            <button onclick="this.parentElement.remove()">Remove</button>
        `;

        this.selectedProducts.appendChild(productElement);
        this.searchInput.value = '';
        this.searchResults.innerHTML = '';
    }

    /**
     * @param {HTMLInputElement} input
     * @param {Product} product
     */
    updateNutrients(input, product) {
        const grams = parseFloat(input.value);
        if (isNaN(grams) || grams <= 0) {
            input.value = '';
            /** @type {HTMLDivElement} */ (input.parentElement.querySelector('.product-nutrients')).innerHTML = '';
            return;
        }
        
        const calories = this.service.calculateNutrient(product.calories, grams);
        const fats = this.service.calculateNutrient(product.fat, grams);
        const protein = this.service.calculateNutrient(product.protein, grams);
        const carbs = this.service.calculateNutrient(product.carbs, grams);

        /** @type {HTMLDivElement} */ (input.parentElement.querySelector('.product-nutrients')).innerHTML = `
            <span>${calories} cal</span>
            <span>F: ${fats}g</span>
            <span>P: ${protein}g</span>
            <span>C: ${carbs}g</span>
        `;
    }

    async handleSubmit() {
        const products = Array.from(this.selectedProducts.children).map(el => {
            const productId = el.id.replace('meal-product-', '');
            const input = /** @type {HTMLInputElement} */ (el.querySelector('.grams-input'));
            const grams = parseFloat(input.value);
            return { productId, grams };
        });

        if (products.length === 0) {
            alert('Please add at least one product to the meal');
            return;
        }

        try {
            await this.service.addMeal(products);
            window.location.href = 'index.html';
        } catch (error) {
            alert(error.message);
        }
    }
}

// Initialize the screen and expose it globally for event handlers
/** @type {any} */
const w = window;
w.addMealScreen = new AddMealScreen(); 