const fuse = new Fuse(indexData, {
  keys: ["title", "content"],
  threshold: 0.4,
  ignoreLocation: true,
  minMatchCharLength: 2
});

const searchInput = document.getElementById('searchInput');
const resultsList = document.getElementById('searchResults');

resultsList.style.display = "none";

searchInput.addEventListener('input', () => {
  const query = searchInput.value.trim();
  resultsList.innerHTML = "";

  if (query.length < 2) {
    resultsList.style.display = "none";
    return;
  }

  const results = fuse.search(query).slice(0, 8);
  resultsList.style.display = "block";

  if (results.length === 0) {
    const li = document.createElement('li');
    li.textContent = "Ничего не найдено.";
    resultsList.appendChild(li);
  } else {
    results.forEach(({ item }) => {
      const li = document.createElement('li');
      const link = document.createElement('a');
      link.href = item.anchor;
      link.textContent = item.title;
      li.appendChild(link);
      resultsList.appendChild(li);
    });
  }
});
