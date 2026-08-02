/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Trash2, Shield, UserPlus, CheckCircle2, AlertTriangle, 
  Sparkles, Globe, Key, ExternalLink, Lock, RefreshCw 
} from 'lucide-react';
import { ThreadsAccount } from '../types';

interface AccountManagerProps {
  accounts: ThreadsAccount[];
  onAddAccount: (username: string, displayName: string, followers: number, accessToken?: string, threadsUserId?: string) => void;
  onRemoveAccount: (id: string) => void;
}

export default function AccountManager({ accounts, onAddAccount, onRemoveAccount }: AccountManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [addMode, setAddMode] = useState<'oauth' | 'manual'>('oauth');

  // Manual inputs
  const [manualUsername, setManualUsername] = useState('');
  const [manualDisplayName, setManualDisplayName] = useState('');

  // Real OAuth Connection states
  const [isOAuthConnecting, setIsOAuthConnecting] = useState(false);
  const [oauthStatus, setOauthStatus] = useState<'idle' | 'loading' | 'error_missing' | 'error_other'>('idle');
  const [oauthErrorMsg, setOauthErrorMsg] = useState<string | null>(null);

  const handleAddManualAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualUsername.trim()) return;

    const formattedUsername = manualUsername.trim().startsWith('@') 
      ? manualUsername.trim() 
      : `@${manualUsername.trim()}`;
    const formattedDisplayName = manualDisplayName.trim() || formattedUsername.replace('@', '');

    onAddAccount(formattedUsername, formattedDisplayName, 1250);
    setManualUsername('');
    setManualDisplayName('');
    setIsOpen(false);
  };

  // Handle Real OAuth button click
  const handleConnectRealOAuth = async () => {
    setIsOAuthConnecting(true);
    setOauthStatus('loading');
    setOauthErrorMsg(null);

    const redirectUri = `${window.location.origin}/auth/callback`;
    const clientId = '970861742646304';
    const fallbackOAuthUrl = `https://www.threads.net/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=threads_basic,threads_content_publish&response_type=code&prompt=consent`;

    let targetUrl = fallbackOAuthUrl;

    try {
      const response = await fetch(`/api/threads/auth-url?redirect_uri=${encodeURIComponent(redirectUri)}&t=${Date.now()}`);
      if (response.ok) {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await response.json();
          if (data.url) {
            targetUrl = data.url;
          }
        }
      }
    } catch {
      // If server is cold-starting or returning 404, fallback directly to fallbackOAuthUrl
    }

    try {
      setOauthStatus('idle');

      const width = 580;
      const height = 650;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const authWindow = window.open(
        targetUrl,
        `threads_oauth_popup_${Date.now()}`,
        `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,resizable=yes`
      );

      if (!authWindow) {
        setOauthStatus('error_other');
        setOauthErrorMsg('เบราว์เซอร์ของคุณบล็อกป็อปอัป กรุณาอนุญาตให้เปิดป็อปอัปแล้วลองใหม่อีกครั้ง');
      }
    } catch (err: any) {
      console.error(err);
      setOauthStatus('error_other');
      setOauthErrorMsg(err.message || 'เกิดข้อผิดพลาดในการเปิดระบบยืนยันตัวตนของ Threads');
    } finally {
      setIsOAuthConnecting(false);
    }
  };

  return (
    <div id="account-manager-card" className="bg-[#0A0A0A]/90 border border-[#262626] rounded-2xl p-6 shadow-xl backdrop-blur-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-neutral-300" />
            การเชื่อมต่อบัญชี Threads ({accounts.length} บัญชี)
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            เชื่อมต่อหลายบัญชี Threads จริงเพื่อควบคุม สั่งโพสต์ และตั้งเวลาเผยแพร่พร้อมกันในระบบเดียว
          </p>
        </div>

        <motion.button
          id="toggle-add-account-modal"
          onClick={() => {
            setIsOpen(!isOpen);
            setOauthStatus('idle');
          }}
          className="bg-white hover:bg-neutral-100 text-black text-xs font-semibold px-4 py-2.5 rounded-full flex items-center justify-center gap-1.5 transition-colors cursor-pointer self-start sm:self-center shadow-md"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus className="w-4 h-4" />
          {isOpen ? 'ปิดหน้าต่าง' : accounts.length === 0 ? '+ เข้าสู่ระบบบัญชี Threads' : '+ เพิ่มบัญชี Threads อีกบัญชี'}
        </motion.button>
      </div>

      {/* Slide-out Add Account Form / OAuth Gateway */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-6 bg-[#111] border border-[#262626] rounded-xl p-6 space-y-5"
          >
            {/* Tab Switcher */}
            <div className="flex border-b border-[#262626]">
              <button
                type="button"
                onClick={() => setAddMode('oauth')}
                className={`pb-3 text-xs font-bold px-4 border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                  addMode === 'oauth'
                    ? 'border-white text-white'
                    : 'border-transparent text-neutral-500 hover:text-neutral-300'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>เข้าสู่ระบบด้วย Meta Threads OAuth</span>
              </button>
              <button
                type="button"
                onClick={() => setAddMode('manual')}
                className={`pb-3 text-xs font-bold px-4 border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                  addMode === 'manual'
                    ? 'border-white text-white'
                    : 'border-transparent text-neutral-500 hover:text-neutral-300'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>เพิ่มบัญชีด่วนด้วยชื่อผู้ใช้ (Username)</span>
              </button>
            </div>

            {addMode === 'oauth' ? (
              <div className="space-y-4 pt-1">
                {oauthStatus === 'idle' && (
                  <div className="text-center py-3 space-y-4">
                    <div className="max-w-md mx-auto space-y-1.5">
                      <div className="w-10 h-10 rounded-2xl bg-[#1A1A1A] border border-[#333] flex items-center justify-center mx-auto text-white shadow-inner">
                        <Lock className="w-5 h-5 text-emerald-400" />
                      </div>
                      <h4 className="text-sm font-bold text-white">
                        {accounts.length === 0 
                          ? 'เข้าสู่ระบบบัญชี Threads ผ่าน Meta OAuth' 
                          : `เข้าสู่ระบบเพิ่มบัญชีที่ ${accounts.length + 1}`}
                      </h4>
                      <p className="text-[11px] text-neutral-400 leading-relaxed">
                        เปิดหน้าต่างล็อกอินของ Threads โดยตรง ปลอดภัยและเชื่อมต่อกับ Meta API
                      </p>
                    </div>

                    <div className="flex justify-center pt-1">
                      <button
                        id="btn-connect-threads-oauth"
                        type="button"
                        onClick={handleConnectRealOAuth}
                        disabled={isOAuthConnecting}
                        className="bg-white hover:bg-neutral-100 disabled:bg-neutral-800 disabled:text-neutral-600 text-black text-xs font-bold px-7 py-3 rounded-xl inline-flex items-center gap-2 transition-all cursor-pointer shadow-lg justify-center w-full sm:w-auto"
                      >
                        {isOAuthConnecting ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Globe className="w-4 h-4 text-black" />
                        )}
                        <span>
                          {accounts.length === 0 
                            ? 'เข้าสู่ระบบ Threads ด้วย OAuth' 
                            : `เข้าสู่ระบบเพื่อเพิ่มบัญชี Threads ที่ ${accounts.length + 1}`}
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                {oauthStatus === 'loading' && (
                  <div className="text-center py-8 space-y-3">
                    <RefreshCw className="w-8 h-8 text-white animate-spin mx-auto" />
                    <p className="text-xs text-neutral-400">กำลังเปิดหน้าต่างยืนยันตัวตน Threads...</p>
                  </div>
                )}

                {oauthStatus === 'error_other' && (
                  <div className="space-y-4 text-center py-3">
                    <div className="p-3 bg-red-950/20 border border-red-900/30 rounded-xl text-xs text-red-400 flex items-center gap-2 justify-center">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{oauthErrorMsg || 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง'}</span>
                    </div>
                    <div className="flex justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => setOauthStatus('idle')}
                        className="px-4 py-2 rounded-xl text-xs text-neutral-400 hover:text-white hover:bg-[#1a1a1a] border border-[#262626] transition-all cursor-pointer"
                      >
                        ลองใหม่อีกครั้ง
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleAddManualAccount} className="space-y-4 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-neutral-300">
                      ชื่อผู้ใช้ Threads (Username) <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="@my_threads_account"
                      value={manualUsername}
                      onChange={(e) => setManualUsername(e.target.value)}
                      className="w-full bg-[#0A0A0A] border border-[#262626] focus:border-white rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 outline-none transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-neutral-300">
                      ชื่อแสดงผล (Display Name)
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น ร้านค้าออนไลน์ Official"
                      value={manualDisplayName}
                      onChange={(e) => setManualDisplayName(e.target.value)}
                      className="w-full bg-[#0A0A0A] border border-[#262626] focus:border-white rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="bg-white hover:bg-neutral-100 text-black text-xs font-bold px-5 py-2 rounded-xl cursor-pointer shadow-md transition-colors inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>เพิ่มบัญชีลงในระบบ</span>
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connected Accounts List */}
      {accounts.length === 0 ? (
        <div className="border border-dashed border-[#262626] rounded-xl p-8 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#111] border border-[#262626] flex items-center justify-center text-neutral-500">
            <Plus className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-neutral-300 font-medium">ยังไม่มีบัญชี Threads เชื่อมต่ออยู่</p>
            <p className="text-[10px] text-neutral-500 mt-0.5">กดปุ่ม "เชื่อมต่อบัญชีใหม่" ด้านบนเพื่อเริ่มเข้าสู่ระบบ</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {accounts.map((account) => {
              return (
                <motion.div
                  key={account.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-4 rounded-xl flex items-center justify-between gap-3 transition-all group border border-[#262626] bg-[#111] hover:border-neutral-500"
                >
                  {/* Account Details */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-[#262626] border border-[#333] flex items-center justify-center font-bold text-white shrink-0 relative overflow-hidden">
                      {account.avatarUrl && (account.avatarUrl.startsWith('http') || account.avatarUrl.startsWith('data:')) ? (
                        <img 
                          src={account.avatarUrl} 
                          alt={account.username} 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="text-sm font-sans">
                          {account.displayName.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                      
                      {/* Active Status Ring */}
                      <span className="absolute bottom-0 right-0 w-3 h-3 border-2 border-neutral-900 rounded-full bg-emerald-500" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <p className="text-xs font-semibold text-white truncate max-w-[100px]">
                          {account.displayName}
                        </p>
                        {account.accessToken || account.isRealOAuth ? (
                          <span className="text-[8px] bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 px-1.5 py-0.5 rounded shrink-0 font-medium flex items-center gap-1">
                            <Globe className="w-2.5 h-2.5" />
                            บัญชีจริง (API)
                          </span>
                        ) : (
                          <span className="text-[8px] bg-neutral-900 border border-neutral-800 text-neutral-300 px-1.5 py-0.5 rounded shrink-0 font-medium">
                            เชื่อมต่อแล้ว
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-mono text-neutral-400 truncate mt-0.5">
                        {account.username}
                      </p>
                      <p className="text-[9px] font-mono text-neutral-500 mt-1">
                        พร้อมใช้งาน
                      </p>
                    </div>
                  </div>

                  {/* Disconnect / Trash Button */}
                  <motion.button
                    id={`remove-account-${account.id}`}
                    onClick={() => onRemoveAccount(account.id)}
                    className="p-2 rounded-lg border border-[#262626] hover:border-red-900/50 text-neutral-500 hover:text-red-400 hover:bg-red-950/20 opacity-60 group-hover:opacity-100 transition-all cursor-pointer"
                    title="ตัดการเชื่อมต่อบัญชี"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </motion.button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
