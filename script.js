// DOM Elements
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const mobileNav = document.getElementById('mobileNav');
const menuIcon = mobileMenuToggle.querySelector('.menu-icon');
const closeIcon = mobileMenuToggle.querySelector('.close-icon');
const newsletterForm = document.getElementById('newsletterForm');
const searchInput = document.getElementById('searchInput');

// Mobile Menu Toggle
mobileMenuToggle.addEventListener('click', () => {
    const isOpen = !mobileNav.classList.contains('hidden');
    
    if (isOpen) {
        // Close menu
        mobileNav.classList.add('hidden');
        menuIcon.classList.remove('hidden');
        closeIcon.classList.add('hidden');
    } else {
        // Open menu
        mobileNav.classList.remove('hidden');
        menuIcon.classList.add('hidden');
        closeIcon.classList.remove('hidden');
    }
});

// Close mobile menu when clicking on nav links
const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
mobileNavLinks.forEach(link => {
    link.addEventListener('click', () => {
        mobileNav.classList.add('hidden');
        menuIcon.classList.remove('hidden');
        closeIcon.classList.add('hidden');
    });
});

// Animate elements on scroll
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in-up');
        }
    });
}, {
    threshold: 0.1
});

const elementsToAnimate = document.querySelectorAll('.section-header, .categories-grid, .recipes-grid, .newsletter-content, .story-grid, .mission-vision-grid, .team-grid, .cta-content, .contact-grid, .faq-list, .privacy-policy-content');
elementsToAnimate.forEach(el => observer.observe(el));





//bookmark wala section 

/* --------- BOOKMARK: server + local fallback --------- */

document.addEventListener('DOMContentLoaded', () => {
  const bookmarkButtons = document.querySelectorAll('.bookmark-btn');

  // Basic helper - slugify text for fallback recipe ids
  function slugify(text) {
    return text.toString().toLowerCase().trim()
      .replace(/\s+/g, '-')           // spaces to dashes
      .replace(/[^\w\-]+/g, '')       // remove non-word
      .replace(/\-\-+/g, '-');        // collapse dashes
  }

  // Check login using your api/profile.php; make sure cookies are sent
  async function isLoggedIn() {
    try {
      const res = await fetch('api/profile.php', { credentials: 'same-origin' });
      const data = await res.json();
      return data.success === true;
    } catch (e) {
      return false;
    }
  }

  // Toggle bookmark on server (returns {success: bool, action: 'added'|'removed', ...})
  async function toggleOnServer(payload) {
    const res = await fetch('api/bookmark_toggle.php', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  }

  // Fetch server bookmarks list
  async function fetchServerBookmarks() {
    const res = await fetch('api/bookmarks_list.php', { credentials: 'same-origin' });
    const data = await res.json();
    if (data.success) return data.bookmarks || [];
    return [];
  }

  // Render bookmarks from server into your #my-bookmarks-list (simple rendering)
  async function renderBookmarksFromServer() {
    const listEl = document.getElementById('my-bookmarks-list');
    const emptyStateEl = document.querySelector('.empty-state-text');
    listEl.innerHTML = '';

    const bookmarks = await fetchServerBookmarks();
    if (!bookmarks || bookmarks.length === 0) {
      if (emptyStateEl) emptyStateEl.style.display = 'block';
      return;
    }
    if (emptyStateEl) emptyStateEl.style.display = 'none';

    bookmarks.forEach(b => {
      const item = document.createElement('div');
      item.className = 'bookmark-item';
      item.innerHTML = `
        <a href="${b.url ?? '#'}" class="bookmark-link">
          <img src="${b.image_url ?? ''}" alt="${b.title ?? ''}" class="bookmark-thumb" />
          <div class="bookmark-info">
            <div class="bookmark-title">${b.title ?? 'Recipe'}</div>
            <div class="bookmark-meta">${new Date(b.created_at).toLocaleString()}</div>
          </div>
        </a>
        <button class="bookmark-remove-btn" data-bookmark-id="${b.id}">Remove</button>
      `;
      listEl.appendChild(item);

      // remove button calls toggle endpoint (server will delete)
      const removeBtn = item.querySelector('.bookmark-remove-btn');
      removeBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        // Reuse the toggle endpoint using recipe_id or URL
        const toggled = await toggleOnServer({ id: b.recipe_id, title: b.title, url: b.url, image: b.image_url });
        if (toggled.success) {
          await renderBookmarksFromServer();
          // update card button UI too
          const btn = document.querySelector(`.bookmark-btn[data-recipe-id="${b.recipe_id}"]`);
          if (btn) btn.classList.remove('bookmarked');
        } else {
          alert(toggled.message || 'Could not remove bookmark');
        }
      });
    });
  }

  // Assign data attribute fallback if not present and setup handlers
  bookmarkButtons.forEach(button => {
    const card = button.closest('.recipe-card');
    if (!card) return;

    // make sure recipe-card has a data-recipe-id (if not, set one)
    if (!card.dataset.recipeId) {
      const titleEl = card.querySelector('.recipe-title');
      const slug = titleEl ? slugify(titleEl.textContent) : 'r' + Math.random().toString(36).slice(2, 8);
      card.dataset.recipeId = slug;
    }
    // optionally set data-recipe-url if you have a link/href
    if (!card.dataset.recipeUrl) {
      const link = card.closest('a') ? card.closest('a').getAttribute('href') : null;
      if (link) card.dataset.recipeUrl = link;
    }

    const recipeId = card.dataset.recipeId;
    const titleEl = card.querySelector('.recipe-title');
    const title = titleEl ? titleEl.textContent : '';
    const imgEl = card.querySelector('.recipe-card-img');
    const image = imgEl ? imgEl.src : '';
    const url = card.dataset.recipeUrl ?? (card.querySelector('a') ? card.querySelector('a').href : '');

    // set dataset on button for convenience
    button.dataset.recipeId = recipeId;

    // initialize button state (server if logged in else local)
    (async () => {
      const logged = await isLoggedIn();
      if (logged) {
        const serverBookmarks = await fetchServerBookmarks();
        const isBookmarked = serverBookmarks.some(b => b.recipe_id === recipeId);
        if (isBookmarked) button.classList.add('bookmarked');
        else button.classList.remove('bookmarked');
      } else {
        // fallback to existing updateBookmarkButton(recipeId) if present
        if (typeof updateBookmarkButton === 'function') updateBookmarkButton(recipeId);
      }
    })();

    button.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const logged = await isLoggedIn();

      if (logged) {
        // toggle on server
        const result = await toggleOnServer({ id: recipeId, title, url, image });
        if (result.success) {
          if (result.action === 'added') button.classList.add('bookmarked');
          else button.classList.remove('bookmarked');
          await renderBookmarksFromServer();
        } else {
          alert(result.message || 'Could not toggle bookmark on server');
        }
      } else {
        // fallback to localStorage behavior (existing code)
        // The project already has getBookmarks(), saveBookmarks(), renderBookmarks() — reuse them
        const bookmarks = (typeof getBookmarks === 'function') ? getBookmarks() : [];
        const existingIndex = bookmarks.findIndex(r => r.id === recipeId);
        if (existingIndex >= 0) {
          // remove
          bookmarks.splice(existingIndex, 1);
          button.classList.remove('bookmarked');
        } else {
          // add
          bookmarks.push({ id: recipeId, title, img: image, url });
          button.classList.add('bookmarked');
        }
        if (typeof saveBookmarks === 'function') saveBookmarks(bookmarks);
        if (typeof renderBookmarks === 'function') renderBookmarks();
      }
    });
  });

  // On page load, render appropriate bookmark source
  (async () => {
    if (await isLoggedIn()) {
      await renderBookmarksFromServer();
    } else {
      if (typeof renderBookmarks === 'function') renderBookmarks();
    }
  })();

}); // DOMContentLoaded
/* --------- end BOOKMARK --------- */

















// A simple data source for your recipes
const recipesData = [
  {
    title: 'Butter Chicken',
    dietary: ['non-vegetarian'],
    meal: ['dinner', 'lunch'],
    category: ['indian']
  },
  {
     title: 'Dal Makhani',
    dietary: ['vegetarian'],
    meal: ['dinner', 'lunch'],
    category: ['indian']
  }
  ,
   {
     title: 'Palak Paneer',
    dietary: ['vegetarian'],
    meal: ['dinner', 'lunch'],
    category: ['indian']
  }
  ,
   {
     title: 'Vegetable Samosa',
    dietary: ['vegetarian','non-vegetarian'],
    meal: ['breakfast', 'snack'],
    category: ['indian']
  }
  ,
   {
     title: 'Hearty Red Lentil Soup',
    dietary: ['vegetarian'],
    meal: ['breakfast', 'snack'],
    category: ['mediterranean']
  }
  ,
  {
    title: 'Mediterranean Quinoa Salad',
    dietary: ['vegetarian', 'vegan', 'gluten-free'],
    meal: ['lunch', 'dinner'],
    category: ['mediterranean']
  },
  {
    title: 'Fluffy Almond Flour Pancakes',
    dietary: ['vegetarian', 'vegan', 'gluten-free'],
    meal: ['breakfast'],
    category: ['mediterranean']
  }
  ,
    {
    title: 'Zucchini Noodles with Pesto',
    dietary: ['vegetarian', 'vegan', 'gluten-free' , 'keto'],
    meal: ['lunch', 'dinner'],
    category: ['mediterranean']
  }
  ,
  {
  title: 'Grilled Salmon with Asparagus',
  dietary: ['pescatarian', 'gluten-free', 'keto'],
  meal: ['lunch', 'dinner'],
  category: ['american', 'mediterranean']
},
  {
  title: 'Keto Stuffed Bell Peppers',
  dietary: ['keto', 'gluten-free', 'low-carb'],
  meal: ['lunch', 'dinner'],
  category: ['american', 'mexican']
},
  {
  title: 'Cauliflower Crust Pizza',
  dietary: ['vegetarian', 'gluten-free', 'keto', 'low-carb'],
  meal: ['lunch', 'dinner'],
  category: ['italian']
},
{
  title: 'Avocado Chicken Salad',
  dietary: ['gluten-free', 'keto', 'paleo', 'low-carb'],
  meal: ['lunch', 'breakfast'],
  category: ['american']
},
  {
  title: 'Chicken Manchurian',
  dietary: ['non-vegetarian'],
  meal: ['lunch', 'dinner'],
  category: ['indo-chinese']
},
{
  title: 'Hakka Noodles',
  dietary: ['vegetarian', 'vegan'],
  meal: ['lunch', 'dinner'],
  category: ['indo-chinese']
},
{
  title: 'Gobi Manchurian',
  dietary: ['vegetarian', 'vegan'],
  meal: ['lunch', 'dinner'],
  category: ['indo-chinese']
},
{
  title: 'Chilli Paneer',
  dietary: ['vegetarian'],
  meal: ['lunch', 'dinner'],
  category: ['indo-chinese']
},
{
  title: 'Pork Gyoza Dumplings',
  dietary: ['non-vegetarian'],
  meal: ['lunch', 'dinner', 'snack'],
  category: ['japanese']
},
{
  title: 'Shrimp and Vegetable Tempura',
  dietary: ['non-vegetarian'],
  meal: ['lunch', 'dinner', 'snack'],
  category: ['japanese']
},
{
  title: 'Classic Miso Ramen',
  dietary: ['vegetarian', 'vegan'],
  meal: ['lunch', 'dinner'],
  category: ['japanese']
},
{
  title: 'Maki Sushi Rolls',
  dietary: ['non-vegetarian', 'vegetarian'],
  meal: ['lunch', 'dinner'],
  category: ['japanese']
},
{
  title: 'Classic Greek Salad',
  dietary: ['vegetarian', 'gluten-free', 'mediterranean'],
  meal: ['lunch', 'dinner'],
  category: ['greek', 'mediterranean']
},
{
  title: 'Homemade Tzatziki',
  dietary: ['vegetarian', 'gluten-free', 'mediterranean'],
  meal: ['appetizer', 'side'],
  category: ['greek', 'mediterranean']
},
{
  title: 'Crispy Falafel',
  dietary: ['vegetarian', 'vegan', 'mediterranean'],
  meal: ['lunch', 'dinner'],
  category: ['middle eastern', 'mediterranean']
},
{
  title: 'Creamy Roasted Red Pepper Hummus',
  dietary: ['vegetarian', 'vegan', 'gluten-free', 'mediterranean'],
  meal: ['appetizer', 'snack'],
  category: ['middle eastern', 'mediterranean']
},
{
  title: 'Vegan Thai Green Curry',
  dietary: ['vegan', 'vegetarian', 'gluten-free'],
  meal: ['lunch', 'dinner'],
  category: ['thai']
},
{
  title: 'Spicy Black Bean Burgers',
  dietary: ['vegan', 'vegetarian'],
  meal: ['lunch', 'dinner'],
  category: ['american', 'mexican']
},
{
  title: 'Lentil and Walnut Tacos',
  dietary: ['vegan', 'vegetarian', 'gluten-free'],
  meal: ['lunch', 'dinner'],
  category: ['mexican']
},
{
  title: 'Pasta with Roasted Vegetables',
  dietary: ['vegetarian'],
  meal: ['lunch', 'dinner'],
  category: ['italian']
},
{
  title: 'One-Pan Lemon Herb Chicken',
  dietary: ['gluten-free', 'low-carb'],
  meal: ['lunch', 'dinner'],
  category: ['american', 'mediterranean']
},
{
  title: '20-Minute Shrimp Scampi',
  dietary: ['pescatarian', 'gluten-free', 'low-carb'],
  meal: ['lunch', 'dinner'],
  category: ['italian', 'mediterranean']
},
{
  title: 'Easy Tofu Stir-Fry',
  dietary: ['vegan', 'vegetarian'],
  meal: ['lunch', 'dinner'],
  category: ['asian']
},
{
  title: 'Avocado Toast with Egg',
  dietary: ['vegetarian'],
  meal: ['breakfast', 'brunch'],
  category: ['american']
},
  {
    title: 'Aloo Gobi',
    dietary: ['vegetarian', 'vegan'],
    meal: ['dinner', 'lunch'],
    category: ['indian']
  },
  {
    title: 'Tofu Scramble',
    dietary: ['vegetarian', 'vegan'],
    meal: ['breakfast'],
    category: ['international']
  },
  {
    title: 'Chicken Biryani',
    dietary: ['non-vegetarian'],
    meal: ['dinner', 'lunch'],
    category: ['indian']
  },
  {
    title: 'Pav Bhaji',
    dietary: ['vegetarian', 'vegan'],
    meal: ['dinner', 'lunch'],
    category: ['indian']
  },
  // Add more recipe objects here
];



document.addEventListener('DOMContentLoaded', () => {
    // Check if we are on the recipes page and a search/filter was performed
    if (window.location.pathname.includes('recipes-all.html') && window.location.search) {
        const urlParams = new URLSearchParams(window.location.search);
        const query = urlParams.get('q')?.toLowerCase() || '';
        const dietary = urlParams.get('dietary') || '';
        const meal = urlParams.get('meal') || '';
        const categoryFilter = urlParams.get('category') || ''; // new: category/cuisine filter

        const allRecipes = document.querySelectorAll('.recipe-card');

        // First, hide or show individual recipe cards based on the search criteria
        allRecipes.forEach(recipe => {
            const recipeTitle = recipe.querySelector('.recipe-title')?.textContent.toLowerCase();

            const matchingData = recipesData.find(d => recipeTitle && d.title.toLowerCase() === recipeTitle);

            if (matchingData) {
                const matchesQuery = !query || matchingData.title.toLowerCase().includes(query);
                const matchesDietary = !dietary || (matchingData.dietary && matchingData.dietary.includes(dietary));
                const matchesMeal = !meal || (matchingData.meal && matchingData.meal.includes(meal));
                const matchesCategory = !categoryFilter || (matchingData.category && matchingData.category.includes(categoryFilter));

                if (matchesQuery && matchesDietary && matchesMeal && matchesCategory) {
                    recipe.style.display = 'block';
                } else {
                    recipe.style.display = 'none';
                }
            } else {
                recipe.style.display = 'none';
            }
        });

        // Second, check each category section and hide it if all its children are hidden
        const allCategories = document.querySelectorAll('.category-section');
        allCategories.forEach(category => {
            const recipesInThisCategory = category.querySelectorAll('.recipe-card');
            const hasVisibleRecipes = Array.from(recipesInThisCategory).some(recipe => recipe.style.display !== 'none');
            category.style.display = hasVisibleRecipes ? 'block' : 'none';
        });
    }

    // Event listener for the search button on the index page
    const searchButton = document.getElementById('searchButton');
    if (searchButton) {
        searchButton.addEventListener('click', () => {
            const searchInput = document.getElementById('searchInput').value.trim();
            const dietaryPreference = document.getElementById('dietaryPreference').value;
            const mealType = document.getElementById('mealType').value;

            // Construct the search URL
            const url = `recipes-all.html?q=${encodeURIComponent(searchInput)}&dietary=${encodeURIComponent(dietaryPreference)}&meal=${encodeURIComponent(mealType)}`;
            
            // Redirect the user to the recipes page
            window.location.href = url;
        });
    }

    // --- New: handle category cards click from index.html ---
    const categoryCards = document.querySelectorAll('.category-card');
    if (categoryCards.length) {
        const mealMap = {
            breakfast: 'breakfast',
            lunch: 'lunch',
            dinner: 'dinner',
            desserts: 'dessert',
            snacks: 'snack',
            drinks: 'drink'
        };

        categoryCards.forEach(card => {
            card.setAttribute('tabindex', '0');
            card.setAttribute('role', 'button');
            card.style.cursor = 'pointer';

            const goToCategory = () => {
                const raw = (card.dataset.category || '').toLowerCase();
                const meal = mealMap[raw];
                const url = meal
                    ? `recipes-all.html?meal=${encodeURIComponent(meal)}`
                    : `recipes-all.html?category=${encodeURIComponent(raw)}`;
                window.location.href = url;
            };

            card.addEventListener('click', goToCategory);
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    goToCategory();
                }
            });
        });
    }
});
