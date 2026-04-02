import { Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Builder from './pages/Builder';
import FillForm from './pages/FillForm';
import AnalyticsPage from './pages/Analytics';
import './App.css';

export default function App() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="logo">FormWeave</Link>
        <nav className="topbar-nav">
          <Link to="/">Dashboard</Link>
        </nav>
      </header>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/builder/:id" element={<Builder />} />
        <Route path="/f/:slug" element={<FillForm />} />
        <Route path="/analytics/:id" element={<AnalyticsPage />} />
      </Routes>
    </div>
  );
}
