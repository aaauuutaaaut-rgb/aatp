/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LogOut, Users, Settings, Activity } from 'lucide-react';
import { motion } from 'motion/react';
import { UserSession, ThreadsAccount } from '../types';

interface HeaderProps {
  session: UserSession | null;
  accounts: ThreadsAccount[];
  onLogout: () => void;
}

export default function Header({ session, accounts, onLogout }: HeaderProps) {
  const activeCount = accounts.filter(a => a.status === 'active').length;

  return (
    <header 
      id="main-app-header"
      className="sticky top-0 z-40 w-full bg-black/80 backdrop-blur-md border-b border-[#262626] transition-all"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <motion.div
            className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center font-black text-xl select-none text-white"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="w-4 h-4 rounded-full border-2 border-white" />
          </motion.div>
          <div className="flex flex-col">
            <span className="font-sans font-bold tracking-tight text-white text-base sm:text-lg">
              Auto Threads
            </span>
            <span className="text-[10px] font-mono text-neutral-500 tracking-wider uppercase">
              Automation Console
            </span>
          </div>
        </div>

        {/* User / Session Info & Actions */}
        {session && session.isLoggedIn && (
          <div className="flex items-center gap-4">
            {/* Accounts Pills - Hidden on extra small, shown on sm+ */}
            <div className="hidden sm:flex items-center gap-2 bg-[#111] border border-[#262626] rounded-full px-3 py-1 text-xs">
              <Users className="w-3.5 h-3.5 text-neutral-400" />
              <span className="font-sans text-neutral-300 font-medium">{activeCount} บัญชีเชื่อมต่อ</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            {/* User status */}
            <div className="flex items-center gap-2 bg-[#0A0A0A] border border-[#262626] rounded-full px-3 py-1 text-xs">
              <div className="w-2 h-2 rounded-full bg-white" />
              <span className="font-mono text-neutral-300 max-w-[80px] sm:max-w-[120px] truncate">
                {session.username}
              </span>
            </div>

            {/* Logout Button */}
            <motion.button
              id="logout-button"
              onClick={onLogout}
              className="flex items-center justify-center p-2 rounded-full border border-[#262626] hover:border-red-900/60 text-neutral-400 hover:text-red-400 hover:bg-red-950/20 transition-all cursor-pointer"
              title="ออกจากระบบ"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <LogOut className="w-4 h-4" />
            </motion.button>
          </div>
        )}
      </div>
    </header>
  );
}
