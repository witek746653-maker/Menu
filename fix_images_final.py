#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json
import os
import re
from pathlib import Path

def get_expected_names():
    """Получает список ожидаемых имен из precache-files.json"""
    with open('precache-files.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    expected = {}
    for item in data:
        if isinstance(item, str) and item.startswith('images/'):
            filename = item.replace('images/', '')
            # Для файлов в подпапках сохраняем полный путь
            if '/' in filename:
                folder, name = filename.rsplit('/', 1)
                key = f"{folder}/{name}"
            else:
                key = filename
            expected[key.lower()] = filename
    
    return expected

def extract_correct_name(broken_name, expected_names, file_path):
    """Извлекает правильное имя из сломанного имени файла"""
    broken_lower = broken_name.lower()
    
    # Извлекаем расширение
    ext_match = re.search(r'\.(jpg|png|webp|jpeg)', broken_lower)
    ext = ext_match.group(1) if ext_match else 'jpg'
    
    # Метод 1: Ищем правильное имя после .Value.ToLower()
    # Имя может быть разбито на символы: k-va-ri-um-m-or-sk-oy...
    match = re.search(r'\.value\.tolower\(\)([a-z-]+\.(jpg|png|webp|jpeg))', broken_lower)
    if match:
        broken_part = match.group(1)
        # Убираем все дефисы из разбитого имени
        cleaned = broken_part.replace('-', '').replace('_', '').replace('.' + ext, '')
        # Ищем в expected_names
        for expected_key, expected_value in expected_names.items():
            expected_clean = expected_key.lower().replace('-', '').replace('_', '').replace('/', '').replace('.' + ext, '')
            if cleaned == expected_clean:
                # Проверяем путь
                if file_path.parent.name in expected_value or '/' not in expected_value:
                    return expected_value.split('/')[-1] if '/' in expected_value else expected_value
    
    # Метод 2: Если имя просто разбито на символы (b-ar-h-ea-d.j-pg)
    # Убираем все дефисы и точки, оставляем только буквы и цифры
    cleaned_all = re.sub(r'[^a-z0-9]', '', broken_lower)
    # Ищем в expected_names
    for expected_key, expected_value in expected_names.items():
        expected_clean = re.sub(r'[^a-z0-9]', '', expected_key.lower())
        if cleaned_all == expected_clean:
            # Проверяем путь
            if file_path.parent.name in expected_value or '/' not in expected_value:
                return expected_value.split('/')[-1] if '/' in expected_value else expected_value
    
    # Метод 3: Пытаемся извлечь имя из начала (до .Value)
    if '.value' in broken_lower:
        before_value = broken_lower.split('.value')[0]
        # Убираем все дефисы и точки
        cleaned = re.sub(r'[^a-z0-9]', '', before_value)
        # Ищем в expected_names
        for expected_key, expected_value in expected_names.items():
            expected_clean = re.sub(r'[^a-z0-9]', '', expected_key.lower())
            if cleaned.endswith(expected_clean) or expected_clean in cleaned:
                if file_path.parent.name in expected_value or '/' not in expected_value:
                    return expected_value.split('/')[-1] if '/' in expected_value else expected_value
    
    return None

def fix_image_names():
    """Исправляет имена файлов в папке images"""
    images_dir = Path('images')
    expected_names = get_expected_names()
    
    print(f"Загружено ожидаемых имен: {len(expected_names)}")
    
    # Получаем все файлы
    all_files = list(images_dir.rglob('*'))
    files_to_fix = []
    
    for file_path in all_files:
        if file_path.is_file():
            name = file_path.name
            
            # Проверяем, нужно ли исправлять - более широкие условия
            needs_fix = False
            if '.Value.ToLower' in name or '.Value.T' in name:
                needs_fix = True
            elif re.match(r'^[A-Za-z]-[a-z]', name) and name.count('-') > 10:
                needs_fix = True
            elif name.count('-') > 20:  # Очень много дефисов
                needs_fix = True
            
            if needs_fix:
                # Пытаемся найти правильное имя
                correct_name = extract_correct_name(name, expected_names, file_path)
                
                if correct_name:
                    # Если это файл в подпапке, берем только имя
                    if '/' in correct_name:
                        correct_name = correct_name.split('/')[-1]
                    files_to_fix.append((file_path, correct_name))
                else:
                    # Если не нашли, выводим для отладки
                    if len(files_to_fix) < 5:
                        print(f"DEBUG: Не найдено соответствие для: {name[:60]}")
    
    print(f"Найдено файлов для исправления: {len(files_to_fix)}")
    
    # Переименовываем файлы
    fixed = 0
    skipped = 0
    for old_path, new_name in files_to_fix:
        new_path = old_path.parent / new_name
        if not new_path.exists():
            try:
                old_path.rename(new_path)
                fixed += 1
                if fixed <= 20:  # Показываем первые 20
                    print(f"OK: {old_path.name[:40]}... -> {new_name}")
            except Exception as e:
                print(f"ERROR: {old_path.name}: {e}")
        else:
            skipped += 1
    
    print(f"\nИсправлено файлов: {fixed}")
    print(f"Пропущено (уже существуют): {skipped}")

if __name__ == '__main__':
    fix_image_names()

