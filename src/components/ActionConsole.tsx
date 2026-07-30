/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, Clock, MessageSquare, Heart, CheckSquare, Square, 
  Sparkles, Image, Calendar, Play, AlertCircle, RefreshCw 
} from 'lucide-react';
import { ThreadsAccount, ScheduledPost } from '../types';

interface ActionConsoleProps {
  accounts: ThreadsAccount[];
  scheduledPosts: ScheduledPost[];
  onTriggerPost: (accountIds: string[], text: string, mediaUrl?: string) => void;
  onTriggerSchedule: (accountIds: string[], text: string, time: string, mediaUrl?: string) => void;
  onTriggerComment: (accountIds: string[], postUrl: string, commentText: string) => void;
  onTriggerLike: (accountIds: string[], postUrl: string) => void;
  onCancelSchedule: (id: string) => void;
  onSimulateScheduleTrigger: (id: string) => void;
}

// Predefined Thai comment templates for Threads accounts
const THAI_COMMENT_TEMPLATES = [
  "ว้าว สุดยอดมากเลยครับพี่! 🚀",
  "คอนเทนต์ดีมากเลยครับ ติดตามๆ ✨",
  "อันนี้น่าสนใจมากเลย ต้องลองไปทำตามดูละ 😊",
  "จริงที่สุดครับ เห็นด้วยมากๆ เลย 👍",
  "ชอบแนวคิดนี้จังครับ รอโพสต์ต่อไปเลยน้า 💖",
  "เฉียบมากครับ! 💯",
  "มีประโยชน์มากเลยครับ ขอบคุณสำหรับข้อมูลดีๆ นะครับ 🙏",
  "เห็นด้วยเลยครับ ยุคนี้ต้องแบบนี้จริงๆ 🎯",
  "โพสต์ได้โดนใจมากเลยครับพี่ ดีงามสุดๆ!",
  "ข้อมูลแน่นปึ้ก ชอบมากเลยครับ 🧠",
  "เฉียบขาดมากครับโพสต์นี้ เอาใจไปเลย 🧡",
  "พึ่งเคยเจอแนวคิดมุมมองแบบนี้ ดีมากเลยครับ",
  "อธิบายเข้าใจง่ายและชัดเจนมากครับ ขอบคุณครับ",
  "เซฟไว้ด่วนๆ เลย คอนเทนต์แบบนี้มีค่ามาก 💾",
  "กดติดตามแทบไม่ทันเลยครับ นำเสนอได้ยอดเยี่ยมมาก 👏",
  "เปิดโลกใหม่มากเลยค่ะ ขอบคุณสำหรับความรู้ค่ะ 😊",
  "น่ารักจังเลยค่ะ ชอบโพสต์แนวนี้จัง",
  "เห็นภาพชัดเจนเลยครับ ต้องปรับตัวตามด่วนๆ",
  "ที่สุดของความโดนใจ โดนใจคนอ่านสุดๆ!",
  "เป็นแง่คิดที่ดีมากๆ ค่ะ ขอบคุณที่แชร์เรื่องราวดีๆ นี้นะคะ"
];

export default function ActionConsole({
  accounts,
  scheduledPosts,
  onTriggerPost,
  onTriggerSchedule,
  onTriggerComment,
  onTriggerLike,
  onCancelSchedule,
  onSimulateScheduleTrigger,
}: ActionConsoleProps) {
  const [activeTab, setActiveTab] = useState<'post' | 'comment' | 'like' | 'queue'>('post');

  // Multi-account selection state
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);

  // Auto-select all accounts by default if none are selected, or when new accounts are added
  React.useEffect(() => {
    if (accounts.length > 0) {
      setSelectedAccountIds((prev) => {
        if (prev.length === 0) return accounts.map((a) => a.id);
        const validPrev = prev.filter((id) => accounts.some((a) => a.id === id));
        if (validPrev.length === 0) return accounts.map((a) => a.id);
        const newAccountIds = accounts.filter((a) => !prev.includes(a.id)).map((a) => a.id);
        return [...validPrev, ...newAccountIds];
      });
    } else {
      setSelectedAccountIds([]);
    }
  }, [accounts]);

  // Post composer state
  const [postText, setPostText] = useState('');
  const [postMediaUrl, setPostMediaUrl] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleDateTime, setScheduleDateTime] = useState('');

  // Comment state
  const [threadUrl, setThreadUrl] = useState('');
  const [commentText, setCommentText] = useState('');
  const [accountComments, setAccountComments] = useState<Record<string, string>>({});
  const [commentStatus, setCommentStatus] = useState<Record<string, 'idle' | 'sending' | 'success'>>({});

  // Helper to randomize comments for all selected accounts
  const randomizeAllComments = () => {
    const activeSelected = selectedAccountIds.length > 0 ? selectedAccountIds : accounts.map(a => a.id);
    if (activeSelected.length === 0) {
      showFeedback('error', 'กรุณาเชื่อมต่อหรือเลือกบัญชี Threads ด้านบนอย่างน้อย 1 บัญชีก่อนทำการสุ่มข้อความ');
      return;
    }
    const newComments = { ...accountComments };
    const newStatuses = { ...commentStatus };
    activeSelected.forEach((accId) => {
      const randomIndex = Math.floor(Math.random() * THAI_COMMENT_TEMPLATES.length);
      newComments[accId] = THAI_COMMENT_TEMPLATES[randomIndex];
      newStatuses[accId] = 'idle';
    });
    setAccountComments(newComments);
    setCommentStatus(newStatuses);
    showFeedback('success', 'สุ่มข้อความคอมเมนต์จำลองสำเร็จทุกบัญชีแล้ว! 🎲');
  };

  // Helper to randomize comment for a single account
  const randomizeSingleComment = (accId: string) => {
    const randomIndex = Math.floor(Math.random() * THAI_COMMENT_TEMPLATES.length);
    setAccountComments(prev => ({
      ...prev,
      [accId]: THAI_COMMENT_TEMPLATES[randomIndex]
    }));
    setCommentStatus(prev => ({
      ...prev,
      [accId]: 'idle'
    }));
  };

  // Handle individual comment send
  const handleSingleCommentSend = (accId: string) => {
    if (!threadUrl.trim()) {
      showFeedback('error', 'กรุณาระบุลิงก์โพสต์ Threads ที่ต้องการไปคอมเมนต์');
      return;
    }
    const text = accountComments[accId]?.trim();
    if (!text) {
      showFeedback('error', 'กรุณากรอกข้อความคอมเมนต์ก่อนกดส่ง');
      return;
    }

    setCommentStatus(prev => ({ ...prev, [accId]: 'sending' }));

    setTimeout(() => {
      onTriggerComment([accId], threadUrl, text);
      setCommentStatus(prev => ({ ...prev, [accId]: 'success' }));
      showFeedback('success', 'ส่งคอมเมนต์ของบัญชีนี้เรียบร้อยแล้ว! 🚀');
    }, 800);
  };

  // Handle all comments send in batch
  const handleSendAllPreparedComments = () => {
    const activeSelected = selectedAccountIds.length > 0 ? selectedAccountIds : accounts.map(a => a.id);
    const validAccs = activeSelected.filter(accId => accountComments[accId]?.trim() && commentStatus[accId] !== 'success');
    
    if (!threadUrl.trim()) {
      showFeedback('error', 'กรุณาระบุลิงก์โพสต์ Threads ที่ต้องการไปคอมเมนต์');
      return;
    }
    if (validAccs.length === 0) {
      showFeedback('error', 'ไม่มีคอมเมนต์ใหม่ที่พร้อมส่ง (กรุณากรอกหรือสุ่มคอมเมนต์ก่อน)');
      return;
    }

    validAccs.forEach((accId, idx) => {
      setCommentStatus(prev => ({ ...prev, [accId]: 'sending' }));
      setTimeout(() => {
        onTriggerComment([accId], threadUrl, accountComments[accId].trim());
        setCommentStatus(prev => ({ ...prev, [accId]: 'success' }));
      }, idx * 600); // 600ms stagger
    });

    showFeedback('success', `กำลังทยอยรันระบบส่งคอมเมนต์ทั้งหมด ${validAccs.length} บัญชีตามลำดับ... 🚀`);
  };

  // Like state
  const [likeThreadUrl, setLikeThreadUrl] = useState('');

  // Notifications or errors
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // AI content generator states
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiTone, setAiTone] = useState('สนุกสนาน / เป็นกันเอง');
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // Drag-and-drop / Local file upload states
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // AI Generation API call
  const generateAiText = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiGenerating(true);
    try {
      const response = await fetch('/api/generate-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt, tone: aiTone }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการดึงข้อความจาก AI');
      }
      if (data.text) {
        setPostText(data.text);
        showFeedback('success', 'AI คิดข้อความให้คุณเสร็จเรียบร้อย!');
      }
    } catch (err: any) {
      console.error(err);
      showFeedback('error', err.message || 'ไม่สามารถติดต่อ AI ได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Local file attachment handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showFeedback('error', 'กรุณาเลือกเฉพาะไฟล์รูปภาพเท่านั้น');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setPostMediaUrl(event.target.result as string);
        showFeedback('success', 'โหลดไฟล์รูปภาพจากเครื่องสำเร็จ!');
      }
    };
    reader.onerror = () => {
      showFeedback('error', 'ไม่สามารถอ่านไฟล์รูปภาพนี้ได้');
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const clearAttachedImage = () => {
    setPostMediaUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    showFeedback('success', 'ลบรูปภาพแนบสำเร็จ');
  };

  // Helper: toggle account selection
  const toggleAccount = (id: string) => {
    setSelectedAccountIds((prev) =>
      prev.includes(id) ? prev.filter((aid) => aid !== id) : [...prev, id]
    );
  };

  const selectAllAccounts = () => {
    if (selectedAccountIds.length === accounts.length) {
      setSelectedAccountIds([]);
    } else {
      setSelectedAccountIds(accounts.map((a) => a.id));
    }
  };

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  // Submissions
  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAccountIds.length === 0) {
      showFeedback('error', 'กรุณาเลือกบัญชีผู้ใช้ Threads อย่างน้อย 1 บัญชี');
      return;
    }
    if (!postText.trim()) {
      showFeedback('error', 'กรุณากรอกข้อความที่ต้องการโพสต์');
      return;
    }

    if (isScheduled) {
      if (!scheduleDateTime) {
        showFeedback('error', 'กรุณาระบุวันและเวลาที่ต้องการตั้งเวลาล่วงหน้า');
        return;
      }
      onTriggerSchedule(selectedAccountIds, postText, scheduleDateTime, postMediaUrl || undefined);
      showFeedback('success', `ตั้งเวลาล่วงหน้าสำเร็จสำหรับ ${selectedAccountIds.length} บัญชี`);
      setPostText('');
      setPostMediaUrl('');
      setScheduleDateTime('');
    } else {
      onTriggerPost(selectedAccountIds, postText, postMediaUrl || undefined);
      showFeedback('success', `โพสต์สำเร็จทันทีไปยัง ${selectedAccountIds.length} บัญชี`);
      setPostText('');
      setPostMediaUrl('');
    }
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAccountIds.length === 0) {
      showFeedback('error', 'กรุณาเลือกบัญชีเพื่อคอมเมนต์อย่างน้อย 1 บัญชี');
      return;
    }
    if (!threadUrl.trim()) {
      showFeedback('error', 'กรุณาระบุ URL บล็อก / โพสต์ Threads ของแท้');
      return;
    }
    if (!commentText.trim()) {
      showFeedback('error', 'กรุณากรอกข้อความคอมเมนต์');
      return;
    }

    onTriggerComment(selectedAccountIds, threadUrl, commentText);
    showFeedback('success', `ส่งคำสั่งคอมเมนต์ไปยัง ${selectedAccountIds.length} บัญชีเรียบร้อย`);
    setThreadUrl('');
    setCommentText('');
  };

  const handleLikeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAccountIds.length === 0) {
      showFeedback('error', 'กรุณาเลือกบัญชีเพื่อทำการกดไลค์อย่างน้อย 1 บัญชี');
      return;
    }
    if (!likeThreadUrl.trim()) {
      showFeedback('error', 'กรุณาระบุ URL โพสต์ Threads ที่ต้องการกดไลค์');
      return;
    }

    onTriggerLike(selectedAccountIds, likeThreadUrl);
    showFeedback('success', `ส่งคำสั่งกดไลค์ Coordinated Likes สำหรับ ${selectedAccountIds.length} บัญชี`);
    setLikeThreadUrl('');
  };

  return (
    <div id="action-console-card" className="bg-[#0A0A0A]/90 border border-[#262626] rounded-2xl shadow-xl overflow-hidden backdrop-blur-md">
      {/* Tab Selectors */}
      <div className="flex border-b border-[#262626] overflow-x-auto scrollbar-none">
        {[
          { id: 'post', label: 'สร้างโพสต์ & ตั้งเวลา', icon: Send },
          { id: 'comment', label: 'คอมเมนต์พร้อมกัน', icon: MessageSquare },
          { id: 'like', label: 'กดไลค์พร้อมกัน', icon: Heart },
          { id: 'queue', label: `คิวโพสต์ล่วงหน้า (${scheduledPosts.length})`, icon: Calendar },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              id={`tab-btn-${tab.id}`}
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-4 text-xs font-semibold uppercase tracking-wider border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'border-white text-white bg-white/5'
                  : 'border-transparent text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.02]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="p-6">
        {/* Global Account Selector Bar (For Post, Comment, and Like Tabs) */}
        {activeTab !== 'queue' && (
          <div className="mb-6 bg-[#111] border border-[#262626] p-4 rounded-xl">
            <div className="flex items-center justify-between mb-3.5">
              <div>
                <span className="text-xs font-bold text-white block">
                  เลือกบัญชีเป้าหมายเพื่อดำเนินการ ({selectedAccountIds.length} บัญชีที่เลือก)
                </span>
                <span className="text-[10px] text-neutral-500">บัญชีที่เลือกทั้งหมดจะทำงานพร้อมกันทันที</span>
              </div>
              <button
                type="button"
                onClick={selectAllAccounts}
                className="text-[10px] font-mono font-semibold bg-[#262626] hover:bg-[#333] text-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                {selectedAccountIds.length === accounts.length ? 'ยกเลิกทั้งหมด' : 'เลือกทั้งหมด'}
              </button>
            </div>

            {accounts.length === 0 ? (
              <p className="text-xs text-amber-500 flex items-center gap-1.5 py-1">
                <AlertCircle className="w-4 h-4 shrink-0" />
                กรุณาเชื่อมต่อบัญชี Threads ในส่วนจัดการบัญชีก่อน จึงจะสามารถสั่งการได้
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-1">
                {accounts.map((acc) => {
                  const isSelected = selectedAccountIds.includes(acc.id);
                  return (
                    <button
                      id={`select-acc-pill-${acc.id}`}
                      key={acc.id}
                      type="button"
                      onClick={() => toggleAccount(acc.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-white text-black border-white font-semibold'
                          : 'bg-[#111] hover:bg-[#1a1a1a] text-neutral-300 border-[#262626]'
                      }`}
                    >
                      {isSelected ? (
                        <CheckSquare className="w-3.5 h-3.5 shrink-0" />
                      ) : (
                        <Square className="w-3.5 h-3.5 opacity-60 shrink-0" />
                      )}
                      <span>{acc.username}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Feedback Banner */}
        <AnimatePresence>
          {feedbackMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`mb-5 p-3.5 rounded-xl text-xs flex items-center gap-2 border ${
                feedbackMsg.type === 'success'
                  ? 'bg-emerald-950/20 border-emerald-900/30 text-emerald-400'
                  : 'bg-red-950/20 border-red-900/30 text-red-400'
              }`}
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>{feedbackMsg.text}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab Content Panels */}
        <div id="tab-panels-viewport">
          {/* 1. Post Tab */}
          {activeTab === 'post' && (
            <form onSubmit={handlePostSubmit} className="space-y-4">
              {/* AI Assistant Toggle & Block */}
              <div className="bg-[#111] border border-[#262626] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <div>
                      <span className="text-xs font-bold text-white block">ระบบ AI ช่วยแต่งข้อความอัตโนมัติ (AI Copilot)</span>
                      <span className="text-[10px] text-neutral-500">เลือกใช้ AI เพื่อช่วยคุณแต่งแคปชั่น โพสต์เนื้อหาให้น่าสนใจ</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAiPanel(!showAiPanel)}
                    className="text-[10px] text-neutral-300 hover:text-white font-semibold bg-[#262626] hover:bg-[#333] border border-[#333] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    {showAiPanel ? 'ปิดเครื่องมือ AI' : 'ใช้ AI ช่วยคิด 🤖'}
                  </button>
                </div>

                <AnimatePresence>
                  {showAiPanel && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden space-y-3 pt-2 border-t border-[#262626]"
                    >
                      <div>
                        <label className="block text-[9px] font-mono text-neutral-400 mb-1 uppercase tracking-wider">
                          ไอเดียหัวข้อ / คีย์เวิร์ดที่ต้องการ (Prompt)
                        </label>
                        <input
                          type="text"
                          placeholder="เช่น ข้อคิดชีวิตวัยทำงาน, รีวิวหนังแอคชั่น, แนะนำการออกกำลังกายสั้นๆ..."
                          value={aiPrompt}
                          onChange={(e) => setAiPrompt(e.target.value)}
                          className="w-full bg-[#0A0A0A] border border-[#262626] focus:border-neutral-500 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-500 outline-none transition-all"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[9px] font-mono text-neutral-400 mb-1 uppercase tracking-wider">
                            โทนการเขียน (Writing Tone)
                          </label>
                          <select
                            value={aiTone}
                            onChange={(e) => setAiTone(e.target.value)}
                            className="w-full bg-[#0A0A0A] border border-[#262626] focus:border-neutral-500 rounded-lg px-3 py-2 text-xs text-white outline-none cursor-pointer"
                          >
                            <option value="สนุกสนาน / เป็นกันเอง">สนุกสนาน / เป็นกันเอง 😊</option>
                            <option value="ให้ความรู้ / จริงจัง">ให้ความรู้ / จริงจัง 🧠</option>
                            <option value="สร้างแรงบันดาลใจ">สร้างแรงบันดาลใจ ✨</option>
                            <option value="เป็นทางการ / ธุรกิจ">เป็นทางการ / ธุรกิจ 💼</option>
                            <option value="สั้นๆ คมคาย / มินิมอล">สั้นคมคาย / มินิมอล 💬</option>
                          </select>
                        </div>

                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={generateAiText}
                            disabled={isAiGenerating || !aiPrompt.trim()}
                            className="w-full bg-white hover:bg-neutral-100 disabled:bg-[#1a1a1a] disabled:text-neutral-600 disabled:border-[#262626] text-black font-semibold text-xs py-2 px-3 rounded-lg border border-transparent flex items-center justify-center gap-1.5 transition-all cursor-pointer h-9"
                          >
                            {isAiGenerating ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin text-neutral-500" />
                                <span>กำลังประมวลผลข้อความ...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                <span>สั่งให้ AI ช่วยร่างข้อความ ✨</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Textarea for Thread text */}
              <div>
                <label className="block text-[10px] font-mono text-neutral-400 mb-1.5 uppercase tracking-wider">
                  เนื้อหาโพสต์ / บรรยาย (Thread Content)
                </label>
                <textarea
                  id="post-textarea"
                  rows={4}
                  placeholder="พิมพ์ข้อความที่คุณต้องการแชร์ลงแอป Threads... (หรือกดเลือกใช้ AI ช่วยคิดด้านบน!)"
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                  className="w-full bg-[#111] border border-[#262626] focus:border-neutral-500 rounded-xl p-3.5 text-xs sm:text-sm text-white placeholder-neutral-500 outline-none transition-all resize-none"
                />
              </div>

              {/* Advanced File Upload Drag-and-Drop zone & URL fallbacks */}
              <div className="space-y-2">
                <label className="block text-[10px] font-mono text-neutral-400 mb-1 uppercase tracking-wider flex items-center gap-1">
                  <Image className="w-3.5 h-3.5" />
                  รูปภาพประกอบ (Thread Media Attachment)
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Local Upload Dropzone */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border border-dashed rounded-xl p-4 text-center flex flex-col items-center justify-center cursor-pointer transition-all ${
                      isDragging 
                        ? 'border-white bg-white/5' 
                        : 'border-[#262626] bg-[#111] hover:border-neutral-500 hover:bg-neutral-900/50'
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <Image className="w-5 h-5 text-neutral-400 mb-1.5" />
                    <span className="text-[11px] font-semibold text-white block">เลือกรูปภาพจากเครื่อง</span>
                    <span className="text-[9px] text-neutral-500 mt-0.5">ลากไฟล์รูปภาพมาวางที่นี่ หรือ คลิกเพื่ออัปโหลด</span>
                  </div>

                  {/* Remote URL input */}
                  <div className="bg-[#111] border border-[#262626] rounded-xl p-4 flex flex-col justify-center space-y-2">
                    <span className="text-[10px] font-semibold text-white block">หรือ ระบุ URL ของรูปภาพ</span>
                    <input
                      id="post-image-url"
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      value={postMediaUrl.startsWith('data:') ? '' : postMediaUrl}
                      onChange={(e) => setPostMediaUrl(e.target.value)}
                      className="w-full bg-[#0A0A0A] border border-[#262626] focus:border-neutral-500 rounded-lg px-2.5 py-2 text-[11px] text-white placeholder-neutral-500 outline-none transition-all"
                    />
                    <span className="text-[9px] text-neutral-500">ใส่ลิงก์รูปภาพจากเว็บทั่วไปเพื่อดึงมาแสดงแทนได้</span>
                  </div>
                </div>

                {/* Preview Box if postMediaUrl is set */}
                {postMediaUrl && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative bg-[#111] border border-[#262626] rounded-xl p-3 flex items-center gap-3"
                  >
                    <div className="w-14 h-14 rounded-lg bg-[#262626] overflow-hidden flex items-center justify-center shrink-0">
                      <img
                        src={postMediaUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-semibold text-white block truncate">ดึงไฟล์ภาพพร้อมโพสต์สำเร็จ</span>
                      <span className="text-[9px] text-neutral-500 truncate block">
                        {postMediaUrl.startsWith('data:') ? 'รูปภาพที่เลือกจากเครื่องคอมพิวเตอร์ของคุณ' : postMediaUrl}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={clearAttachedImage}
                      className="px-3 py-1.5 text-[10px] font-semibold rounded-lg border border-[#262626] text-neutral-400 hover:text-red-400 hover:bg-red-950/20 transition-all cursor-pointer"
                    >
                      ยกเลิกรูปภาพ
                    </button>
                  </motion.div>
                )}
              </div>

              {/* Time scheduler switch and inputs */}
              <div className="p-4 bg-[#111] border border-[#262626] rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-neutral-400" />
                    <div>
                      <span className="text-xs font-bold text-white block">ตั้งเวลาโพสต์ล่วงหน้า (Post Scheduler)</span>
                      <span className="text-[10px] text-neutral-500">ระบบจะทำการดันโพสต์อัตโนมัติเมื่อถึงเวลากำหนด</span>
                    </div>
                  </div>

                  <button
                    id="schedule-toggle-button"
                    type="button"
                    onClick={() => setIsScheduled(!isScheduled)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isScheduled ? 'bg-white' : 'bg-[#262626]'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-black shadow ring-0 transition duration-200 ease-in-out ${
                        isScheduled ? 'translate-x-5 bg-black' : 'translate-x-0 bg-neutral-400'
                      }`}
                    />
                  </button>
                </div>

                {isScheduled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pt-2"
                  >
                    <label className="block text-[10px] font-mono text-neutral-400 mb-1.5 uppercase">
                      เลือกวันและเวลาที่จะเผยแพร่
                    </label>
                    <input
                      id="schedule-datetime-picker"
                      type="datetime-local"
                      value={scheduleDateTime}
                      onChange={(e) => setScheduleDateTime(e.target.value)}
                      className="bg-[#111] text-white text-xs border border-[#262626] rounded-xl px-3 py-2.5 outline-none focus:border-neutral-500 w-full max-w-sm"
                    />
                  </motion.div>
                )}
              </div>

              {/* Submit trigger button */}
              <div className="flex justify-end pt-2">
                <motion.button
                  id="trigger-post-submit"
                  type="submit"
                  className="bg-white hover:bg-neutral-100 text-black font-semibold text-xs px-6 py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  {isScheduled ? <Clock className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                  <span>{isScheduled ? 'บันทึกตารางโพสต์ล่วงหน้า' : 'เผยแพร่ทันทีทุกบัญชี'}</span>
                </motion.button>
              </div>
            </form>
          )}

          {/* 2. Comment Tab */}
          {activeTab === 'comment' && (
            <div className="space-y-4">
              {/* Informational Callout regarding Threads Commenting */}
              <div className="bg-[#10141D] border border-[#262626] rounded-xl p-3.5 space-y-1.5 text-xs text-neutral-300">
                <div className="flex items-center gap-2 font-bold text-white">
                  <MessageSquare className="w-4 h-4 shrink-0 text-blue-400" />
                  <span>การส่งความคิดเห็นไปยังโพสต์ Threads</span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  ระบุ URL ของโพสต์ Threads (เช่น <code className="text-neutral-300">https://www.threads.net/@user/post/CwU6-39sh2</code>) หรือระบุ Post ID เพื่อส่งความคิดเห็นไปยังโพสต์เป้าหมาย
                </p>
              </div>

              {/* Post link input */}
              <div>
                <label className="block text-[10px] font-mono text-neutral-400 mb-1.5 uppercase tracking-wider">
                  ลิงก์โพสต์ Threads (Threads Post URL หรือ Post ID)
                </label>
                <input
                  id="comment-thread-url"
                  type="text"
                  placeholder="ระบุลิงก์ เช่น https://www.threads.net/@user/post/CwU6-39sh2 หรือ Post ID"
                  value={threadUrl}
                  onChange={(e) => setThreadUrl(e.target.value)}
                  className="w-full bg-[#111] border border-[#262626] focus:border-neutral-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 outline-none transition-all"
                />
              </div>

              {/* Fast interactive tools bar */}
              <div className="bg-[#111] border border-[#262626] p-4 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-white block">ระบบเตรียมสุ่มชุดความคิดเห็น (Comment Generator Matrix)</span>
                  <p className="text-[10px] text-neutral-400">
                    ระบบจะทำการเขียนข้อความจำลองแบบธรรมชาติเพื่อไปร่วมพูดคุยกับผู้ใช้ใน Threads อื่นๆ โดยมีปุ่มแยกแก้ไขของแต่ละบัญชี
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={randomizeAllComments}
                    className="bg-white hover:bg-neutral-100 text-black text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                    สุ่มคอมเมนต์ให้ทุกบัญชี 🎲
                  </button>

                  <button
                    type="button"
                    onClick={handleSendAllPreparedComments}
                    className="bg-[#262626] hover:bg-[#333] border border-[#3c3c3c] text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5 text-blue-400" />
                    ส่งคอมเมนต์ทั้งหมดพร้อมกัน 🚀
                  </button>
                </div>
              </div>

              {/* Individual Account commenting console rows */}
              <div className="space-y-3">
                <label className="block text-[10px] font-mono text-neutral-400 mb-1.5 uppercase tracking-wider">
                  แผงตอบกลับรายบัญชี Threads (Individual Accounts Comment Control)
                </label>

                {(() => {
                  const targetAccs = accounts.filter(a => selectedAccountIds.includes(a.id));
                  const displayAccs = targetAccs.length > 0 ? targetAccs : accounts;

                  if (displayAccs.length === 0) {
                    return (
                      <div className="border border-dashed border-[#262626] rounded-xl p-8 text-center text-neutral-500 text-xs">
                        ยังไม่มีบัญชี Threads เชื่อมต่อในระบบ กรุณาเพิ่มบัญชีที่ด้านบนก่อน
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-3">
                      {displayAccs.map((acc) => {
                        const currentCommentText = accountComments[acc.id] || '';
                        const currentStatus = commentStatus[acc.id] || 'idle';

                        return (
                          <div
                            key={acc.id}
                            className="bg-[#111] border border-[#262626] hover:border-neutral-800 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all"
                          >
                            {/* Account Details */}
                            <div className="flex items-center gap-3 shrink-0 lg:w-[220px]">
                              <div className="w-9 h-9 rounded-full bg-[#262626] border border-[#333] flex items-center justify-center font-bold text-white relative overflow-hidden shrink-0">
                                {acc.avatarUrl && (acc.avatarUrl.startsWith('http') || acc.avatarUrl.startsWith('data:')) ? (
                                  <img 
                                    src={acc.avatarUrl} 
                                    alt={acc.username} 
                                    className="w-full h-full object-cover" 
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <span className="text-xs font-sans">
                                    {acc.displayName.slice(0, 2).toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-white truncate">{acc.displayName}</p>
                                <p className="text-[10px] font-mono text-neutral-400 truncate mt-0.5">{acc.username}</p>
                              </div>
                            </div>

                            {/* Editable comment content */}
                            <div className="flex-1 min-w-0">
                              <textarea
                                rows={2}
                                value={currentCommentText}
                                onChange={(e) => setAccountComments(prev => ({ ...prev, [acc.id]: e.target.value }))}
                                placeholder="พิมพ์หรือกดสุ่มข้อความคอมเมนต์เฉพาะของบัญชีนี้..."
                                className="w-full bg-[#0A0A0A] border border-[#262626] focus:border-neutral-600 rounded-lg p-2.5 text-xs text-white placeholder-neutral-600 outline-none transition-all resize-none font-sans"
                              />
                            </div>

                            {/* Actions & Status */}
                            <div className="flex items-center gap-2 shrink-0 justify-end">
                              {/* Single re-randomizer */}
                              <button
                                type="button"
                                onClick={() => randomizeSingleComment(acc.id)}
                                className="p-2 bg-[#1c1c1c] hover:bg-[#2c2c2c] text-neutral-400 hover:text-white rounded-lg border border-[#262626] transition-colors cursor-pointer"
                                title="สุ่มข้อความใหม่เฉพาะบัญชีนี้"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                              </button>

                              {/* Single send button */}
                              <button
                                type="button"
                                onClick={() => handleSingleCommentSend(acc.id)}
                                disabled={currentStatus === 'sending' || !currentCommentText.trim() || !threadUrl.trim()}
                                className={`text-[11px] font-bold px-4 py-2 rounded-lg cursor-pointer transition-all flex items-center gap-1.5 ${
                                  currentStatus === 'success'
                                    ? 'bg-[#121c16] text-emerald-400 border border-emerald-900/50 cursor-default'
                                    : currentStatus === 'sending'
                                    ? 'bg-neutral-900 text-neutral-500 border border-[#262626] cursor-wait'
                                    : 'bg-white hover:bg-neutral-100 text-black border border-transparent'
                                }`}
                              >
                                {currentStatus === 'success' ? (
                                  <>
                                    <span>ส่งแล้ว ✅</span>
                                  </>
                                ) : currentStatus === 'sending' ? (
                                  <>
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                    <span>กำลังส่ง...</span>
                                  </>
                                ) : (
                                  <>
                                    <Send className="w-3 h-3" />
                                    <span>ส่งคอมเมนต์ 🚀</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* 3. Like Tab */}
          {activeTab === 'like' && (
            <form onSubmit={handleLikeSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono text-neutral-400 mb-1.5 uppercase tracking-wider">
                  ลิงก์โพสต์ Threads ที่ต้องการเพิ่มไลค์ (Threads Post URL for Likes)
                </label>
                <input
                  id="like-thread-url"
                  type="text"
                  placeholder="ระบุลิงก์ เช่น https://www.threads.net/@user/post/CwU6-39sh2"
                  value={likeThreadUrl}
                  onChange={(e) => setLikeThreadUrl(e.target.value)}
                  className="w-full bg-[#111] border border-[#262626] focus:border-neutral-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 outline-none transition-all"
                />
              </div>

              <div className="p-4 bg-[#111] border border-[#262626] rounded-xl flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-neutral-300 shrink-0" />
                <p className="text-[11px] text-neutral-400">
                  ⚡ ระบบจะทำการจำลอง Action กดถูกใจด้วยอัลกอริทึมเลียนแบบพฤติกรรมมนุษย์ (Randomized delay) ไปยังแอปพลิเคชัน Threads ของจริง
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <motion.button
                  id="trigger-like-submit"
                  type="submit"
                  className="bg-white hover:bg-neutral-100 text-black font-semibold text-xs px-6 py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <Heart className="w-4 h-4" />
                  <span>ระดมกดไลค์พร้อมกัน</span>
                </motion.button>
              </div>
            </form>
          )}

          {/* 4. Queue / Scheduled List Tab */}
          {activeTab === 'queue' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider">
                  รายการที่รอเผยแพร่ตามเวลากำหนด
                </span>
                <span className="text-[10px] text-neutral-500">
                  * จะถูกโพสต์อัตโนมัติ หรือเร่งทดสอบได้ด้วยปุ่มด้านขวา
                </span>
              </div>

              {scheduledPosts.length === 0 ? (
                <div className="border border-dashed border-[#262626] rounded-xl p-8 text-center text-neutral-500 text-xs">
                  ยังไม่มีรายการตั้งเวลาโพสต์ล่วงหน้าในระบบคิว
                </div>
              ) : (
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {scheduledPosts.map((post) => {
                    const matchedAccs = accounts.filter((a) => post.accountIds.includes(a.id));
                    const formattedTime = new Date(post.scheduledTime).toLocaleString('th-TH', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <div
                        key={post.id}
                        className="bg-[#111] border border-[#262626] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="space-y-1.5 min-w-0 flex-1">
                          {/* Targets */}
                          <div className="flex flex-wrap gap-1 items-center">
                            <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wide mr-1">
                              ผู้ส่ง:
                            </span>
                            {matchedAccs.map((a) => (
                              <span
                                key={a.id}
                                className="bg-[#262626] border border-[#333] text-neutral-300 text-[10px] font-mono px-2 py-0.5 rounded"
                              >
                                {a.username}
                              </span>
                            ))}
                          </div>

                          {/* Text */}
                          <p className="text-xs text-white font-sans font-medium line-clamp-2">
                            {post.text}
                          </p>

                          {/* Time */}
                          <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 font-mono">
                            <Clock className="w-3.5 h-3.5" />
                            <span>กำหนดการ: {formattedTime}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          {/* Force Post Simulator Button */}
                          <button
                            onClick={() => onSimulateScheduleTrigger(post.id)}
                            className="bg-white hover:bg-neutral-100 text-black font-semibold text-[10px] px-3 py-2 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                            title="บังคับยิงโพสต์ตอนนี้เพื่อทดสอบจำลองเวลา"
                          >
                            <Play className="w-3 h-3 fill-black" />
                            เร่งเวลาโพสต์
                          </button>

                          {/* Cancel button */}
                          <button
                            onClick={() => onCancelSchedule(post.id)}
                            className="border border-[#262626] hover:border-red-950 text-neutral-400 hover:text-red-400 hover:bg-red-950/20 text-[10px] font-medium px-3 py-2 rounded-lg transition-all cursor-pointer"
                          >
                            ยกเลิกคิว
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
