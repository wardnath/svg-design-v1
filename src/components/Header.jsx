import React from 'react';

export default function Header() {
  return (
    <header className="top">
      <svg className="mark" width="24" height="24" viewBox="0 0 34 34" aria-hidden="true">
        <g fill="none" strokeWidth="1.8">
          <g stroke="var(--plate-d)"><circle cx="16" cy="16" r="9" /><circle cx="16" cy="16" r="4.2" /><path d="M16 2v28M2 16h28" /></g>
          <g stroke="var(--plate-m)" opacity="0.9"><circle cx="18.2" cy="18.2" r="9" /><circle cx="18.2" cy="18.2" r="4.2" /><path d="M18.2 4.2v28M4.2 18.2h28" /></g>
        </g>
      </svg>
      <h1>Redline <span className="v">v2.4</span></h1>
      <p className="tagline">design ⟷ build, compared as pixels, at any viewport</p>
    </header>
  );
}
