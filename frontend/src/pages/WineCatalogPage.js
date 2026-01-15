import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getWinesByCategory } from '../services/api';
import { getDishImageUrl } from '../utils/imageUtils';

function WineCatalogPage() {
  const { category } = useParams();
  const navigate = useNavigate();
  const [wines, setWines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const categoryNames = {
    'by-glass': 'Вина по бокалам',
    'coravin': 'Coravin',
    'half-bottles': 'Полубутылки',
  };

  useEffect(() => {
    const loadWines = async () => {
      try {
        const data = await getWinesByCategory(category);
        setWines(data);
      } catch (error) {
        console.error('Ошибка загрузки вин:', error);
      } finally {
        setLoading(false);
      }
    };

    loadWines();
  }, [category]);

  const filteredWines = wines.filter((wine) => {
    const matchesSearch =
      !searchQuery ||
      wine.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wine.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wine.origin?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="bg-background-light dark:bg-background-dark font-display antialiased text-[#181311] dark:text-[#f4f2f0] min-h-screen flex items-center justify-center">
        <div className="text-primary text-xl font-bold">Загрузка...</div>
      </div>
    );
  }

  const categoryName = categoryNames[category] || category;

  return (
    <div className="relative flex h-full min-h-screen w-full flex-col max-w-md mx-auto bg-background-light dark:bg-background-dark shadow-2xl overflow-hidden border-x border-gray-100 dark:border-gray-800">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800/50">
        <div className="flex items-center px-4 pt-4 pb-2 justify-between">
          <button
            onClick={() => navigate(-1)}
            className="text-[#181311] dark:text-white flex size-10 shrink-0 items-center justify-center rounded-full active:bg-black/5 dark:active:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h2 className="text-[#181311] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">
            {categoryName}
          </h2>
          <div className="flex w-12 items-center justify-end">
            <button className="text-primary text-xs font-bold leading-normal tracking-[0.015em] shrink-0 border border-primary/30 rounded-lg px-2 py-1 hover:bg-primary hover:text-white transition-colors">
              EN
            </button>
          </div>
        </div>
        {/* Breadcrumb */}
        <div className="px-4 pb-2">
          <nav className="flex text-xs text-[#896f61] dark:text-gray-400 font-medium whitespace-nowrap overflow-hidden text-ellipsis items-center">
            <Link to="/wine-menu" className="hover:text-primary transition-colors cursor-pointer">
              Вино
            </Link>
            <span className="material-symbols-outlined text-[10px] mx-1 opacity-60">chevron_right</span>
            <span className="text-primary font-semibold">{categoryName}</span>
          </nav>
        </div>
        {/* Search */}
        <div className="px-4 py-2">
          <div className="flex w-full items-stretch rounded-xl h-10 bg-white dark:bg-surface-dark shadow-sm border border-gray-100 dark:border-gray-700/50 group focus-within:border-primary/50 transition-colors">
            <div className="text-[#896f61] dark:text-gray-400 flex items-center justify-center pl-3 pr-2 group-focus-within:text-primary transition-colors">
              <span className="material-symbols-outlined text-[20px]">search</span>
            </div>
            <input
              className="flex w-full flex-1 bg-transparent border-none text-[#181311] dark:text-white placeholder:text-[#896f61] dark:placeholder:text-gray-500 focus:ring-0 text-sm font-normal h-full p-0"
              placeholder="Поиск вин..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Wines Grid */}
      <div className="flex-1 overflow-y-auto px-3 pb-24 pt-3">
        <div className="flex justify-between items-center mb-3 px-1">
          <h3 className="font-bold text-base dark:text-white">Все вина</h3>
          <span className="text-[10px] text-gray-500 font-medium bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-md border border-gray-200 dark:border-gray-700">
            {filteredWines.length} {filteredWines.length === 1 ? 'вино' : 'вин'}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {filteredWines.length === 0 ? (
            <div className="col-span-2 text-center py-8 text-[#896f61] dark:text-gray-400">
              Вина не найдены
            </div>
          ) : (
            filteredWines.map((wine) => {
              const imageUrl = getDishImageUrl(wine);

              return (
                <Link
                  key={wine.id}
                  to={`/wine-item/${wine.id}`}
                  className="group flex flex-col rounded-lg overflow-hidden bg-white dark:bg-surface-dark shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none border border-gray-100 dark:border-gray-800 hover:border-primary/30 transition-all"
                >
                  <div className="relative w-full aspect-[3/4] overflow-hidden bg-gray-100 dark:bg-gray-800">
                    {imageUrl ? (
                      <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                        style={{ backgroundImage: `url('${imageUrl}')` }}
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <span className="material-symbols-outlined text-gray-400 text-4xl">wine_bar</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3 flex flex-col flex-grow">
                    <h3 className="font-bold text-sm leading-[1.2] dark:text-white line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                      {wine.title || 'Без названия'}
                    </h3>
                    {wine.origin && (
                      <p className="text-[10px] text-[#896f61] dark:text-gray-400 line-clamp-1 mb-1 leading-tight opacity-90">
                        {wine.origin.replace(/\.$/, '')}
                      </p>
                    )}
                    {wine.producer && (
                      <p className="text-[9px] text-[#896f61] dark:text-gray-400 line-clamp-1 leading-tight opacity-75">
                        {wine.producer.replace(/\.$/, '')}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 z-50 w-full max-w-md bg-white/95 dark:bg-surface-dark/95 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 pb-safe">
        <div className="flex justify-between px-6 items-center h-[60px]">
          <Link to="/wine-menu" className="flex flex-col items-center justify-center gap-1 text-primary w-14">
            <span className="material-symbols-outlined text-[24px]">wine_bar</span>
            <span className="text-[10px] font-bold">Вино</span>
          </Link>
          <button className="flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-[#181311] dark:hover:text-white transition-colors w-14">
            <span className="material-symbols-outlined text-[24px]">favorite</span>
            <span className="text-[10px] font-medium">Избранное</span>
          </button>
          <button className="flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-[#181311] dark:hover:text-white transition-colors w-14">
            <span className="material-symbols-outlined text-[24px]">info</span>
            <span className="text-[10px] font-medium">О нас</span>
          </button>
          <Link
            to="/admin"
            className="flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-[#181311] dark:hover:text-white transition-colors w-14"
          >
            <span className="material-symbols-outlined text-[24px]">person</span>
            <span className="text-[10px] font-medium">Профиль</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default WineCatalogPage;
