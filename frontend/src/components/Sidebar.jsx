import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, CheckSquare, LogOut, User, Moon, Sun, X } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import clsx from 'clsx';

const Sidebar = ({ onClose }) => {
  const { user, logout } = useContext(AuthContext);
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Projects', path: '/projects', icon: FolderKanban },
    { name: 'Tasks', path: '/tasks', icon: CheckSquare },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <div className="w-64 shrink-0 bg-surface shadow-md border-r border-border h-full flex flex-col justify-between z-10 relative">
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-primary tracking-wider">ETHARA</h2>
          <button onClick={onClose} className="md:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
            <X size={20} />
          </button>
        </div>
        <nav className="space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                  isActive
                    ? 'bg-primary text-white shadow-md shadow-primary/30'
                    : 'text-text-muted hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-text'
                )
              }
            >
              <item.icon size={20} />
              <span className="font-medium">{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="p-5 border-t border-border bg-slate-50/50 dark:bg-slate-800/50">
        <div className="flex items-center justify-between mb-4">
           <div className="flex items-center gap-3">
             <div className="h-10 w-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold shrink-0">
               {user?.name?.charAt(0).toUpperCase()}
             </div>
             <div className="overflow-hidden">
               <p className="text-sm font-bold text-text truncate">{user?.name}</p>
               <span className="inline-block mt-0.5 px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded text-[10px] font-bold uppercase tracking-wider">
                 {user?.role}
               </span>
             </div>
           </div>
           <button onClick={toggleTheme} className="p-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
           </button>
        </div>
        
        <button
          onClick={logout}
          className="flex w-full items-center justify-center gap-2 px-4 py-2 text-slate-500 bg-surface border border-border shadow-sm hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 hover:border-red-200 dark:hover:border-red-900/50 rounded-xl transition-all duration-200"
        >
          <LogOut size={16} />
          <span className="font-medium text-sm">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
