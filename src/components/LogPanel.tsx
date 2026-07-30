/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import { Terminal, Trash2, Globe, ArrowRight, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { ActionLog } from '../types';

interface LogPanelProps {
  logs: ActionLog[];
  onClearLogs: () => void;
}

export default function LogPanel({ logs, onClearLogs }: LogPanelProps) {
  return (
    <div id="simulation-logs-panel" className="bg-[#0A0A0A]/90 border border-[#262626] rounded-2xl p-6 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between mb-5 border-b border-[#262626] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#111] border border-[#262626] flex items-center justify-center text-neutral-400">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              คอนโซลประวัติการทำงาน (Live Action Audit Log)
            </h3>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              แสดงผลบันทึกกิจกรรมและการดำเนินงานตามคำสั่ง
            </p>
          </div>
        </div>

        {logs.length > 0 && (
          <button
            id="clear-logs-btn"
            onClick={onClearLogs}
            className="flex items-center gap-1.5 text-[10px] font-mono text-neutral-500 hover:text-red-400 transition-colors cursor-pointer"
            title="ล้างประวัติบันทึกการทำงาน"
          >
            <Trash2 className="w-3.5 h-3.5" />
            ล้างบันทึก
          </button>
        )}
      </div>

      {logs.length === 0 ? (
        <div className="py-12 text-center text-neutral-600 flex flex-col items-center justify-center gap-2">
          <Globe className="w-8 h-8 text-neutral-700 animate-pulse" />
          <div>
            <p className="text-xs font-mono text-neutral-400">STANDBY MODE • รอรับคำสั่งดำเนินการ</p>
            <p className="text-[10px] text-neutral-500 mt-0.5">
              เมื่อคุณสร้างโพสต์, คอมเมนต์ หรือตั้งตารางโพสต์ ประวัติการทำงานจะแสดงที่นี่
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 font-mono text-xs scrollbar-thin scrollbar-thumb-neutral-800">
          <AnimatePresence initial={false}>
            {logs.slice().reverse().map((log) => {
              // Status Styling
              let statusColor = 'text-blue-400 bg-blue-950/20 border-blue-900/40';
              if (log.status === 'success') {
                statusColor = 'text-emerald-400 bg-emerald-950/20 border-emerald-900/40';
              } else if (log.status === 'warning') {
                statusColor = 'text-amber-400 bg-amber-950/20 border-amber-900/40';
              }

              // Icon selector
              const StatusIcon = log.status === 'success' ? CheckCircle2 : ShieldAlert;

              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -10, y: -5 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="bg-[#111] border border-[#262626]/80 p-3 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-[#151515] transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                    {/* Timestamp */}
                    <span className="text-[10px] text-neutral-500 font-semibold bg-[#0A0A0A] border border-[#262626] px-1.5 py-0.5 rounded shrink-0">
                      {log.timestamp}
                    </span>

                    {/* Action pill type */}
                    <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded border font-bold shrink-0 ${statusColor}`}>
                      {log.type}
                    </span>

                    {/* Message */}
                    <p className="text-xs text-neutral-300 font-sans leading-relaxed min-w-0 truncate">
                      {log.message}
                    </p>
                  </div>

                  {/* Connected check icon / action handle */}
                  <div className="flex items-center gap-1 text-[10px] text-neutral-500 shrink-0 self-end sm:self-center">
                    <span>Threads API Connection</span>
                    <ArrowRight className="w-3 h-3 text-emerald-500" />
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
