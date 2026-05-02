import { useState, useEffect } from 'react';
import WantedPosterScene from './components/WantedPosterScene';
import ChatDialog from './components/ChatDialog';
import './App.css';

interface NavLink { label: string; href: string; }

export default function App() {
  const [links, setLinks] = useState<NavLink[]>([]);

  useEffect(() => {
    const url = import.meta.env.VITE_PROFILE_URL || (import.meta.env.BASE_URL + 'profile.json');
    fetch(url)
      .then(r => r.json())
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
