import { useState, useEffect } from 'react';
import WantedPosterScene from './components/WantedPosterScene';
import ChatDialog from './components/ChatDialog';
import './App.css';

interface NavLink { label: string; href: string; }

export default function App() {
  const [links, setLinks] = useState<NavLink[]>([]);

  useEffect(() => {
    // Use VITE_PROFILE_URL if provided (e.g. injected at build time on GitHub Pages).
    // Otherwise only attempt the local public/profile.json in dev — in production it is
    // gitignored and not deployed, so skip the fetch to avoid a 404.
    const url = import.meta.env.VITE_PROFILE_URL
      || (import.meta.env.DEV ? import.meta.env.BASE_URL + 'profile.json' : '');
    if (!url) return;
    fetch(url)
      .then(r => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(d => { if (Array.isArray(d.links)) setLinks(d.links); })
      .catch(() => {});
  }, []);

  return (
    <div className="app">
      <WantedPosterScene />

      <nav className="nav-menu">
        {links.map(({ label, href }) => (
          <a key={href} href={href} target="_blank" rel="noopener noreferrer">
            {label}
          </a>
        ))}
        <ChatDialog />
      </nav>
    </div>
  );
}
