import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Upload, FileText, Moon, Sun, Settings } from 'lucide-react';

const Layout = ({ children }) => {
  const location = useLocation();
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Toggle dark class on body
    if (darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [darkMode]);

  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Upload', href: '/upload', icon: Upload },
    // ...add other nav items here...
  ];

  return (
    <div className="min-h-screen relative font-sans">
      {/* Abstract Background Elements for Wow Factor */}
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-sky-400 opacity-20 blur-[100px] rounded-full mix-blend-multiply dark:mix-blend-screen bg-glow"></div>
        <div className="absolute top-40 -left-20 w-72 h-72 bg-indigo-500 opacity-20 blur-[100px] rounded-full mix-blend-multiply dark:mix-blend-screen bg-glow delay-150"></div>
      </div>

      {/* Floating Glass Navigation */}
      <header className="fixed top-0 inset-x-0 z-50 pt-4 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto nav-glass">
          <div className="flex items-center justify-between px-6 py-3">
            
            {/* Logo Area */}
            <Link to="/" className="flex items-center space-x-3 group animate-fade-up">
              <div className="p-2 bg-gradient-to-br from-slate-900 to-slate-800 dark:from-sky-500 dark:to-indigo-500 rounded-xl shadow-md group-hover:shadow-lg transition-all duration-300 transform group-hover:scale-105">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold font-heading text-slate-900 dark:text-white tracking-tight">Redline <span className="text-sky-600 dark:text-sky-400">AI</span></span>
            </Link>
            
            {/* Nav Links */}
            <div className="hidden md:flex items-center space-x-1 animate-fade-up delay-75">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`relative flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 overflow-hidden group ${
                      isActive 
                        ? 'text-sky-700 dark:text-sky-400' 
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <Icon className={`h-4 w-4 transition-transform duration-300 ${isActive ? '' : 'group-hover:scale-110'}`} />
                    <span>{item.name}</span>
                    {isActive && (
                      <span className="absolute bottom-0 inset-x-4 h-0.5 bg-gradient-to-r from-sky-500 to-indigo-500 rounded-t-full"></span>
                    )}
                  </Link>
                );
              })}
              
              <Link
                to="/library"
                className={`relative flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 overflow-hidden group ${
                  location.pathname === '/library'
                    ? 'text-sky-700 dark:text-sky-400' 
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-slate-800/50'
                }`}
              >
                <span>Library</span>
                {location.pathname === '/library' && (
                  <span className="absolute bottom-0 inset-x-4 h-0.5 bg-gradient-to-r from-sky-500 to-indigo-500 rounded-t-full"></span>
                )}
              </Link>
            </div>

            {/* Actions Area */}
            <div className="flex items-center space-x-2 animate-fade-up delay-150">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl transition-all duration-300 hover:shadow-md"
                aria-label="Toggle Dark Mode"
              >
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              <button className="p-2 text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl transition-all duration-300 hover:shadow-md">
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area - padded top to clear floating nav */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-32 pb-16">
        <div className="animate-scale-in">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
