const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const mealsContainer = document.getElementById('meals-container');
const loader = document.querySelector('.loader');
const errorMessage = document.querySelector('.error-message');
const recipeModal = document.getElementById('recipe-modal');
const recipeDetails = document.getElementById('recipe-details');
const closeModal = document.querySelector('.close-modal');

const API_BASE_URL = 'https://www.themealdb.com/api/json/v1/1';

window.addEventListener('DOMContentLoaded', () => {
    fetchRandomMeals();
});

searchButton.addEventListener('click', handleSearch);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSearch();
    }
});
closeModal.addEventListener('click', () => {
    recipeModal.style.display = 'none';
    document.body.style.overflow = 'auto';
});
window.addEventListener('click', (e) => {
    if (e.target === recipeModal) {
        recipeModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
});

function showLoader() {
    loader.style.display = 'block';
    mealsContainer.innerHTML = '';
    errorMessage.style.display = 'none';
}

function hideLoader() {
    loader.style.display = 'none';
}

function showError() {
    errorMessage.style.display = 'block';
}

function hideError() {
    errorMessage.style.display = 'none';
}

async function fetchRandomMeals() {
    showLoader();
    const meals = [];
    
    try {
        for (let i = 0; i < 8; i++) {
            const response = await fetch(`${API_BASE_URL}/random.php`);
            if (!response.ok) throw new Error('Error al obtener datos');
            
            const data = await response.json();
            if (data.meals && data.meals.length > 0) {
                if (!meals.some(meal => meal.idMeal === data.meals[0].idMeal)) {
                    meals.push(data.meals[0]);
                } else {
                    i--; 
                }
            }
        }
        
        displayMeals(meals);
        hideLoader();
    } catch (error) {
        console.error('Error:', error);
        hideLoader();
        showError();
    }
}

async function handleSearch() {
    const searchTerm = searchInput.value.trim();
    if (!searchTerm) return;
    
    showLoader();
    
    try {
        const response = await fetch(`${API_BASE_URL}/search.php?s=${searchTerm}`);
        if (!response.ok) throw new Error('Error en la búsqueda');
        
        const data = await response.json();
        
        if (data.meals && data.meals.length > 0) {
            displayMeals(data.meals);
            hideError();
        } else {
            mealsContainer.innerHTML = '';
            showError();
        }
        
        hideLoader();
    } catch (error) {
        console.error('Error:', error);
        hideLoader();
        showError();
    }
}

function displayMeals(meals) {
    mealsContainer.innerHTML = '';
    
    meals.forEach(meal => {
        const mealCard = document.createElement('div');
        mealCard.className = 'meal-card';
        
        mealCard.innerHTML = `
            <img src="${meal.strMealThumb}" alt="${meal.strMeal}" class="meal-image">
            <div class="meal-info">
                <h2 class="meal-title">${meal.strMeal}</h2>
                <span class="meal-category">${meal.strCategory}</span>
                <p>Origen: ${meal.strArea || 'No especificado'}</p>
                <div class="meal-details">
                    <button class="view-recipe-btn" data-id="${meal.idMeal}">Ver Receta</button>
                </div>
            </div>
        `;
        
        mealsContainer.appendChild(mealCard);
        
        const viewRecipeBtn = mealCard.querySelector('.view-recipe-btn');
        viewRecipeBtn.addEventListener('click', () => {
            fetchAndShowRecipeDetails(meal.idMeal);
        });
    });
}

async function fetchAndShowRecipeDetails(mealId) {
    try {
        const response = await fetch(`${API_BASE_URL}/lookup.php?i=${mealId}`);
        if (!response.ok) throw new Error('Error al obtener detalles');
        
        const data = await response.json();
        if (data.meals && data.meals.length > 0) {
            showRecipeModal(data.meals[0]);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function showRecipeModal(meal) {
    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
        const ingredient = meal[`strIngredient${i}`];
        const measure = meal[`strMeasure${i}`];
        
        if (ingredient && ingredient.trim() !== '') {
            ingredients.push({
                name: ingredient,
                measure: measure || ''
            });
        }
    }
    
    recipeDetails.innerHTML = `
        <div class="recipe-header">
            <img src="${meal.strMealThumb}" alt="${meal.strMeal}" class="recipe-image">
            <h2 class="recipe-title">${meal.strMeal}</h2>
            <div class="recipe-meta">
                <span>${meal.strCategory}</span>
                <span>${meal.strArea}</span>
                ${meal.strTags ? meal.strTags.split(',').map(tag => `<span>${tag.trim()}</span>`).join('') : ''}
            </div>
        </div>
        
        <div class="recipe-section">
            <h3>Ingredientes</h3>
            <ul class="ingredients-list">
                ${ingredients.map(ing => `<li>${ing.measure} ${ing.name}</li>`).join('')}
            </ul>
        </div>
        
        <div class="recipe-section">
            <h3>Instrucciones</h3>
            <div class="instructions">
                ${meal.strInstructions}
            </div>
        </div>
        
        ${meal.strYoutube ? `
        <div class="recipe-section">
            <h3>Video Tutorial</h3>
            <p><a href="${meal.strYoutube}" target="_blank">Ver en YouTube</a></p>
        </div>
        ` : ''}
    `;
    
    recipeModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}