import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetState = () => {
    try {
      localStorage.removeItem('auto_threads_accounts');
      localStorage.removeItem('auto_threads_schedule');
      localStorage.removeItem('auto_threads_logs');
    } catch {
      // ignore
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center p-6 font-sans">
          <div className="bg-[#111] border border-[#262626] rounded-2xl p-8 max-w-md w-full shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 bg-red-950/40 border border-red-900/50 rounded-2xl flex items-center justify-center mx-auto text-red-400">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-bold text-white">เกิดข้อผิดพลาดในการแสดงผล</h2>
              <p className="text-xs text-neutral-400 leading-relaxed">
                ระบบตรวจพบข้อผิดพลาดที่ไม่คาดคิดในหน้าจอ คุณสามารถรีโหลดหน้าเว็บเพื่อกลับมาใช้งานใหม่ได้ทันที
              </p>
              {this.state.error?.message && (
                <div className="bg-[#080808] border border-[#222] p-3 rounded-lg text-left text-[11px] font-mono text-red-300 break-all max-h-24 overflow-y-auto mt-3">
                  {this.state.error.message}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full sm:w-auto bg-white hover:bg-neutral-100 text-black text-xs font-bold px-5 py-2.5 rounded-xl inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>รีโหลดหน้าเว็บ</span>
              </button>

              <button
                type="button"
                onClick={this.handleResetState}
                className="w-full sm:w-auto bg-[#1C1C1C] hover:bg-[#262626] text-neutral-300 hover:text-white border border-[#333] text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
              >
                ล้างข้อมูลแคช & รีโหลด
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
