import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getDish } from '../services/api';
import { getDishImageUrl } from '../utils/imageUtils';

function DishDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dish, setDish] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDish = async () => {
      try {
        const data = await getDish(id);
        setDish(data);
      } catch (error) {
        console.error('Ошибка загрузки блюда:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDish();
  }, [id]);

  if (loading) {
    return (
      <div className="bg-background-light dark:bg-background-dark font-display antialiased text-[#181311] dark:text-[#f4f2f0] min-h-screen flex items-center justify-center">
        <div className="text-primary text-xl font-bold">Загрузка...</div>
      </div>
    );
  }

  if (!dish) {
    return (
      <div className="bg-background-light dark:bg-background-dark font-display antialiased text-[#181311] dark:text-[#f4f2f0] min-h-screen flex items-center justify-center">
        <div className="text-center px-4">
          <div className="text-red-500 text-lg font-bold mb-4">Блюдо не найдено</div>
          <Link to="/" className="text-primary hover:underline">Вернуться на главную</Link>
        </div>
      </div>
    );
  }

  const imageUrl = getDishImageUrl(dish);

  // Функция для получения аллергенов с иконками
  const getAllergenInfo = (allergenName) => {
    const allergenLower = allergenName?.toLowerCase() || '';
    const allergens = {
      'глютен': { icon: 'grain', color: 'amber', label: 'Gluten' },
      'gluten': { icon: 'grain', color: 'amber', label: 'Gluten' },
      'яйца': { icon: 'egg', color: 'yellow', label: 'Eggs' },
      'eggs': { icon: 'egg', color: 'yellow', label: 'Eggs' },
      'лактоза': { icon: 'water_drop', color: 'blue', label: 'Dairy' },
      'lactose': { icon: 'water_drop', color: 'blue', label: 'Dairy' },
      'орехи': { icon: 'nutrition', color: 'orange', label: 'Nuts' },
      'nuts': { icon: 'nutrition', color: 'orange', label: 'Nuts' },
      'рыба': { icon: 'set_meal', color: 'cyan', label: 'Fish' },
      'fish': { icon: 'set_meal', color: 'cyan', label: 'Fish' },
    };

    for (const [key, value] of Object.entries(allergens)) {
      if (allergenLower.includes(key)) {
        return value;
      }
    }
    return null;
  };

  return (
    <div className="relative z-20 min-h-[100dvh] overflow-hidden bg-background-light dark:bg-background-dark">
      {/* Top Navigation */}
      <div className="fixed top-0 left-0 right-0 p-4 pt-12 flex justify-between items-center z-50">
        <button
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-md border border-white/10 hover:bg-white/30 transition-all active:scale-95 group"
        >
          <span className="material-symbols-outlined text-white group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
        </button>
        <div className="flex gap-3">
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-md border border-white/10 hover:bg-white/30 transition-all active:scale-95">
            <span className="material-symbols-outlined text-white">ios_share</span>
          </button>
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-md border border-white/10 hover:bg-white/30 transition-all active:scale-95 text-white hover:text-primary">
            <span className="material-symbols-outlined fill-1">favorite</span>
          </button>
        </div>
      </div>

      {/* Swipe Indicator */}
      <div className="w-full flex justify-center pt-3 pb-2">
        <div className="h-1.5 w-12 rounded-full bg-gray-300/80 dark:bg-gray-700/80"></div>
      </div>

      {/* Image */}
      <div className="w-full h-[280px] sm:h-[350px] overflow-hidden relative -mt-4 mb-4">
        {imageUrl ? (
          <img
            alt={dish.image?.alt || dish.title}
            className="h-full w-full object-cover"
            src={imageUrl}
          />
        ) : (
          <div className="h-full w-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
            <span className="material-symbols-outlined text-gray-400 text-6xl">restaurant</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
      </div>

      {/* Content */}
      <div className="px-5 pt-1 pb-24">
        <h1 className="text-[28px] font-bold leading-tight text-gray-900 dark:text-white mb-3">
          {dish.title || 'Без названия'}
        </h1>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {dish.section && (
            <div className="flex items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20 px-3 py-1">
              <span className="text-primary text-xs font-semibold uppercase tracking-wide">{dish.section}</span>
            </div>
          )}
          {dish.menu && (
            <div className="flex items-center justify-center rounded-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 px-3 py-1">
              <span className="text-gray-600 dark:text-gray-300 text-xs font-medium">{dish.menu}</span>
            </div>
          )}
          {dish.tags && dish.tags.map((tag, idx) => {
            const tagLower = tag.toLowerCase();
            if (tagLower.includes('остр') || tagLower.includes('spicy')) {
              return (
                <div key={idx} className="flex items-center justify-center gap-1 rounded-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 px-3 py-1">
                  <span className="material-symbols-outlined text-[14px] text-red-500">local_fire_department</span>
                  <span className="text-gray-600 dark:text-gray-300 text-xs font-medium">{tag}</span>
                </div>
              );
            }
            if (tagLower.includes('веган') || tagLower.includes('vegan')) {
              return (
                <div key={idx} className="flex items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800/30 px-3 py-1">
                  <span className="material-symbols-outlined text-[14px] text-green-700 dark:text-green-400">eco</span>
                  <span className="text-green-700 dark:text-green-400 text-xs font-medium ml-1">{tag}</span>
                </div>
              );
            }
            return (
              <div key={idx} className="flex items-center justify-center rounded-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 px-3 py-1">
                <span className="text-gray-600 dark:text-gray-300 text-xs font-medium">{tag}</span>
              </div>
            );
          })}
        </div>

        {/* Allergens */}
        {dish.allergens && dish.allergens.length > 0 && (
          <div className="bg-white dark:bg-[#2c241e] p-4 rounded-xl shadow-sm border border-gray-100 dark:border-white/5 mb-8">
            <div className="flex items-center gap-2 mb-4 text-gray-900 dark:text-white font-semibold">
              <div className="p-1.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-500">
                <span className="material-symbols-outlined text-[18px] block">warning</span>
              </div>
              Аллергены
            </div>
            <div className="grid grid-cols-5 gap-y-3">
              {dish.allergens.map((allergen, idx) => {
                const allergenInfo = getAllergenInfo(allergen);
                if (!allergenInfo) return null;
                return (
                  <div
                    key={idx}
                    aria-label={allergenInfo.label}
                    className="flex flex-col items-center group relative cursor-pointer active:scale-95 transition-transform"
                    role="tooltip"
                  >
                    <div className={`h-10 w-10 rounded-full bg-${allergenInfo.color}-100 dark:bg-${allergenInfo.color}-900/30 border border-${allergenInfo.color}-200 dark:border-${allergenInfo.color}-800/30 flex items-center justify-center text-${allergenInfo.color}-600 dark:text-${allergenInfo.color}-400 text-xl shadow-sm group-hover:shadow-md transition-shadow`}>
                      <span className="material-symbols-outlined text-[20px] fill-1">{allergenInfo.icon}</span>
                    </div>
                    <span className="absolute top-full mt-1 px-2 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      {allergenInfo.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Description */}
        {dish.description && (
          <div className="mb-8">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-2 opacity-80">
              Красочное описание
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-[15px] leading-relaxed">
              {dish.description}
            </p>
          </div>
        )}

        {/* Recipe Details */}
        {(dish.ingredients && dish.ingredients.length > 0) || dish.contains ? (
          <div className="grid grid-cols-1 gap-4 mb-8">
            <div className="bg-primary/5 dark:bg-primary/10 p-5 rounded-xl border border-primary/20 dark:border-primary/30 shadow-md">
              <h3 className="flex items-center gap-2 mb-3 text-gray-900 dark:text-white font-bold text-lg">
                <div className="p-1.5 rounded-full bg-primary/20 dark:bg-primary/30 text-primary">
                  <span className="material-symbols-outlined text-[20px] block">menu_book</span>
                </div>
                Состав блюда
              </h3>
              <div className="max-h-96 overflow-y-auto no-scrollbar pr-2 -mr-2">
                {/* Ингредиенты */}
                {dish.ingredients && dish.ingredients.length > 0 && (
                  <div className="mb-5">
                    <h4 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-3">Ингредиенты:</h4>
                    <ul className="flex flex-wrap gap-2">
                      {dish.ingredients.map((ingredient, idx) => (
                        <li
                          key={idx}
                          className="text-sm bg-primary/10 dark:bg-primary/20 px-3 py-1.5 rounded-md text-gray-800 dark:text-gray-100 font-medium"
                        >
                          {ingredient}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {/* Приготовление */}
                {dish.contains && (
                  <div>
                    <h4 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-3">Приготовление:</h4>
                    <div 
                      className="text-gray-700 dark:text-gray-200 text-base leading-relaxed prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: dish.contains }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {/* Features (Особенности) */}
        {dish.features && (
          <div className="mb-8">
            <h3 className="flex items-center gap-2 mb-3 text-gray-900 dark:text-white font-semibold">
              <div className="p-1.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                <span className="material-symbols-outlined text-[18px] block">grade</span>
              </div>
              Особенности блюда
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-[15px] leading-relaxed">
              {dish.features}
            </p>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full bg-white dark:bg-[#1a120d] border-t border-gray-100 dark:border-white/5 pb-safe z-50 shadow-[0_-5px_15px_rgba(0,0,0,0.03)]">
        <div className="grid grid-cols-4 h-[60px] items-center">
          <Link
            to="/"
            className="flex flex-col items-center justify-center gap-1 h-full w-full text-primary"
          >
            <span className="material-symbols-outlined filled">restaurant_menu</span>
            <span className="text-[10px] font-semibold tracking-wide">Menu</span>
          </Link>
          <button className="flex flex-col items-center justify-center gap-1 h-full w-full text-gray-400 dark:text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
            <span className="material-symbols-outlined">search</span>
            <span className="text-[10px] font-medium tracking-wide">Search</span>
          </button>
          <button className="flex flex-col items-center justify-center gap-1 h-full w-full text-gray-400 dark:text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
            <span className="material-symbols-outlined">favorite</span>
            <span className="text-[10px] font-medium tracking-wide">Saved</span>
          </button>
          <Link
            to="/admin"
            className="flex flex-col items-center justify-center gap-1 h-full w-full text-gray-400 dark:text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            <span className="material-symbols-outlined">person</span>
            <span className="text-[10px] font-medium tracking-wide">Profile</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}

export default DishDetailPage;
