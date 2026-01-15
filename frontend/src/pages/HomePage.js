import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMenus, getSections } from '../services/api';

function HomePage() {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadMenus = async () => {
      try {
        const data = await getMenus();
        setMenus(data);
      } catch (err) {
        setError('Ошибка загрузки меню. Убедитесь, что сервер запущен.');
        console.error('Ошибка загрузки меню:', err);
      } finally {
        setLoading(false);
      }
    };

    loadMenus();
  }, []);

  // Функция для получения иконки по названию меню
  const getMenuIcon = (menuName) => {
    const menuLower = menuName.toLowerCase();
    if (menuLower.includes('основн') || menuLower.includes('горяч')) return 'restaurant';
    if (menuLower.includes('завтрак')) return 'bakery_dining';
    if (menuLower.includes('ланч')) return 'schedule';
    if (menuLower.includes('сезон')) return 'eco';
    if (menuLower.includes('напит') || menuLower.includes('бар')) return 'local_bar';
    if (menuLower.includes('десерт')) return 'icecream';
    if (menuLower.includes('детск')) return 'child_care';
    if (menuLower.includes('веган')) return 'spa';
    return 'restaurant_menu';
  };

  // Функция для получения описания меню
  const getMenuDescription = (menuName) => {
    const menuLower = menuName.toLowerCase();
    if (menuLower.includes('основн')) return 'Горячее • Салаты';
    if (menuLower.includes('завтрак')) return 'До 16:00';
    if (menuLower.includes('ланч')) return 'Пн-Пт 12-16';
    if (menuLower.includes('сезон')) return 'Осень 2023';
    if (menuLower.includes('напит') || menuLower.includes('бар')) return 'Бар & Кофе';
    if (menuLower.includes('десерт')) return 'Сладкое';
    if (menuLower.includes('детск')) return 'Для малышей';
    if (menuLower.includes('веган')) return 'Полезное';
    return '';
  };

  // Функция для получения изображения меню
  const getMenuImage = (menuName) => {
    const menuLower = menuName.toLowerCase();
    if (menuLower.includes('основн')) {
      return 'https://lh3.googleusercontent.com/aida-public/AB6AXuAJCDS6Sbg4suSEdT4-kNlqzT4jI-CzR8305dsh9ex0UXltArmASVVq2eI9H-HSyxQDPlPBq9cHpXNGJsQ_Vv3bd7bFl8dZn5u2SG9XmgZe2T_PEwGbOfb7NgEV0gZDx0Hl3d1FArwh602sKvsxnCR-SMID0Ze7aFfpgLf51ZrnTi7z6BfiGb7u_bJa8KgZvjwVmTWFQELVYi1eIWaJd1kZnszSH0FZC84a45MX_QxNqz7ce4hONM3tyJ0kQ3LCyEIxA5M5j8g88PFh';
    }
    if (menuLower.includes('завтрак')) {
      return 'https://lh3.googleusercontent.com/aida-public/AB6AXuBiJ9M9XC_Vcq2Xg6ToZ4gNajAx9GSuVHD-31HKYkhOiul2fxim92p3JtC-MTNedJ730jnDVMshT0KtxoFsyb8Ma7ny7SHCNrRt3oUdqSCZnnKB0udNzzNXpmz5BwGVcGtDw1upPorhrL1zWKgap-VBjhkk_2SFWN36F1E_i46WpUNpIk4J4cpM3wJ5ytnz2TJcWAJlmw7IJZeZC6rUwqLpEvsGc68L5D-Vh8RWJiwu6Op2-s0xdpJ9Buzi2FapbL7cq7LMVT865iyc';
    }
    if (menuLower.includes('ланч')) {
      return 'https://lh3.googleusercontent.com/aida-public/AB6AXuCFa7hRE3DZG_YnxcRcQbqnocaNXZ_3dwDfetTUibcPfkS9JFaW6EpBLZzA5fUyDzm_g0JvigoEr5TyR7OaxXq8W9HBfBp3dWXv6ZvWjvBBfg6WLyBE27AsFrKX5K1sTXe0vCuNFKbipNQPy2NdG_cSc_PGY5qCxoyahjLrBfD18aVSkleJnap1qz4CEyWQHgQGdr6-noyKGJn_mBSeJSKuW4Xk7CFa6T-Jj0VdV0rTmakPewwbpwBE0oTXnVosRMWyNYjq0Sg8aqTk';
    }
    if (menuLower.includes('сезон')) {
      return 'https://lh3.googleusercontent.com/aida-public/AB6AXuCagYch_mtFP6ZfSpZFB2R2cfm7HOhY3c6L_rQ3wyrqN-xgpddnSo-_1Jd9Ms575uWlNUrp1Je5vBHsRiOqLQ27jeFB4cSzB5JDlMtCr4PxRQaL9nNKC19Ys0D1nPXsETOJTaElB57TjU1eZr0FLTM4iL4vthZJwk9NNuanaM2Fn51T0LBbeRJHxxjWXiuonjcKi-DWHfhkjJEVy8FcpRXqimZxm794st-XC6PHechAQvmaPzLuv6djiV39nAFXY8cnseAnoplOfuAY';
    }
    return null;
  };

  if (loading) {
    return (
      <div className="bg-background-light dark:bg-background-dark text-[#181311] dark:text-white font-display antialiased min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-primary text-xl font-bold">Загрузка...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-background-light dark:bg-background-dark text-[#181311] dark:text-white font-display antialiased min-h-screen flex items-center justify-center">
        <div className="text-center px-4">
          <div className="text-red-500 text-lg font-bold mb-2">{error}</div>
          <Link to="/admin" className="text-primary hover:underline">Перейти в админ-панель</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden pb-20 bg-background-light dark:bg-background-dark text-[#181311] dark:text-white font-display antialiased">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center bg-white/95 dark:bg-[#181311]/95 backdrop-blur-sm p-4 pb-2 justify-between border-b border-orange-100/50 dark:border-gray-800 shadow-sm transition-all">
        <button className="text-[#181311] dark:text-white flex size-12 shrink-0 items-center justify-center rounded-full hover:bg-orange-50 dark:hover:bg-white/5 transition-colors">
          <span className="material-symbols-outlined">menu</span>
        </button>
        <h2 className="text-primary dark:text-primary text-xl font-black leading-tight tracking-tight flex-1 text-center uppercase">
          Gourmet
        </h2>
        <button className="text-[#181311] dark:text-white flex size-12 shrink-0 items-center justify-center rounded-full hover:bg-orange-50 dark:hover:bg-white/5 transition-colors">
          <span className="material-symbols-outlined">notifications</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="px-5 pb-3 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[#181311] dark:text-white tracking-tight text-xl font-bold leading-tight">
              Наше меню
            </h2>
          </div>
          <p className="text-[#896f61] dark:text-gray-400 text-xs mt-1">Вдохновение вкусом в каждом блюде</p>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-2 gap-3 px-4 pb-4">
          {menus.length === 0 ? (
            <div className="col-span-2 text-center py-8">
              <p className="text-[#896f61] dark:text-gray-400 mb-4">Меню пока нет</p>
              <Link to="/admin" className="inline-block px-4 py-2 bg-primary text-white rounded-xl font-bold">
                Админ-панель
              </Link>
            </div>
          ) : (
            menus.map((menuName) => {
              const imageUrl = getMenuImage(menuName);
              const icon = getMenuIcon(menuName);
              const description = getMenuDescription(menuName);

              return (
                <Link
                  key={menuName}
                  to={`/menu/${encodeURIComponent(menuName)}`}
                  className="group relative overflow-hidden rounded-xl aspect-[4/3] shadow-md shadow-orange-900/5 active:scale-[0.98] transition-all duration-300"
                >
                  {imageUrl ? (
                    <>
                      <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                        style={{ backgroundImage: `url("${imageUrl}")` }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                    </>
                  ) : (
                    <div className="absolute inset-0 bg-orange-100 dark:bg-gray-800 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary/40 dark:text-white/10 text-6xl">
                        {icon}
                      </span>
                    </div>
                  )}
                  {!imageUrl && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-3 flex flex-col justify-end h-full">
                    <span className="material-symbols-outlined text-white mb-0.5 text-xl opacity-90">
                      {icon}
                    </span>
                    <p className="text-white text-base font-bold leading-tight">{menuName}</p>
                    {description && (
                      <p className="text-white/70 text-[10px] mt-0.5 font-medium uppercase tracking-wide">
                        {description}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#181311] border-t border-orange-100 dark:border-gray-800 pb-safe z-40">
        <div className="grid grid-cols-4 h-16">
          <Link
            to="/"
            className="flex flex-col items-center justify-center gap-1 text-primary"
          >
            <span className="material-symbols-outlined text-2xl">restaurant_menu</span>
            <span className="text-[10px] font-medium">Меню</span>
          </Link>
          <button className="flex flex-col items-center justify-center gap-1 text-gray-400 dark:text-gray-500 hover:text-primary dark:hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-2xl">favorite</span>
            <span className="text-[10px] font-medium">Избранное</span>
          </button>
          <button className="flex flex-col items-center justify-center gap-1 text-gray-400 dark:text-gray-500 hover:text-primary dark:hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-2xl">new_releases</span>
            <span className="text-[10px] font-medium">Новинки</span>
          </button>
          <Link
            to="/admin"
            className="flex flex-col items-center justify-center gap-1 text-gray-400 dark:text-gray-500 hover:text-primary dark:hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-2xl">person</span>
            <span className="text-[10px] font-medium">Профиль</span>
          </Link>
        </div>
        <div className="h-[env(safe-area-inset-bottom)] bg-white dark:bg-[#181311]" />
      </footer>
    </div>
  );
}

export default HomePage;
