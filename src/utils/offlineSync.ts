import { LanguageCode } from '../types';

export interface PendingProgress {
  id: string;
  type: 'quiz_points' | 'medal_earned';
  value: string | number;
  timestamp: number;
}

export interface PendingChat {
  id: string;
  characterId: string;
  message: string;
  image?: {
    data: string;
    mimeType: string;
    name?: string;
  };
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  image?: {
    data: string;
    mimeType: string;
    name?: string;
  };
  pending?: boolean; // True if sent while offline and not yet processed
  failed?: boolean; // True if sync failed
}

class OfflineSyncManager {
  private listeners: Set<() => void> = new Set();
  private isOnlineState: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleNetworkChange(true));
      window.addEventListener('offline', () => this.handleNetworkChange(false));
    }
  }

  private handleNetworkChange(online: boolean) {
    this.isOnlineState = online;
    this.notifyUpdate();
    if (online) {
      this.reconcileAllPending();
    }
  }

  public subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyUpdate() {
    this.listeners.forEach(cb => {
      try {
        cb();
      } catch (err) {
        console.error("Error in offlineSync subscriber:", err);
      }
    });
  }

  public isOnline(): boolean {
    return this.isOnlineState;
  }

  // --- CHAT HISTORY CACHING ---
  
  public getChatHistory(characterId: string): ChatMessage[] {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(`gramin_chat_history_${characterId}`);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public saveChatHistory(characterId: string, history: ChatMessage[]) {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(`gramin_chat_history_${characterId}`, JSON.stringify(history));
    this.notifyUpdate();
  }

  public clearChatHistory(characterId: string) {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(`gramin_chat_history_${characterId}`);
    this.notifyUpdate();
  }

  // --- PENDING CHATS QUEUE ---

  public getPendingChats(): PendingChat[] {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem('gramin_pending_chats');
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public queuePendingChat(chat: PendingChat) {
    if (typeof localStorage === 'undefined') return;
    const list = this.getPendingChats();
    list.push(chat);
    localStorage.setItem('gramin_pending_chats', JSON.stringify(list));
    this.notifyUpdate();

    // Try automatic immediate reconciliation if online
    if (this.isOnline()) {
      this.reconcileAllPending();
    }
  }

  // --- PENDING PROGRESS QUEUE ---

  public getPendingProgress(): PendingProgress[] {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem('gramin_pending_progress');
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public queuePendingProgress(type: 'quiz_points' | 'medal_earned', value: string | number) {
    if (typeof localStorage === 'undefined') return;
    const list = this.getPendingProgress();
    list.push({
      id: 'prog-' + Math.random().toString(36).substring(2, 9),
      type,
      value,
      timestamp: Date.now()
    });
    localStorage.setItem('gramin_pending_progress', JSON.stringify(list));
    this.notifyUpdate();

    // Trigger reconciliation if online
    if (this.isOnline()) {
      this.reconcileAllPending();
    }
  }

  // --- RECONCILIATION / SYNC ALGORITHM ---

  private isReconciling = false;

  public async reconcileAllPending(): Promise<{ chatsSynced: number; progressSynced: number; error?: string }> {
    if (this.isReconciling) return { chatsSynced: 0, progressSynced: 0 };
    if (!this.isOnline()) {
      return { chatsSynced: 0, progressSynced: 0, error: "Network offline. Cannot sync right now." };
    }

    this.isReconciling = true;
    let chatsSynced = 0;
    let progressSynced = 0;

    try {
      // 1. Reconcile Learning Progress
      const pendingProgress = this.getPendingProgress();
      if (pendingProgress.length > 0) {
        // Submit each progress update to the backend or apply locally to confirmed states
        for (const prog of pendingProgress) {
          if (prog.type === 'quiz_points') {
            const confirmedPoints = parseInt(localStorage.getItem('quizzes_total_points') || '0', 10);
            const nextPoints = confirmedPoints + Number(prog.value);
            localStorage.setItem('quizzes_total_points', String(nextPoints));
          } else if (prog.type === 'medal_earned') {
            const rawMedals = localStorage.getItem('profile_earned_medals');
            const medals: string[] = rawMedals ? JSON.parse(rawMedals) : [];
            if (!medals.includes(String(prog.value))) {
              medals.push(String(prog.value));
              localStorage.setItem('profile_earned_medals', JSON.stringify(medals));
            }
          }
          progressSynced++;
        }
        // Safely clear the progress queue
        localStorage.setItem('gramin_pending_progress', JSON.stringify([]));
      }

      // 2. Reconcile Pending Chats with live Gemini
      const pendingChats = this.getPendingChats();
      if (pendingChats.length > 0) {
        const remainingChats: PendingChat[] = [];

        for (const chat of pendingChats) {
          try {
            const characterInfo = this.getMascotConfig(chat.characterId);
            
            const bodyPayload: any = {
              message: chat.message,
              systemInstruction: characterInfo.systemInstruction
            };

            if (chat.image) {
              bodyPayload.image = {
                data: chat.image.data,
                mimeType: chat.image.mimeType
              };
            }

            // Fire response to live back-end setup
            const response = await fetch("/api/gemini/chat", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(bodyPayload)
            });

            const data = await response.json();

            if (data.success) {
              // Append to character chat logs, removing the 'pending' tag from user message
              const history = this.getChatHistory(chat.characterId);
              
              // Find and un-pending the message
              const updatedHistory = history.map(item => {
                if (item.id === chat.id) {
                  return { ...item, pending: false };
                }
                return item;
              });

              // Add actual mascot answer
              const aiMsg: ChatMessage = {
                id: 'ai-' + Date.now(),
                sender: 'assistant',
                text: data.text,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              };
              
              updatedHistory.push(aiMsg);
              this.saveChatHistory(chat.characterId, updatedHistory);
              chatsSynced++;
            } else {
              // Hold for next attempt
              remainingChats.push(chat);
            }
          } catch (itemErr) {
            console.error("Error synchronizing single chat index:", chat.id, itemErr);
            remainingChats.push(chat);
          }
        }
        
        localStorage.setItem('gramin_pending_chats', JSON.stringify(remainingChats));
      }

      this.notifyUpdate();
      return { chatsSynced, progressSynced };

    } catch (e: any) {
      console.error("Critical failure during background reconciliation:", e);
      return { chatsSynced, progressSynced, error: e.message || "Failed during background sync" };
    } finally {
      this.isReconciling = false;
    }
  }

  // Helper to fetch Mascot System Instructions
  private getMascotConfig(id: string) {
    switch (id) {
      case 'dadi':
        return {
          systemInstruction: `You are Dadi AI 👵, a wise, warm village grandmother and traditional storyteller. 
Your goal is to teach rural Indian children concept of stars, clouds, rain, farming, or moral life lessons. Keep answers sweet and warmly encouraging.`
        };
      case 'chanda':
        return {
          systemInstruction: `You are Chanda AI 🦊, a clever, hyperactive forest fox who is a master of Mathematics. Keep your replies witty, helpful, and energetic.`
        };
      default: // swami
        return {
          systemInstruction: `You are Swami AI 🤖, a friendly, encouraging robot educational mascot designed for rural Indian students. Teach Science, Logic, and lessons easily.`
        };
    }
  }
}

export const offlineSyncManager = new OfflineSyncManager();
