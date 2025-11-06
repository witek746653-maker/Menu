const searchInput = document.getElementById('searchInput');
const menuChips = document.getElementById('menuChips');
const allergenChips = document.getElementById('allergenChips');
const tagChips = document.getElementById('tagChips');
const cardsContainer = document.getElementById('cards');
const resultsCount = document.getElementById('resultsCount');
const emptyState = document.getElementById('emptyState');
const toggleEditBtn = document.getElementById('toggleEdit');
const addDishBtn = document.getElementById('addDishBtn');
const refreshBtn = document.getElementById('refreshBtn');
const editor = document.getElementById('editor');
const editorForm = document.getElementById('editorForm');
const editorTitle = document.getElementById('editorTitle');
const closeEditorBtn = document.getElementById('closeEditor');
const saveDishBtn = document.getElementById('saveDish');
const deleteDishBtn = document.getElementById('deleteDish');
const toast = document.getElementById('toast');

const state = {
  dishes: [],
  filtered: [],
  fuse: null,
  filters: {
    query: '',
    menus: new Set(),
    allergens: new Set(),
    tags: new Set()
  },
  editMode: false,
  editingId: null,
  serverAvailable: true
};

let toastTimeout = null;
let isSaving = false;

const fuseOptions = {
  keys: [
    'name',
    'menu',
    'category',
    'description',
    'ingredients',
    'allergens',
    'pairings.wines',
    'pairings.dishes',
    'pairings.notes',
    'tags'
  ],
  threshold: 0.35,
  ignoreLocation: true,
  minMatchCharLength: 2
};

function normalize(value) {
  return (value || '').toString().trim().toLowerCase();
}

function debounce(fn, wait = 200) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), wait);
  };
}

function showToast(message, isError = false) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.remove('error', 'success');
  toast.classList.add(isError ? 'error' : 'success');
  toast.classList.add('show');

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 3200);
}

function setEditAvailability(available) {
  state.serverAvailable = available;
  toggleEditBtn.disabled = !available;
  addDishBtn.disabled = !available;
  deleteDishBtn.disabled = !available;
  saveDishBtn.disabled = !available;

  if (!available && state.editMode) {
    state.editMode = false;
    document.body.classList.remove('edit-mode');
    toggleEditBtn.textContent = 'Включить редактирование';
    closeEditorPanel();
  }

  if (!available) {
    showToast('Редактирование недоступно: нет соединения с API.', true);
  }
}

async function loadData(showMessage = false) {
  refreshBtn.disabled = true;
  refreshBtn.textContent = 'Обновляем...';

  try {
    const response = await fetch('../api/dishes', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    const data = await response.json();
    state.dishes = Array.isArray(data) ? data : [];
    rebuildFuse();
    rebuildFilters();
    applyFilters();
    setEditAvailability(true);
    if (showMessage) {
      showToast('Данные обновлены.');
    }
  } catch (error) {
    console.error(error);
    try {
      const fallback = await fetch('../data/menu-database.json', { cache: 'no-store' });
      const data = await fallback.json();
      state.dishes = Array.isArray(data) ? data : [];
      rebuildFuse();
      rebuildFilters();
      applyFilters();
      setEditAvailability(false);
      showToast('Показаны данные из файла. Для сохранения изменений запустите сервер API.', true);
    } catch (fallbackError) {
      console.error(fallbackError);
      cardsContainer.innerHTML = '';
      resultsCount.textContent = '0 позиций';
      emptyState.style.display = 'block';
      setEditAvailability(false);
      showToast('Не удалось загрузить данные.', true);
    }
  } finally {
    refreshBtn.disabled = false;
    refreshBtn.textContent = 'Обновить данные';
  }
}

function rebuildFuse() {
  state.fuse = new Fuse(state.dishes, fuseOptions);
}

function uniqueValues(getter) {
  const values = new Map();
  state.dishes.forEach((dish) => {
    const items = getter(dish);
    items.forEach((item) => {
      const norm = normalize(item);
      if (!norm || values.has(norm)) return;
      values.set(norm, item);
    });
  });
  return Array.from(values.entries()).sort((a, b) => a[1].localeCompare(b[1], 'ru'));
}

function buildChipGroup(container, entries, selectedSet) {
  const existingSelections = new Set(selectedSet);
  container.innerHTML = '';

  const normalizedAvailable = new Set(entries.map(([norm]) => norm));
  selectedSet.clear();
  existingSelections.forEach((value) => {
    if (normalizedAvailable.has(value)) {
      selectedSet.add(value);
    }
  });

  entries.forEach(([norm, label]) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    chip.textContent = label;
    chip.dataset.value = norm;
    if (selectedSet.has(norm)) {
      chip.classList.add('active');
    }
    chip.addEventListener('click', () => {
      if (selectedSet.has(norm)) {
        selectedSet.delete(norm);
        chip.classList.remove('active');
      } else {
        selectedSet.add(norm);
        chip.classList.add('active');
      }
      applyFilters();
    });
    container.appendChild(chip);
  });
}

function rebuildFilters() {
  const menuEntries = uniqueValues((dish) => dish.menu ? [dish.menu] : []);
  buildChipGroup(menuChips, menuEntries, state.filters.menus);

  const allergenEntries = uniqueValues((dish) => Array.isArray(dish.allergens) ? dish.allergens : []);
  buildChipGroup(allergenChips, allergenEntries, state.filters.allergens);

  const tagEntries = uniqueValues((dish) => Array.isArray(dish.tags) ? dish.tags : []);
  buildChipGroup(tagChips, tagEntries, state.filters.tags);
}

function matchesFilters(dish) {
  const menuMatch = !state.filters.menus.size || state.filters.menus.has(normalize(dish.menu));
  if (!menuMatch) return false;

  if (state.filters.allergens.size) {
    const dishAllergens = (dish.allergens || []).map(normalize);
    for (const allergen of state.filters.allergens) {
      if (!dishAllergens.includes(allergen)) {
        return false;
      }
    }
  }

  if (state.filters.tags.size) {
    const dishTags = (dish.tags || []).map(normalize);
    for (const tag of state.filters.tags) {
      if (!dishTags.includes(tag)) {
        return false;
      }
    }
  }

  return true;
}

function applyFilters() {
  const query = state.filters.query;
  let results;

  if (query) {
    const fuseResults = state.fuse.search(query);
    const seen = new Set();
    results = [];
    fuseResults.forEach(({ item }) => {
      if (seen.has(item.id)) return;
      if (matchesFilters(item)) {
        seen.add(item.id);
        results.push(item);
      }
    });
  } else {
    results = state.dishes.filter(matchesFilters);
  }

  state.filtered = results;
  renderCards(results);
  resultsCount.textContent = results.length ? `${results.length} позиций` : '0 позиций';
  emptyState.style.display = results.length ? 'none' : 'block';
}

function renderCards(dishes) {
  cardsContainer.innerHTML = '';
  dishes.forEach((dish) => {
    const card = document.createElement('article');
    card.className = 'card';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'edit-btn';
    editBtn.setAttribute('aria-label', `Редактировать «${dish.name}»`);
    editBtn.textContent = '✎';
    editBtn.addEventListener('click', () => openEditor(dish.id));
    card.appendChild(editBtn);

    const menuTag = document.createElement('div');
    menuTag.className = 'menu-tag';
    menuTag.textContent = dish.menu || 'Без меню';
    card.appendChild(menuTag);

    const title = document.createElement('h3');
    title.textContent = dish.name || 'Без названия';
    card.appendChild(title);

    if (dish.category) {
      const category = document.createElement('div');
      category.className = 'category';
      category.textContent = dish.category;
      card.appendChild(category);
    }

    if (dish.description) {
      const description = document.createElement('p');
      description.textContent = dish.description;
      card.appendChild(description);
    }

    const ingredients = Array.isArray(dish.ingredients) ? dish.ingredients : [];
    if (ingredients.length) {
      card.appendChild(createListBlock('Ингредиенты', ingredients));
    }

    const allergens = Array.isArray(dish.allergens) ? dish.allergens : [];
    if (allergens.length) {
      card.appendChild(createListBlock('Аллергены', allergens));
    }

    const pairings = dish.pairings || {};
    const pairingItems = [];
    if (Array.isArray(pairings.wines) && pairings.wines.length) {
      pairingItems.push({ label: 'Вина', items: pairings.wines });
    }
    if (Array.isArray(pairings.dishes) && pairings.dishes.length) {
      pairingItems.push({ label: 'Блюда', items: pairings.dishes });
    }
    if (pairings.notes) {
      pairingItems.push({ label: 'Комментарий', items: [pairings.notes] });
    }
    if (pairingItems.length) {
      const block = document.createElement('div');
      block.className = 'meta-block';
      const title = document.createElement('strong');
      title.textContent = 'Пары и рекомендации';
      block.appendChild(title);
      pairingItems.forEach(({ label, items }) => {
        const labelEl = document.createElement('div');
        labelEl.style.fontSize = '13px';
        labelEl.style.color = 'var(--muted)';
        labelEl.style.marginTop = '4px';
        labelEl.textContent = label;
        block.appendChild(labelEl);
        const ul = document.createElement('ul');
        items.forEach((item) => {
          const li = document.createElement('li');
          li.textContent = item;
          ul.appendChild(li);
        });
        block.appendChild(ul);
      });
      card.appendChild(block);
    }

    const tags = Array.isArray(dish.tags) ? dish.tags : [];
    if (tags.length) {
      const tagsWrap = document.createElement('div');
      tagsWrap.className = 'tags';
      tags.forEach((tag) => {
        const tagEl = document.createElement('span');
        tagEl.className = 'tag';
        tagEl.textContent = tag;
        tagsWrap.appendChild(tagEl);
      });
      card.appendChild(tagsWrap);
    }

    cardsContainer.appendChild(card);
  });
}

function createListBlock(title, items) {
  const block = document.createElement('div');
  block.className = 'meta-block';
  const heading = document.createElement('strong');
  heading.textContent = title;
  block.appendChild(heading);
  const ul = document.createElement('ul');
  items.forEach((item) => {
    const li = document.createElement('li');
    li.textContent = item;
    ul.appendChild(li);
  });
  block.appendChild(ul);
  return block;
}

function openEditor(id = null) {
  if (!state.serverAvailable) {
    showToast('Редактирование недоступно без запущенного сервера.', true);
    return;
  }

  if (id) {
    const dish = state.dishes.find((item) => item.id === id);
    if (!dish) return;
    state.editingId = id;
    editorTitle.textContent = `Редактирование — ${dish.name}`;
    editorForm.menu.value = dish.menu || '';
    editorForm.category.value = dish.category || '';
    editorForm.name.value = dish.name || '';
    editorForm.description.value = dish.description || '';
    editorForm.ingredients.value = (dish.ingredients || []).join(', ');
    editorForm.allergens.value = (dish.allergens || []).join(', ');
    editorForm.pairDishes.value = (dish.pairings?.dishes || []).join(', ');
    editorForm.pairWines.value = (dish.pairings?.wines || []).join(', ');
    editorForm.pairNotes.value = dish.pairings?.notes || '';
    editorForm.tags.value = (dish.tags || []).join(', ');
    deleteDishBtn.style.display = 'inline-flex';
  } else {
    state.editingId = null;
    editorTitle.textContent = 'Новая позиция';
    editorForm.reset();
    deleteDishBtn.style.display = 'none';
  }

  editor.classList.add('open');
  editor.setAttribute('aria-hidden', 'false');
}

function closeEditorPanel() {
  editor.classList.remove('open');
  editor.setAttribute('aria-hidden', 'true');
  state.editingId = null;
}

function parseList(value) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function generateId(name, menu) {
  const base = normalize(`${menu}-${name}`).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  let candidate = base || `dish-${Date.now()}`;
  let attempt = 1;
  while (state.dishes.some((dish) => dish.id === candidate)) {
    candidate = `${base}-${attempt++}`;
  }
  return candidate;
}

async function persistChanges(successMessage) {
  if (!state.serverAvailable) {
    showToast('Сервер недоступен. Запустите server.py, чтобы сохранять изменения.', true);
    return false;
  }

  if (isSaving) return false;
  isSaving = true;
  saveDishBtn.disabled = true;
  saveDishBtn.textContent = 'Сохраняем…';
  try {
    const response = await fetch('../api/dishes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(state.dishes, null, 2)
    });
    if (!response.ok) {
      throw new Error(`Save failed: ${response.status}`);
    }
    showToast(successMessage || 'Изменения сохранены.');
    return true;
  } catch (error) {
    console.error(error);
    showToast('Не удалось сохранить изменения.', true);
    setEditAvailability(false);
    return false;
  } finally {
    isSaving = false;
    saveDishBtn.disabled = false;
    saveDishBtn.textContent = 'Сохранить';
  }
}

async function handleSave() {
  const form = new FormData(editorForm);
  const menu = (form.get('menu') || '').trim();
  const category = (form.get('category') || '').trim();
  const name = (form.get('name') || '').trim();

  if (!menu || !category || !name) {
    showToast('Заполните меню, категорию и название.', true);
    return;
  }

  const payload = {
    menu,
    category,
    name,
    description: (form.get('description') || '').trim(),
    ingredients: parseList(form.get('ingredients') || ''),
    allergens: parseList(form.get('allergens') || ''),
    pairings: {
      dishes: parseList(form.get('pairDishes') || ''),
      wines: parseList(form.get('pairWines') || ''),
      notes: (form.get('pairNotes') || '').trim()
    },
    tags: parseList(form.get('tags') || '')
  };

  if (!payload.pairings.notes) {
    delete payload.pairings.notes;
  }

  if (state.editingId) {
    payload.id = state.editingId;
    const index = state.dishes.findIndex((dish) => dish.id === state.editingId);
    if (index !== -1) {
      state.dishes[index] = payload;
    }
  } else {
    payload.id = generateId(payload.name, payload.menu);
    state.dishes.push(payload);
  }

  rebuildFuse();
  rebuildFilters();
  applyFilters();
  const success = await persistChanges(state.editingId ? 'Позиция обновлена.' : 'Позиция добавлена.');
  if (success) {
    closeEditorPanel();
  }
}

async function handleDelete() {
  if (!state.editingId) return;
  if (!confirm('Удалить эту позицию?')) return;
  const index = state.dishes.findIndex((dish) => dish.id === state.editingId);
  if (index === -1) return;
  state.dishes.splice(index, 1);
  rebuildFuse();
  rebuildFilters();
  applyFilters();
  const success = await persistChanges('Позиция удалена.');
  if (success) {
    closeEditorPanel();
  }
}

const handleSearch = debounce((event) => {
  state.filters.query = event.target.value.trim();
  applyFilters();
}, 200);

searchInput.addEventListener('input', handleSearch);

toggleEditBtn.addEventListener('click', () => {
  if (!state.serverAvailable) {
    showToast('Редактирование недоступно без запущенного server.py.', true);
    return;
  }
  state.editMode = !state.editMode;
  document.body.classList.toggle('edit-mode', state.editMode);
  toggleEditBtn.textContent = state.editMode ? 'Выключить редактирование' : 'Включить редактирование';
  if (!state.editMode) {
    closeEditorPanel();
  }
});

addDishBtn.addEventListener('click', () => {
  if (!state.serverAvailable) {
    showToast('Редактирование недоступно без запущенного server.py.', true);
    return;
  }
  if (!state.editMode) {
    state.editMode = true;
    document.body.classList.add('edit-mode');
    toggleEditBtn.textContent = 'Выключить редактирование';
  }
  openEditor(null);
});

refreshBtn.addEventListener('click', () => loadData(true));

closeEditorBtn.addEventListener('click', () => {
  closeEditorPanel();
});

saveDishBtn.addEventListener('click', handleSave);

deleteDishBtn.addEventListener('click', handleDelete);

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && editor.classList.contains('open')) {
    closeEditorPanel();
  }
});

loadData();