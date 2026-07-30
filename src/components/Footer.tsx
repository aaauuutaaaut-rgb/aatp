/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Shield, HelpCircle, FileText, Heart } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer 
      id="main-app-footer"
      className="w-full bg-black border-t border-[#262626] py-6 px-4 sm:px-6 lg:px-8 mt-auto text-[10px] text-gray-500 font-medium"
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left side info */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left gap-1">
          <p className="text-xs font-sans text-neutral-400">
            &copy; {currentYear} <span className="text-white font-semibold">Auto Threads</span>. พัฒนาขึ้นเพื่อการบริหารจัดการหลายบัญชีในที่เดียว
          </p>
          <div className="flex flex-wrap gap-3 text-[10px] text-neutral-500 font-mono mt-1">
            <span>Version 2.4.0-stable</span>
            <span>&bull;</span>
            <span>API Latency: 42ms</span>
            <span>&bull;</span>
            <span>Server Status: Active</span>
          </div>
        </div>

        {/* Middle icons/links */}
        <div className="flex items-center gap-6 text-xs text-neutral-400 font-sans">
          <a href="#terms" className="hover:text-white transition-colors flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" />
            ข้อกำหนดการใช้งาน
          </a>
          <a href="#privacy" className="hover:text-white transition-colors flex items-center gap-1">
            <Shield className="w-3.5 h-3.5" />
            นโยบายความเป็นส่วนตัว
          </a>
          <a href="#support" className="hover:text-white transition-colors flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5" />
            ช่วยเหลือ
          </a>
        </div>

        {/* Right side tribute & status dot */}
        <div className="flex items-center gap-4 text-[10px] font-mono text-neutral-400">
          <div className="flex items-center gap-1.5">
            <span>Created with</span>
            <Heart className="w-3 h-3 text-white fill-white/10" />
            <span>for automated workflows</span>
          </div>
          <div className="flex items-center gap-1.5 bg-[#111] px-2.5 py-1 rounded-full border border-[#262626]">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-white">System Online</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
