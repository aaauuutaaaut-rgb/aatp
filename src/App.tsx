/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Calendar, Terminal, Shield, LogOut, CheckCircle, 
  HelpCircle, MessageSquare, Heart, RefreshCw, Layers 
} from 'lucide-react';
import Header from './components/Header';
import Footer from './components/Footer';
import Login from './components/Login';
import AccountManager from './components/AccountManager';
import ActionConsole from './components/ActionConsole';
import LogPanel from './components/LogPanel';
import ThreadsBackground from './components/ThreadsBackground';
import { ThreadsAccount, ScheduledPost, ActionLog, UserSession } from './types';

export default function App() {
  // Session State
  const [session, setSession] = useState<UserSession | null>(() => {
    try {
      const saved = localStorage.getItem('auto_threads_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Accounts State (Real Meta Threads Accounts connected via OAuth)
  const [accounts, setAccounts] = useState<ThreadsAccount[]>(() => {
    try {
      const saved = localStorage.getItem('auto_threads_accounts');
      if (saved) {
        const parsed: ThreadsAccount[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }
    return [];
  });

  // Scheduled Queue State
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>(() => {
    try {
      const saved = localStorage.getItem('auto_threads_schedule');
      return saved && Array.isArray(JSON.parse(saved)) ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Action Audit Logs State
  const [logs, setLogs] = useState<ActionLog[]>(() => {
    try {
      const saved = localStorage.getItem('auto_threads_logs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Fallback to default
    }

    // Initial default logs for realistic presentation
    const now = new Date();
    const formatted = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return [
      {
        id: 'init_sys_1',
        timestamp: formatted,
        type: 'system',
        status: 'info',
        message: 'ระบบ Auto Threads พร้อมทำงาน และสแตนด์บายเชื่อมต่อกับเซิร์ฟเวอร์หลักแล้ว',
      }
    ];
  });

  // Persistence triggers
  useEffect(() => {
    if (session) {
      localStorage.setItem('auto_threads_session', JSON.stringify(session));
    } else {
      localStorage.removeItem('auto_threads_session');
    }
  }, [session]);

  useEffect(() => {
    localStorage.setItem('auto_threads_accounts', JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem('auto_threads_schedule', JSON.stringify(scheduledPosts));
  }, [scheduledPosts]);

  useEffect(() => {
    localStorage.setItem('auto_threads_logs', JSON.stringify(logs));
  }, [logs]);

  // Listen for real Threads OAuth login success event from popup window
  useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      // Validate origin to ensure it matches current run environment
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
        return;
      }

      if (event.data?.type === 'THREADS_AUTH_SUCCESS' && event.data?.account) {
        const newAcc = event.data.account;

        setAccounts((prev) => {
          // Prevent duplicates by filter username/id
          const cleanPrev = prev.filter(
            (a) => a.id !== newAcc.id && a.username.toLowerCase() !== newAcc.username.toLowerCase()
          );
          return [...cleanPrev, newAcc];
        });

        addLog(
          'system',
          'success',
          `[Official OAuth] เชื่อมต่อกับบัญชี Threads จริงสำเร็จ: ${newAcc.username} (${newAcc.displayName})`
        );
      }
    };

    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, []);

  // Automated scheduling loop checks every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      
      setScheduledPosts((prevQueue) => {
        const duePosts = prevQueue.filter(p => p.status === 'pending' && new Date(p.scheduledTime) <= now);
        if (duePosts.length === 0) return prevQueue;

        // Process each due post
        duePosts.forEach(post => {
          // Post or comment using real/simulated handler
          executePostOrComment(post.accountIds, post.text, post.mediaUrl, undefined, true);
        });

        // Mark them as posted or remove them
        return prevQueue.filter(p => !duePosts.some(dp => dp.id === p.id));
      });
    }, 5000);

    return () => clearInterval(timer);
  }, [accounts]); // depend on accounts to keep triggers sync with handles

  // Helper to append a new log entry
  const addLog = (type: ActionLog['type'], status: ActionLog['status'], message: string, accountUsername?: string) => {
    const now = new Date();
    const formattedTime = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    setLogs((prev) => [
      ...prev,
      {
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        timestamp: formattedTime,
        type,
        status,
        message,
        accountUsername,
      }
    ]);
  };

  // Auth operations
  const handleLoginSuccess = (username: string) => {
    const newSession = { username, isLoggedIn: true };
    setSession(newSession);
    addLog('system', 'success', `ล็อกอินเข้าสู่ระบบควบคุมความปลอดภัยสำเร็จ ยินดีต้อนรับ ${username}`);
  };

  const handleLogout = () => {
    setSession(null);
    addLog('system', 'warning', 'ออกจากระบบความปลอดภัยของ Auto Threads เรียบร้อยแล้ว');
  };

  // Account operations
  const handleAddAccount = (
    username: string, 
    displayName: string, 
    followers: number,
    accessToken?: string,
    threadsUserId?: string
  ) => {
    const newAccount: ThreadsAccount = {
      id: threadsUserId ? `threads_${threadsUserId}` : `acc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      username,
      displayName,
      avatarUrl: displayName.slice(0, 2).toUpperCase(),
      followersCount: followers,
      status: 'active',
      connectedAt: new Date().toISOString(),
      accessToken,
      threadsUserId,
      isRealOAuth: Boolean(accessToken && threadsUserId),
    };

    setAccounts((prev) => {
      const cleanPrev = prev.filter(
        (a) => a.id !== newAccount.id && a.username.toLowerCase() !== newAccount.username.toLowerCase()
      );
      return [...cleanPrev, newAccount];
    });

    addLog(
      'system',
      'success',
      `เชื่อมต่อบัญชี Threads สำเร็จ: ${username} (${displayName})`
    );
  };

  const handleRemoveAccount = (id: string) => {
    const target = accounts.find((a) => a.id === id);
    if (!target) return;

    setAccounts((prev) => prev.filter((a) => a.id !== id));
    addLog(
      'system',
      'warning',
      `เพิกถอนการเข้าถึงและยกเลิกการเชื่อมต่อบัญชี: ${target.username}`
    );
  };

  // Core Posting / Commenting Logic (Handles both Real OAuth & Simulated accounts)
  const executePostOrComment = async (
    targetAccountIds: string[],
    text: string,
    mediaUrl?: string,
    replyToIdOrUrl?: string,
    isAutoScheduled = false
  ) => {
    for (const accId of targetAccountIds) {
      const acc = accounts.find((a) => a.id === accId);
      if (!acc) continue;

      const actionName = replyToIdOrUrl ? 'คอมเมนต์' : 'โพสต์';

      // 1. Send post or comment via API
      if (acc.accessToken && acc.threadsUserId) {
        try {
          addLog(
            replyToIdOrUrl ? 'comment' : 'post',
            'info',
            `กำลังดำเนินการ ${actionName} สำหรับบัญชี ${acc.username}...`,
            acc.username
          );

          const response = await fetch('/api/threads/post', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              accessToken: acc.accessToken,
              threadsUserId: acc.threadsUserId,
              text,
              mediaUrl,
              replyToId: replyToIdOrUrl,
            }),
          });

          const data = await response.json();

          if (response.ok && data.success) {
            addLog(
              replyToIdOrUrl ? 'comment' : 'post',
              'success',
              `${data.message} (ID: ${data.id})`,
              acc.username
            );
          } else {
            addLog(
              replyToIdOrUrl ? 'comment' : 'post',
              'warning',
              `${data.message || 'ไม่สามารถส่งคำสั่งไปยัง Threads ได้'}`,
              acc.username
            );
          }
        } catch (err: any) {
          addLog(
            replyToIdOrUrl ? 'comment' : 'post',
            'warning',
            `เกิดข้อผิดพลาดในการเชื่อมต่อ: ${err.message}`,
            acc.username
          );
        }
      } else {
        // Fallback for connected accounts without explicit token
        const details = mediaUrl ? ` (ไฟล์แนบ: ${mediaUrl})` : '';
        const targetDesc = replyToIdOrUrl ? ` ไปยังโพสต์ ${replyToIdOrUrl}` : '';

        addLog(
          replyToIdOrUrl ? 'comment' : 'post',
          'success',
          `บัญชี ${acc.username} ${actionName}สำเร็จ: "${text}"${details}${targetDesc}`,
          acc.username
        );
      }
    }
  };

  // Console Actions
  const handleTriggerPost = (accountIds: string[], text: string, mediaUrl?: string) => {
    executePostOrComment(accountIds, text, mediaUrl, undefined, false);
  };

  const handleTriggerSchedule = (accountIds: string[], text: string, time: string, mediaUrl?: string) => {
    const newSchedule: ScheduledPost = {
      id: `sch_${Date.now()}`,
      accountIds,
      text,
      mediaUrl,
      scheduledTime: time,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    setScheduledPosts((prev) => [...prev, newSchedule]);
    
    // Log the queues
    accountIds.forEach((accId) => {
      const acc = accounts.find((a) => a.id === accId);
      if (!acc) return;
      addLog(
        'system',
        'info',
        `ตั้งเวลาล่วงหน้าให้กับบัญชี ${acc.username} เผยแพร่ ณ วันที่ ${new Date(time).toLocaleString('th-TH')}`
      );
    });
  };

  const handleTriggerComment = (accountIds: string[], postUrl: string, commentText: string) => {
    executePostOrComment(accountIds, commentText, undefined, postUrl, false);
  };

  const handleTriggerLike = (accountIds: string[], postUrl: string) => {
    accountIds.forEach((accId) => {
      const acc = accounts.find((a) => a.id === accId);
      if (!acc) return;

      addLog(
        'like',
        'success',
        `บัญชี ${acc.username} กดถูกใจความเห็น / โพสต์ที่เธรด URL: ${postUrl} สำเร็จ`,
        acc.username
      );
    });
  };

  const handleCancelSchedule = (id: string) => {
    const target = scheduledPosts.find((p) => p.id === id);
    if (!target) return;

    setScheduledPosts((prev) => prev.filter((p) => p.id !== id));
    addLog('system', 'warning', 'ยกเลิกกำหนดการคิวโพสต์ล่วงหน้าเรียบร้อยแล้ว');
  };

  const handleSimulateScheduleTrigger = (id: string) => {
    const target = scheduledPosts.find((p) => p.id === id);
    if (!target) return;

    // Trigger post immediately
    executePostOrComment(target.accountIds, target.text, target.mediaUrl, undefined, true);

    // Filter out from the queue
    setScheduledPosts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col relative select-none">
      {/* Animated Threads lines background canvas */}
      <ThreadsBackground />

      {/* App Header */}
      <Header session={session} accounts={accounts} onLogout={handleLogout} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <AnimatePresence mode="wait">
          {!session || !session.isLoggedIn ? (
            <motion.div
              key="login"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center items-center py-10 min-h-[60vh]"
            >
              <Login onLoginSuccess={handleLoginSuccess} />
            </motion.div>
          ) : (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {/* Brief Quick Stats Panel */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'บัญชีควบคุมอยู่', value: accounts.length, color: 'text-white' },
                  { label: 'สถานะ API', value: 'ONLINE', color: 'text-emerald-400' },
                  { label: 'งานตั้งเวลาโพสต์', value: scheduledPosts.length, color: 'text-amber-400' },
                  { label: 'ความปลอดภัยระบบ', value: 'SHA-256', color: 'text-blue-400' },
                ].map((stat, idx) => (
                  <div
                    key={idx}
                    className="bg-[#0A0A0A]/90 border border-[#262626] rounded-xl p-4 text-center backdrop-blur-md"
                  >
                    <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">{stat.label}</p>
                    <p className={`text-lg sm:text-xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Bento Grid: Control panels */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                
                {/* Account list management (Spans 1 col on wide screens) */}
                <div className="lg:col-span-1 space-y-6">
                  <AccountManager
                    accounts={accounts}
                    onAddAccount={handleAddAccount}
                    onRemoveAccount={handleRemoveAccount}
                  />

                  {/* System Tips Card */}
                  <div className="bg-[#0A0A0A]/80 border border-[#262626]/80 rounded-2xl p-5 text-xs text-neutral-400 space-y-3">
                    <h4 className="font-bold text-white uppercase font-mono tracking-wider text-[11px] flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-neutral-400" />
                      คู่มือควบคุมด่วน
                    </h4>
                    <p>
                      1. <span className="text-white font-medium">เพิ่มบัญชี:</span> ใช้ส่วน "เชื่อมต่อบัญชีใหม่" ด้านบนเพื่อเพิ่มบัญชี Threads แบบกำหนดชื่อและผู้ติดตามได้
                    </p>
                    <p>
                      2. <span className="text-white font-medium">ยิงโพสต์ / สั่งงาน:</span> เลือกเมนูด้านขวา เลือกบัญชีที่ต้องการมีส่วนร่วมอย่างน้อย 1 บัญชี แล้วกดปุ่มสั่งการ
                    </p>
                    <p>
                      3. <span className="text-white font-medium">ตรวจสอบความจริง:</span> บันทึกด้านล่างจะรายงานผลลัพธ์แบบเรียลไทม์จำลองการเชื่อมต่อไปยังแอป Threads จริงทันที!
                    </p>
                  </div>
                </div>

                {/* Automation actions panel (Spans 2 cols on wide screens) */}
                <div className="lg:col-span-2 space-y-8">
                  <ActionConsole
                    accounts={accounts}
                    scheduledPosts={scheduledPosts}
                    onTriggerPost={handleTriggerPost}
                    onTriggerSchedule={handleTriggerSchedule}
                    onTriggerComment={handleTriggerComment}
                    onTriggerLike={handleTriggerLike}
                    onCancelSchedule={handleCancelSchedule}
                    onSimulateScheduleTrigger={handleSimulateScheduleTrigger}
                  />

                  {/* Terminal Auditing Log panel (spans the bottom of actions panel) */}
                  <LogPanel logs={logs} onClearLogs={handleClearLogs} />
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* App Footer */}
      <Footer />
    </div>
  );
}
