from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_login import LoginManager, login_required, login_user, logout_user, UserMixin
from pathlib import Path
import json
import os
from dotenv import load_dotenv

# Загружаем переменные окружения
load_dotenv()

# Создаём приложение Flask
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'change-this-in-production-12345')

# Разрешаем запросы с фронтенда (CORS)
CORS(app, supports_credentials=True)

# Настройка Flask-Login для аутентификации
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# Путь к файлу с данными (относительно корня проекта)
ROOT_DIR = Path(__file__).resolve().parent.parent
DATA_PATH = ROOT_DIR / "data" / "menu-database.json"
IMAGES_DIR = ROOT_DIR / "images"

# Простой класс пользователя для админки
class User(UserMixin):
    def __init__(self, id):
        self.id = id

# Загрузка пользователя (для Flask-Login)
@login_manager.user_loader
def load_user(user_id):
    return User(user_id)

# ========== ПУБЛИЧНЫЕ API (для посетителей) ==========

@app.route('/api/dishes', methods=['GET'])
def get_dishes():
    """Возвращает все блюда из menu-database.json"""
    try:
        if not DATA_PATH.exists():
            return jsonify({'error': 'menu-database.json not found'}), 404
        
        with open(DATA_PATH, 'r', encoding='utf-8') as f:
            dishes = json.load(f)
        
        return jsonify(dishes)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/dishes/<dish_id>', methods=['GET'])
def get_dish(dish_id):
    """Возвращает одно блюдо по ID"""
    try:
        if not DATA_PATH.exists():
            return jsonify({'error': 'menu-database.json not found'}), 404
        
        with open(DATA_PATH, 'r', encoding='utf-8') as f:
            dishes = json.load(f)
        
        dish = next((d for d in dishes if d.get('id') == dish_id), None)
        if not dish:
            return jsonify({'error': 'Dish not found'}), 404
        
        return jsonify(dish)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/menus', methods=['GET'])
def get_menus():
    """Возвращает список всех меню (уникальные значения поля 'menu')"""
    try:
        if not DATA_PATH.exists():
            return jsonify([])
        
        with open(DATA_PATH, 'r', encoding='utf-8') as f:
            dishes = json.load(f)
        
        menus = list(set(d.get('menu', '') for d in dishes if d.get('menu')))
        return jsonify(sorted(menus))
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/sections', methods=['GET'])
def get_sections():
    """Возвращает список всех разделов"""
    try:
        if not DATA_PATH.exists():
            return jsonify([])
        
        menu_name = request.args.get('menu')
        
        with open(DATA_PATH, 'r', encoding='utf-8') as f:
            dishes = json.load(f)
        
        filtered = dishes
        if menu_name:
            filtered = [d for d in dishes if d.get('menu') == menu_name]
        
        sections = list(set(d.get('section', '') for d in filtered if d.get('section')))
        return jsonify(sorted(sections))
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/images/<path:filename>')
def serve_image(filename):
    """Отдаёт изображения из папки images"""
    try:
        if IMAGES_DIR.exists() and (IMAGES_DIR / filename).exists():
            return send_from_directory(str(IMAGES_DIR), filename)
        else:
            return jsonify({'error': 'Image not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ========== API ДЛЯ ВИН ==========

@app.route('/api/wines', methods=['GET'])
def get_wines():
    """Возвращает все вина (menu='Вино')"""
    try:
        if not DATA_PATH.exists():
            return jsonify([])
        
        with open(DATA_PATH, 'r', encoding='utf-8') as f:
            dishes = json.load(f)
        
        wines = [d for d in dishes if d.get('menu') == 'Вино']
        return jsonify(wines)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/wines/category/<category>', methods=['GET'])
def get_wines_by_category(category):
    """Возвращает вина по категории (by-glass/coravin/half-bottles)"""
    try:
        if not DATA_PATH.exists():
            return jsonify([])
        
        with open(DATA_PATH, 'r', encoding='utf-8') as f:
            dishes = json.load(f)
        
        wines = [d for d in dishes if d.get('menu') == 'Вино' and d.get('category') == category]
        return jsonify(wines)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/wines/<wine_id>', methods=['GET'])
def get_wine(wine_id):
    """Возвращает одно вино по ID"""
    try:
        if not DATA_PATH.exists():
            return jsonify({'error': 'menu-database.json not found'}), 404
        
        with open(DATA_PATH, 'r', encoding='utf-8') as f:
            dishes = json.load(f)
        
        wine = next((d for d in dishes if d.get('id') == wine_id and d.get('menu') == 'Вино'), None)
        if not wine:
            return jsonify({'error': 'Wine not found'}), 404
        
        return jsonify(wine)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ========== АДМИНСКИЕ API (требуют авторизации) ==========

@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    """Вход в админ-панель"""
    data = request.json
    password = data.get('password')
    
    # В продакшене используйте переменные окружения!
    admin_password = os.getenv('ADMIN_PASSWORD', 'admin123')
    
    if password == admin_password:
        user = User('admin')
        login_user(user)
        return jsonify({'status': 'ok', 'message': 'Успешный вход'})
    else:
        return jsonify({'error': 'Неверный пароль'}), 401

@app.route('/api/admin/logout', methods=['POST'])
@login_required
def admin_logout():
    """Выход из админ-панели"""
    logout_user()
    return jsonify({'status': 'ok'})

@app.route('/api/admin/check', methods=['GET'])
def check_auth():
    """Проверка авторизации"""
    from flask_login import current_user
    return jsonify({'authenticated': current_user.is_authenticated})

@app.route('/api/admin/dishes', methods=['POST'])
@login_required
def save_dishes():
    """Сохранение всех блюд (для админа)"""
    try:
        data = request.json
        
        if not isinstance(data, list):
            return jsonify({'error': 'Payload must be a list'}), 400
        
        # Валидация: проверяем, что у каждого блюда есть ID
        for dish in data:
            if not isinstance(dish, dict) or not dish.get('id'):
                return jsonify({'error': 'Each dish must have an id'}), 400
        
        # Создаём папку data, если её нет
        DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
        
        # Сохраняем в файл
        with open(DATA_PATH, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        return jsonify({'status': 'ok', 'message': 'Данные сохранены'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/dishes/<dish_id>', methods=['PUT'])
@login_required
def update_dish(dish_id):
    """Обновление одного блюда"""
    try:
        if not DATA_PATH.exists():
            return jsonify({'error': 'menu-database.json not found'}), 404
        
        with open(DATA_PATH, 'r', encoding='utf-8') as f:
            dishes = json.load(f)
        
        # Находим блюдо
        index = next((i for i, d in enumerate(dishes) if d.get('id') == dish_id), None)
        if index is None:
            return jsonify({'error': 'Dish not found'}), 404
        
        # Обновляем
        dishes[index] = request.json
        
        # Сохраняем
        with open(DATA_PATH, 'w', encoding='utf-8') as f:
            json.dump(dishes, f, ensure_ascii=False, indent=2)
        
        return jsonify({'status': 'ok', 'dish': dishes[index]})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/dishes', methods=['PUT'])
@login_required
def add_dish():
    """Добавление нового блюда"""
    try:
        dishes = []
        if DATA_PATH.exists():
            with open(DATA_PATH, 'r', encoding='utf-8') as f:
                dishes = json.load(f)
        
        new_dish = request.json
        if not new_dish.get('id'):
            return jsonify({'error': 'Dish must have an id'}), 400
        
        # Проверяем, нет ли уже блюда с таким ID
        if any(d.get('id') == new_dish.get('id') for d in dishes):
            return jsonify({'error': 'Dish with this id already exists'}), 400
        
        dishes.append(new_dish)
        
        DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
        with open(DATA_PATH, 'w', encoding='utf-8') as f:
            json.dump(dishes, f, ensure_ascii=False, indent=2)
        
        return jsonify({'status': 'ok', 'dish': new_dish})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/dishes/<dish_id>', methods=['DELETE'])
@login_required
def delete_dish(dish_id):
    """Удаление блюда"""
    try:
        if not DATA_PATH.exists():
            return jsonify({'error': 'menu-database.json not found'}), 404
        
        with open(DATA_PATH, 'r', encoding='utf-8') as f:
            dishes = json.load(f)
        
        original_count = len(dishes)
        dishes = [d for d in dishes if d.get('id') != dish_id]
        
        if len(dishes) == original_count:
            return jsonify({'error': 'Dish not found'}), 404
        
        with open(DATA_PATH, 'w', encoding='utf-8') as f:
            json.dump(dishes, f, ensure_ascii=False, indent=2)
        
        return jsonify({'status': 'ok'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ========== ЗАПУСК СЕРВЕРА ==========

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'
    app.run(debug=debug, port=port, host='0.0.0.0')

