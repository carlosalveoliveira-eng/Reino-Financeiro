import React, {lazy, Suspense} from 'react';
import {createRoot} from 'react-dom/client';
import Portfolio from '../components/portfolio';
const Workspace=lazy(()=>import('./workspace'));
import './globals.css';
const isDemo=/^\/demo(?:\/index\.html)?\/?$/.test(location.pathname);
createRoot(document.getElementById('root')!).render(<React.StrictMode><Suspense fallback={<p className="loading">Preparando seu reino…</p>}>{isDemo?<Workspace name="Viajante" demo/>:<Portfolio/>}</Suspense></React.StrictMode>);
