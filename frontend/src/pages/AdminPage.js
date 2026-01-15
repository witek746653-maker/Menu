import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  login,
  logout,
  checkAuth,
  getDishes,
  saveDishes,
  deleteDish,
} from '../services/api';
import { getDishImageUrl } from '../utils/imageUtils';

function AdminPage() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const check = async () => {
      try {
        const result = await checkAuth();
        setIsAuthenticated(result.authenticated);
        if (result.authenticated) {
          loadDishes();
        }
      } catch (error) {
        setIsAuthenticated(false);
      } finally {
        setChecking(false);
      }
    };
    check();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await login(password);
      setIsAuthenticated(true);
      setPassword('');
      loadDishes();
    } catch (error) {
      setError('Неверный пароль');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setIsAuthenticated(false);
      navigate('/');
    } catch (error) {
      console.error('Ошибка выхода:', error);
    }
  };

  const loadDishes = async () => {
    setLoading(true);
    try {
      const data = await getDishes();
      setDishes(data);
    } catch (error) {
      alert('Ошибка загрузки блюд: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await saveDishes(dishes);
      alert('✅ Данные сохранены!');
    } catch (error) {
      alert('❌ Ошибка сохранения: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить это блюдо?')) return;

    try {
      await deleteDish(id);
      setDishes(dishes.filter((d) => d.id !== id));
      alert('✅ Блюдо удалено');
    } catch (error) {
      alert('❌ Ошибка удаления: ' + (error.response?.data?.error || error.message));
    }
  };

  const filteredDishes = dishes.filter((dish) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      dish.title?.toLowerCase().includes(query) ||
      dish.description?.toLowerCase().includes(query) ||
      dish.menu?.toLowerCase().includes(query) ||
      dish.section?.toLowerCase().includes(query)
    );
  });

  if (checking) {
    return (
      <div className="bg-background-light dark:bg-background-dark font-display min-h-screen flex items-center justify-center">
        <div className="text-primary text-xl font-bold">Проверка...</div>
      </div>
    );
  }

  // Страница входа
  if (!isAuthenticated) {
    return (
      <div className="bg-background-light dark:bg-background-dark font-display min-h-screen flex flex-col antialiased overflow-x-hidden transition-colors duration-300">
        <div className="relative flex flex-1 w-full flex-col justify-center items-center px-4 py-8 sm:px-6 lg:px-8">
          <div className="w-full max-w-[480px] flex flex-col gap-6">
            {/* Header Section */}
            <div className="flex flex-col items-center text-center">
              <div className="mb-6 h-24 w-24 overflow-hidden rounded-full shadow-lg bg-white dark:bg-gray-800 flex items-center justify-center p-1">
                <div className="h-full w-full rounded-full overflow-hidden bg-primary/10 flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5"></div>
                  <span className="material-symbols-outlined text-primary text-4xl relative z-10">restaurant_menu</span>
                </div>
              </div>
              <h1 className="text-gray-900 dark:text-white tracking-tight text-[32px] font-bold leading-tight px-4 pb-2">
                Админ-панель
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-base font-normal leading-normal px-4 max-w-xs mx-auto">
                Управление меню ресторана. Введите данные для входа.
              </p>
            </div>

            {/* Login Form */}
            <form className="flex flex-col gap-5 mt-4" onSubmit={handleLogin}>
              <div className="flex flex-col gap-2">
                <label className="text-gray-900 dark:text-gray-200 text-base font-medium leading-normal pl-1">
                  Пароль
                </label>
                <div className="flex w-full items-stretch rounded-xl shadow-sm relative">
                  <input
                    autoComplete="current-password"
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-gray-900 dark:text-white bg-white dark:bg-[#2f221c] border border-gray-200 dark:border-gray-700 h-14 placeholder:text-gray-400 dark:placeholder:text-gray-500 p-[15px] pr-12 text-base font-normal leading-normal focus:outline-0 focus:ring-1 focus:ring-primary focus:border-primary transition-all duration-200"
                    placeholder="••••••••"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-0 h-full px-4 text-gray-400 hover:text-primary transition-colors flex items-center justify-center cursor-pointer bg-transparent border-none outline-none focus:outline-none"
                  >
                    <span className="material-symbols-outlined text-[24px]">
                      {showPassword ? 'visibility' : 'visibility_off'}
                    </span>
                  </button>
                </div>
              </div>

              {error && (
                <div className="text-red-500 text-sm px-1">{error}</div>
              )}

              <button
                type="submit"
                className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl h-14 px-5 bg-primary hover:bg-primary/90 active:scale-[0.98] transition-all duration-200 text-white text-base font-bold leading-normal tracking-[0.015em] shadow-md mt-2"
              >
                <span className="truncate">Войти</span>
              </button>
            </form>

            {/* Footer help */}
            <div className="mt-4 text-center">
              <Link to="/" className="text-primary hover:underline text-sm">
                ← Вернуться на главную
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Страница со списком блюд
  return (
    <div className="bg-background-light dark:bg-background-dark font-display antialiased text-text-primary-light dark:text-text-primary-dark transition-colors duration-200 min-h-screen">
      <div className="relative flex h-full min-h-screen w-full flex-col overflow-x-hidden max-w-md mx-auto bg-background-light dark:bg-background-dark shadow-2xl">
        {/* Header */}
        <header className="sticky top-0 z-50 flex items-center justify-between bg-surface-light/95 dark:bg-surface-dark/95 backdrop-blur-md p-4 pb-3 border-b border-gray-100 dark:border-white/5 transition-colors">
          <div className="flex flex-col">
            <h1 className="text-xl font-bold leading-tight tracking-tight">База блюд</h1>
            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">Администрирование контента</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-white/10 text-sm font-medium hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
            >
              Выйти
            </button>
          </div>
        </header>

        {/* Search */}
        <div className="px-4 py-3 bg-background-light dark:bg-background-dark sticky top-[68px] z-40">
          <div className="flex w-full items-center rounded-xl bg-surface-light dark:bg-surface-dark shadow-sm border border-transparent focus-within:border-primary/50 transition-colors h-12 mb-3">
            <div className="flex items-center justify-center pl-4 text-text-secondary-light dark:text-text-secondary-dark">
              <span className="material-symbols-outlined">search</span>
            </div>
            <input
              className="flex w-full min-w-0 flex-1 bg-transparent border-none text-text-primary-light dark:text-text-primary-dark placeholder:text-text-secondary-light/70 dark:placeholder:text-text-secondary-dark/70 focus:outline-none focus:ring-0 px-3 text-base font-normal leading-normal"
              placeholder="Название, ингредиенты..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Dishes Count */}
        <div className="px-4 pb-2 flex justify-between items-end">
          <span className="text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
            Найдено {filteredDishes.length} блюд
          </span>
        </div>

        {/* Dishes List */}
        <div className="flex flex-col gap-3 px-4 pb-24">
          {loading ? (
            <div className="text-center py-8 text-text-secondary-light">Загрузка...</div>
          ) : filteredDishes.length === 0 ? (
            <div className="text-center py-8 text-text-secondary-light">
              {searchQuery ? 'Блюда не найдены' : 'Блюда не загружены'}
            </div>
          ) : (
            filteredDishes.map((dish) => {
              // Проверяем, находится ли блюдо в архиве
              const isArchived = dish.status === 'в архиве';
              
              return (
              <div
                key={dish.id}
                className={`flex flex-col bg-surface-light dark:bg-surface-dark rounded-2xl p-3 shadow-sm border border-gray-100 dark:border-white/5 relative overflow-hidden group ${
                  isArchived ? 'opacity-50 grayscale' : ''
                }`}
              >
                <div className="flex gap-4">
                  <div
                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-xl size-20 shrink-0"
                    style={{
                      backgroundImage: getDishImageUrl(dish)
                        ? `url('${getDishImageUrl(dish)}')`
                        : 'none',
                      backgroundColor: getDishImageUrl(dish) ? 'transparent' : '#e5e7eb',
                    }}
                  >
                    {!getDishImageUrl(dish) && (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-gray-400 text-2xl">restaurant</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col justify-between py-0.5">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex flex-col">
                        <p className="text-text-primary-light dark:text-text-primary-dark text-base font-bold leading-tight">
                          {dish.title || 'Без названия'}
                        </p>
                        <p className="text-text-secondary-light dark:text-text-secondary-dark text-xs mt-0.5">
                          {dish.description || 'Нет описания'}
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between items-end mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border border-orange-100 dark:border-orange-800/30">
                        {dish.menu || 'БЕЗ МЕНЮ'}: {dish.section || 'БЕЗ РАЗДЕЛА'}
                      </span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => navigate(`/admin/edit/${dish.id}`)}
                          className="p-1.5 rounded-lg bg-gray-50 dark:bg-white/5 text-text-secondary-light hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(dish.id)}
                          className="p-1.5 rounded-lg bg-gray-50 dark:bg-white/5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Индикатор статуса архива */}
                {isArchived && (
                  <div className="absolute top-2 right-2 bg-gray-600 text-white text-[10px] font-bold px-2 py-1 rounded-md">
                    В АРХИВЕ
                  </div>
                )}
              </div>
            );
            })
          )}
        </div>

        {/* Floating Action Button */}
        <Link
          to="/admin/add"
          className="fixed bottom-6 right-6 z-50 group flex h-14 px-4 cursor-pointer items-center justify-center rounded-full bg-primary hover:bg-orange-600 active:scale-95 transition-all shadow-lg shadow-primary/30"
        >
          <span className="material-symbols-outlined text-white mr-1" style={{ fontSize: '20px' }}>add</span>
          <span className="text-white text-sm font-bold">Блюдо</span>
        </Link>
      </div>
    </div>
  );
}

export default AdminPage;
