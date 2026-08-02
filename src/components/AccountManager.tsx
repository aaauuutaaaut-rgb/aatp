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

  // Real OAuth Connection states
  const [isOAuthConnecting, setIsOAuthConnecting] = useState(false);
  const [oauthStatus, setOauthStatus] = useState<'idle' | 'loading' | 'error_missing' | 'error_other'>('idle');
  const [oauthErrorMsg, setOauthErrorMsg] = useState<string | null>(null);

  // Handle Real OAuth button click
  const handleConnectRealOAuth = async () => {
    setIsOAuthConnecting(true);
    setOauthStatus('loading');
    setOauthErrorMsg(null);

    try {
      const redirectUri = `${window.location.origin}/auth/callback`;
      // Append timestamp parameter to bypass cache and guarantee a fresh OAuth session request
      const response = await fetch(`/api/threads/auth-url?redirect_uri=${encodeURIComponent(redirectUri)}&t=${Date.now()}`);
      
      const contentType = response.headers.get('content-type') || '';
      let data: any = {};
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const rawText = await response.text();
        throw new Error(`เซิร์ฟเวอร์ตอบกลับรูปแบบไม่ถูกต้อง (HTTP ${response.status}): ${rawText.slice(0, 120)}`);
      }

      if (!response.ok) {
        if (data.error === 'credentials_missing') {
          setOauthStatus('error_missing');
          return;
        }
        throw new Error(data.message || 'ไม่สามารถติดต่อเซิร์ฟเวอร์เพื่อเชื่อมต่อ OAuth ได้');
      }

      setOauthStatus('idle');

      const width = 580;
      const height = 650;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const authWindow = window.open(
        data.url,
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
            className="overflow-hidden mb-6 bg-[#111] border border-[#262626] rounded-xl p-6"
          >
            <div className="space-y-4">
              {oauthStatus === 'idle' && (
                <div className="text-center py-4 space-y-5">
                  <div className="max-w-md mx-auto space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-[#1A1A1A] border border-[#333] flex items-center justify-center mx-auto text-white shadow-inner">
                      <Lock className="w-6 h-6 text-emerald-400" />
                    </div>
                    <h4 className="text-sm font-bold text-white">
                      {accounts.length === 0 
                        ? 'เข้าสู่ระบบบัญชี Threads ของคุณ' 
                        : `เข้าสู่ระบบเพื่อเพิ่มบัญชี Threads ที่ ${accounts.length + 1}`}
                    </h4>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      เข้าสู่ระบบและอนุมัติสิทธิ์เข้าถึงบัญชี Threads ของคุณผ่านระบบ Meta Official OAuth ปลอดภัยและใช้งานได้จริง
                    </p>
                  </div>

                  <div className="flex justify-center pt-1">
                    <button
                      id="btn-connect-threads-oauth"
                      type="button"
                      onClick={handleConnectRealOAuth}
                      disabled={isOAuthConnecting}
                      className="bg-white hover:bg-neutral-100 disabled:bg-neutral-800 disabled:text-neutral-600 text-black text-xs font-bold px-7 py-3.5 rounded-xl inline-flex items-center gap-2 transition-all cursor-pointer shadow-lg justify-center w-full sm:w-auto"
                    >
                      {isOAuthConnecting ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Globe className="w-4 h-4 text-black" />
                      )}
                      <span>
                        {accounts.length === 0 
                          ? 'เข้าสู่ระบบ Threads ด้วย OAuth API' 
                          : `เข้าสู่ระบบเพื่อเพิ่มบัญชี Threads ที่ ${accounts.length + 1}`}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {oauthStatus === 'loading' && (
                <div className="text-center py-10 space-y-3">
                  <RefreshCw className="w-8 h-8 text-white animate-spin mx-auto" />
                  <p className="text-xs text-neutral-400">กำลังเปิดหน้าต่างยืนยันตัวตน Threads และรอการอนุมัติสิทธิ์...</p>
                </div>
              )}

              {oauthStatus === 'error_missing' && (
                <div className="space-y-4">
                  <div className="p-5 bg-amber-950/20 border border-amber-900/40 rounded-xl space-y-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-amber-400">
                          ยังไม่ได้เปิดใช้งาน THREADS_CLIENT_ID บนเซิร์ฟเวอร์
                        </h4>
                        <p className="text-[11px] text-neutral-300 mt-1 leading-relaxed">
                          หากต้องการเข้าสู่ระบบ Meta Threads OAuth จริง กรุณาระบุรหัสแอป <code className="bg-[#111] px-1 py-0.5 rounded text-amber-300 font-mono">THREADS_CLIENT_ID</code> และ <code className="bg-[#111] px-1 py-0.5 rounded text-amber-300 font-mono">THREADS_CLIENT_SECRET</code> ในตัวแปรสภาพแวดล้อม (.env) บนเซิร์ฟเวอร์
                        </p>
                      </div>
                    </div>

                    <div className="bg-[#0A0A0A]/80 border border-[#262626] p-3 rounded-lg space-y-1 text-[10px] font-mono text-neutral-400">
                      <div className="flex justify-between items-center text-white font-semibold uppercase tracking-wider text-[9px] mb-1">
                        <span>OAuth Redirect URI:</span>
                      </div>
                      <p className="text-white select-all bg-[#151515] p-2 rounded mt-1 border border-[#262626] font-semibold break-all">
                        {window.location.origin}/auth/callback
                      </p>
                    </div>

                    <div className="pt-2 flex justify-center">
                      <button
                        type="button"
                        onClick={handleConnectRealOAuth}
                        className="bg-white hover:bg-neutral-200 text-black text-xs font-bold px-6 py-2.5 rounded-xl cursor-pointer shadow-md flex items-center justify-center gap-2"
                      >
                        <Globe className="w-4 h-4 text-black" />
                        <span>ลองเชื่อมต่อ OAuth อีกครั้ง</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {oauthStatus === 'error_other' && (
                <div className="space-y-4 text-center py-4">
                  <div className="p-3.5 bg-red-950/20 border border-red-900/30 rounded-xl text-xs text-red-400 flex items-center gap-2 justify-center">
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
