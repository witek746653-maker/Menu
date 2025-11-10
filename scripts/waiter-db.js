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
const dishModal = document.getElementById('dishModal');
const modalContent = document.getElementById('modalContent');
const modalCloseBtn = document.getElementById('modalClose');

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
let lastFocusedElement = null;

const fuseOptions = {
  keys: [
    'title',
    'menu',
    'section',
    'description',
    'contains',
    'features',
    'status',
    'source_file',
    'ingredients',
    'allergens',
    'pairings.wines',
    'pairings.drinks',
    'pairings.dishes',
    'pairings.notes',
    'tags',
    'i18n.en.title',
    'i18n.en.description'
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
    card.setAttribute('tabindex', '0');

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'edit-btn';
    const dishTitle = dish.title || 'Без названия';
    editBtn.setAttribute('aria-label', `Редактировать «${dishTitle}»`);
    editBtn.textContent = '✎';
    editBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      openEditor(dish.id);
    });
    card.appendChild(editBtn);

    const summary = document.createElement('div');
    summary.className = 'card-summary';

    if (dish.image?.src) {
      const figure = document.createElement('figure');
      figure.className = 'card-image';
      const img = document.createElement('img');
      img.src = dish.image.src;
      if (dish.image.alt) {
        img.alt = dish.image.alt;
      }
      figure.appendChild(img);
      if (dish.image.alt) {
        const caption = document.createElement('figcaption');
        caption.textContent = dish.image.alt;
        figure.appendChild(caption);
      }
      summary.appendChild(figure);
    }

    const menuTag = document.createElement('div');
    menuTag.className = 'menu-tag';
    menuTag.textContent = dish.menu || 'Без меню';
    summary.appendChild(menuTag);

    const title = document.createElement('h3');
    title.textContent = dishTitle;
    summary.appendChild(title);

    if (dish.section) {
      const section = document.createElement('div');
      section.className = 'section';
      section.textContent = dish.section;
      summary.appendChild(section);
    }

    if (dish.status) {
      const status = document.createElement('span');
      status.className = 'status-badge';
      status.textContent = dish.status;
      summary.appendChild(status);
    }

    card.appendChild(summary);

    const openModal = () => openDishModal(dish, card);

    card.addEventListener('click', (event) => {
      if (event.target.closest('.edit-btn')) return;
      openModal();
    });

    card.addEventListener('keydown', (event) => {
      if (event.target !== card) return;
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openModal();
      }
    });

    cardsContainer.appendChild(card);
  });
}

function buildModalBody(dish) {
  const body = document.createElement('div');
  body.className = 'modal-body';

  if (dish.description) {
    const description = document.createElement('p');
    description.className = 'modal-description';
    description.textContent = dish.description;
    body.appendChild(description);
  }

  if (dish.contains) {
    body.appendChild(createRichTextBlock('Подача / состав', dish.contains));
  }

  const ingredients = Array.isArray(dish.ingredients) ? dish.ingredients : [];
  if (ingredients.length) {
    body.appendChild(createListBlock('Ингредиенты', ingredients));
  }

  const allergens = Array.isArray(dish.allergens) ? dish.allergens : [];
  if (allergens.length) {
    body.appendChild(createListBlock('Аллергены', allergens));
  }

  const pairingBlock = createPairingsBlock(dish.pairings);
  if (pairingBlock) {
    body.appendChild(pairingBlock);
  }

  if (dish.features) {
    body.appendChild(createRichTextBlock('Особенности', dish.features));
  }

  if (dish.source_file) {
    const source = document.createElement('div');
    source.className = 'source-file';
    source.textContent = `Источник: ${dish.source_file}`;
    body.appendChild(source);
  }

  if (dish.i18n?.en) {
    const { title: enTitle, description: enDescription } = dish.i18n.en;
    if (enTitle || enDescription) {
      body.appendChild(createTranslationBlock('English', enTitle, enDescription));
    }
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
    body.appendChild(tagsWrap);
  }

  return body;
}

function createPairingsBlock(pairings = {}) {
  const pairingItems = [];
  if (Array.isArray(pairings.wines) && pairings.wines.length) {
    pairingItems.push({ label: 'Вина', items: pairings.wines });
  }
  if (Array.isArray(pairings.dishes) && pairings.dishes.length) {
    pairingItems.push({ label: 'Блюда', items: pairings.dishes });
  }
  if (Array.isArray(pairings.drinks) && pairings.drinks.length) {
    pairingItems.push({ label: 'Напитки', items: pairings.drinks });
  }
  const pairingNotes = Array.isArray(pairings.notes)
    ? pairings.notes
    : pairings?.notes
      ? [pairings.notes]
      : [];
  if (pairingNotes.length) {
    pairingItems.push({ label: 'Комментарии', items: pairingNotes });
  }

  if (!pairingItems.length) {
    return null;
  }

  const block = document.createElement('div');
  block.className = 'meta-block';
  const titleEl = document.createElement('strong');
  titleEl.textContent = 'Пары и рекомендации';
  block.appendChild(titleEl);

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

  return block;
}

function openDishModal(dish, triggerElement) {
  if (!dishModal || !modalContent) return;

  modalContent.innerHTML = '';

  const modalHeader = document.createElement('header');
  modalHeader.className = 'modal-header';

  if (dish.image?.src) {
    const media = document.createElement('figure');
    media.className = 'modal-media dish-image';
    const img = document.createElement('img');
    img.src = dish.image.src;
    if (dish.image.alt) {
      img.alt = dish.image.alt;
    }
    media.appendChild(img);
    if (dish.image.alt) {
      const caption = document.createElement('figcaption');
      caption.textContent = dish.image.alt;
      media.appendChild(caption);
    }
    modalHeader.appendChild(media);
  }

  const headerInfo = document.createElement('div');
  headerInfo.className = 'modal-header-info';

  const menuTag = document.createElement('div');
  menuTag.className = 'menu-tag';
  menuTag.textContent = dish.menu || 'Без меню';
  headerInfo.appendChild(menuTag);

  const title = document.createElement('h2');
  title.id = 'modalDishTitle';
  title.textContent = dish.title || 'Без названия';
  headerInfo.appendChild(title);

  if (dish.section) {
    const section = document.createElement('div');
    section.className = 'section';
    section.textContent = dish.section;
    headerInfo.appendChild(section);
  }

  if (dish.status) {
    const status = document.createElement('span');
    status.className = 'status-badge';
    status.textContent = dish.status;
    headerInfo.appendChild(status);
  }

  modalHeader.appendChild(headerInfo);

  const body = buildModalBody(dish);

  modalContent.appendChild(modalHeader);
  modalContent.appendChild(body);

  dishModal.classList.add('open');
  dishModal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');

  lastFocusedElement = triggerElement || document.activeElement;

  if (modalCloseBtn) {
    modalCloseBtn.setAttribute('tabindex', '0');
    modalCloseBtn.focus();
  }
  document.addEventListener('keydown', handleModalKeydown);
}

function closeDishModal() {
  if (!dishModal || !dishModal.classList.contains('open')) return;

  dishModal.classList.remove('open');
  dishModal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  modalContent.innerHTML = '';
  document.removeEventListener('keydown', handleModalKeydown);

  if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
    lastFocusedElement.focus();
  }
  lastFocusedElement = null;
}

function handleModalKeydown(event) {
  if (event.key === 'Escape') {
    closeDishModal();
  }
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

function createRichTextBlock(title, content) {
  const block = document.createElement('div');
  block.className = 'meta-block';
  const heading = document.createElement('strong');
  heading.textContent = title;
  block.appendChild(heading);
  const container = document.createElement('div');
  container.className = 'rich-text';
  container.innerHTML = content;
  block.appendChild(container);
  return block;
}

function createTranslationBlock(label, title, description) {
  const block = document.createElement('div');
  block.className = 'meta-block translation';
  const heading = document.createElement('strong');
  heading.textContent = label;
  block.appendChild(heading);
  if (title) {
    const titleEl = document.createElement('div');
    titleEl.className = 'translation-title';
    titleEl.textContent = title;
    block.appendChild(titleEl);
  }
  if (description) {
    const desc = document.createElement('div');
    desc.className = 'translation-description';
    desc.textContent = description;
    block.appendChild(desc);
  }
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
    editorTitle.textContent = `Редактирование — ${dish.title || 'Без названия'}`;
    editorForm.menu.value = dish.menu || '';
    editorForm.section.value = dish.section || '';
    editorForm.title.value = dish.title || '';
    editorForm.description.value = dish.description || '';
    editorForm.contains.value = dish.contains || '';
    editorForm.ingredients.value = (dish.ingredients || []).join(', ');
    editorForm.allergens.value = (dish.allergens || []).join(', ');
    editorForm.pairDishes.value = (dish.pairings?.dishes || []).join(', ');
    editorForm.pairWines.value = (dish.pairings?.wines || []).join(', ');
    editorForm.pairDrinks.value = (dish.pairings?.drinks || []).join(', ');
    const rawNotes = dish.pairings?.notes;
    const notes = Array.isArray(rawNotes)
      ? rawNotes
      : rawNotes
        ? [rawNotes]
        : [];
    editorForm.pairNotes.value = notes.join(', ');
    editorForm.tags.value = (dish.tags || []).join(', ');
    editorForm.status.value = dish.status || '';
    editorForm.sourceFile.value = dish.source_file || '';
    editorForm.features.value = dish.features || '';
    editorForm.imageSrc.value = dish.image?.src || '';
    editorForm.imageAlt.value = dish.image?.alt || '';
    editorForm.enTitle.value = dish.i18n?.en?.title || '';
    editorForm.enDescription.value = dish.i18n?.en?.description || '';
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

function generateId(title, menu) {
  const base = normalize(`${menu}-${title}`).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
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
  const section = (form.get('section') || '').trim();
  const title = (form.get('title') || '').trim();

  if (!menu || !section || !title) {
    showToast('Заполните меню, раздел и название.', true);
    return;
  }

  const description = (form.get('description') || '').trim();
  const contains = (form.get('contains') || '').trim();
  const ingredients = parseList(form.get('ingredients') || '');
  const allergens = parseList(form.get('allergens') || '');
  const pairDishes = parseList(form.get('pairDishes') || '');
  const pairDrinks = parseList(form.get('pairDrinks') || '');
  const pairWines = parseList(form.get('pairWines') || '');
  const pairNotes = parseList(form.get('pairNotes') || '');
  const tags = parseList(form.get('tags') || '');
  const status = (form.get('status') || '').trim();
  const sourceFile = (form.get('sourceFile') || '').trim();
  const features = (form.get('features') || '').trim();
  const imageSrc = (form.get('imageSrc') || '').trim();
  const imageAlt = (form.get('imageAlt') || '').trim();
  const enTitle = (form.get('enTitle') || '').trim();
  const enDescription = (form.get('enDescription') || '').trim();

  let index = -1;
  let existing = null;
  if (state.editingId) {
    index = state.dishes.findIndex((dish) => dish.id === state.editingId);
    if (index !== -1) {
      existing = state.dishes[index];
    }
  }

  const payload = {
    ...(existing || {}),
    menu,
    section,
    title,
    description,
    contains,
    ingredients,
    allergens,
    pairings: {
      ...(existing?.pairings || {}),
      dishes: pairDishes,
      drinks: pairDrinks,
      wines: pairWines,
      notes: pairNotes
    },
    tags,
    status,
    source_file: sourceFile,
    features,
    image: imageSrc || imageAlt ? { src: imageSrc, alt: imageAlt } : undefined,
    i18n: {
      ...(existing?.i18n || {}),
      ru: {
        ...(existing?.i18n?.ru || {}),
        title,
        description
      },
      en: {
        ...(existing?.i18n?.en || {}),
        title: enTitle,
        description: enDescription
      }
    }
  };

  if (!payload.image) {
    delete payload.image;
  }
  if (!payload.contains) {
    delete payload.contains;
  }
  if (!payload.features) {
    delete payload.features;
  }
  if (!payload.status) {
    delete payload.status;
  }
  if (!payload.source_file) {
    delete payload.source_file;
  }
  if (Array.isArray(payload.pairings?.notes) && payload.pairings.notes.length === 0) {
    delete payload.pairings.notes;
  }
  if (payload.i18n?.en && !payload.i18n.en.title && !payload.i18n.en.description) {
    delete payload.i18n.en;
  }
  if (payload.i18n && !payload.i18n.en && !payload.i18n.ru?.title && !payload.i18n.ru?.description) {
    delete payload.i18n;
  }

  if (state.editingId) {
    payload.id = state.editingId;
    if (index !== -1) {
      state.dishes[index] = payload;
    }
  } else {
    payload.id = generateId(payload.title, payload.menu);
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

if (modalCloseBtn) {
  modalCloseBtn.addEventListener('click', () => {
    closeDishModal();
  });
}

if (dishModal) {
  dishModal.addEventListener('click', (event) => {
    if (event.target === dishModal) {
      closeDishModal();
    }
  });
}

loadData();
