class AddProductScreen {
    constructor() {
        this.service = new NutritionService();
        this.form = document.getElementById('productForm');
        this.initialize();
    }

    initialize() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    async handleSubmit(event) {
        event.preventDefault();
        try {
            const product = {
                name: document.getElementById('productName').value,
                calories: document.getElementById('calories').value,
                fats: document.getElementById('fats').value,
                protein: document.getElementById('protein').value,
                carbs: document.getElementById('carbs').value
            };

            await this.service.addProduct(product);
            window.location.href = 'index.html';
        } catch (error) {
            alert(error.message);
        }
    }
}

// Initialize the screen
const addProductScreen = new AddProductScreen(); 