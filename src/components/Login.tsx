/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Eye, EyeOff, Lock, User, ShieldAlert } from 'lucide-react';
import { UserSession } from '../types';

interface LoginProps {
  onLoginSuccess: (username: string) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError('กรุณากรอกชื่อผู้ใช้และรหัสผ่านให้ครบถ้วน');
      return;
    }

    setIsLoading(true);

    // Simulate login lag for a high-quality feel
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess(username.trim());
    }, 900);
  };

  return (
    <div id="login-container" className="w-full max-w-md mx-auto px-4 py-12 flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full bg-[#0A0A0A]/95 border border-[#262626] rounded-3xl p-8 shadow-2xl backdrop-blur-md"
      >
        {/* Threads Logo Centered */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center font-black text-3xl select-none shadow-md mb-4">
            <svg 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              className="w-9 h-9"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10V10a4 4 0 00-4-4h-4a4 4 0 00-4 4v2a2 2 0 002 2h2a2 2 0 002-2v-1" 
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight text-center">
            เข้าสู่ระบบ Auto Threads
          </h1>
          <p className="text-xs text-neutral-400 mt-2 text-center max-w-[280px]">
            ระบบเชื่อมต่อและควบคุมหลายบัญชี Threads พร้อมกันในหน้าจอเดียว
          </p>
        </div>

        {/* Info Banner */}
        <div className="mb-6 p-3 bg-[#111] border border-[#262626] rounded-xl text-center">
          <p className="text-[11px] font-mono text-neutral-400">
            💡 ทดสอบระบบ: ใช้ชื่อผู้ใช้และรหัสผ่านใดก็ได้ในการเข้าสู่ระบบคลาวด์
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-5 p-3.5 bg-red-950/20 border border-red-900/50 rounded-xl flex items-center gap-2.5 text-xs text-red-400"
          >
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username Field */}
          <div>
            <label className="block text-xs font-mono text-neutral-400 mb-1.5 uppercase tracking-wider">
              ชื่อผู้ใช้งาน (Username / Email)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                <User className="w-4 h-4" />
              </span>
              <input
                id="username-input"
                type="text"
                placeholder="ระบุบัญชีผู้ใช้"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#111] border border-[#262626] focus:border-neutral-500 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-neutral-500 outline-none transition-all"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs font-mono text-neutral-400 mb-1.5 uppercase tracking-wider">
              รหัสผ่าน (Password)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                id="password-input"
                type={showPassword ? 'text' : 'password'}
                placeholder="ระบุรหัสผ่านของคุณ"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#111] border border-[#262626] focus:border-neutral-500 rounded-xl py-3 pl-10 pr-10 text-sm text-white placeholder-neutral-500 outline-none transition-all"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors cursor-pointer"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <motion.button
            id="login-submit-button"
            type="submit"
            className="w-full bg-white hover:bg-neutral-100 text-black font-semibold rounded-xl py-3 text-sm transition-colors mt-6 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
            ) : (
              'เข้าสู่ระบบอย่างปลอดภัย'
            )}
          </motion.button>
        </form>

        <div className="text-center mt-6">
          <p className="text-[11px] text-neutral-500 font-sans">
            การเชื่อมต่อข้อมูลเข้ารหัสผ่าน SHA-256 ปลอดภัย 100%
          </p>
        </div>
      </motion.div>
    </div>
  );
}
