import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import MenuPage from './pages/MenuPage';
import DishDetailPage from './pages/DishDetailPage';
import AdminPage from './pages/AdminPage';
import DishEditPage from './pages/DishEditPage';
import WineMenuPage from './pages/WineMenuPage';
import WineCatalogPage from './pages/WineCatalogPage';
import WineItemPage from './pages/WineItemPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/menu/:menuName" element={<MenuPage />} />
          <Route path="/dish/:id" element={<DishDetailPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin/edit/:id" element={<DishEditPage />} />
          <Route path="/admin/add" element={<DishEditPage />} />
          <Route path="/wine-menu" element={<WineMenuPage />} />
          <Route path="/wine-catalog/:category" element={<WineCatalogPage />} />
          <Route path="/wine-item/:id" element={<WineItemPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

