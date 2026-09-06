import { LanguageCode, User } from '../types';
import { safeFetchJson } from './safeFetch';

export interface LearningFeedEvent {
  id: string;
  type: 'chat' | 'quiz' | 'download' | 'register';
  title: string;
  subtitle: string;
  icon: string;
  bgClass: string;
  textClass: string;
  timestamp: string;
}

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
  lang?: LanguageCode;
  board?: string;
  systemInstruction?: string;
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
  isGenerating?: boolean; // True when currently generating response upon reconnection
  isResumedAfterOnline?: boolean; // True when answer was successfully generated after reconnecting
}

class OfflineSyncManager {
  private listeners: Set<() => void> = new Set();
  private isOnlineState: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private isSimulatedOfflineState: boolean = false;
  private isPersistedState: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        if (!this.isSimulatedOfflineState) {
          this.handleNetworkChange(true);
        }
      });
      window.addEventListener('offline', () => this.handleNetworkChange(false));
      
      // Auto request/check storage persistence to shield cheap smartphones from data eviction
      this.initPersistentStorage();
    }
  }

  public setSimulatedOffline(simulated: boolean) {
    this.isSimulatedOfflineState = simulated;
    const realOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    const effectiveOnline = realOnline && !simulated;
    
    this.handleNetworkChange(effectiveOnline);
  }

  private async initPersistentStorage() {
    try {
      this.isPersistedState = await this.checkStoragePersistence();
      if (!this.isPersistedState) {
        this.isPersistedState = await this.requestPersistentStorage();
      }
    } catch (err) {
      console.warn("Storage persistence initialization bypassed:", err);
    }
  }

  public async checkStoragePersistence(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persisted) {
      try {
        return await navigator.storage.persisted();
      } catch (err) {
        return false;
      }
    }
    return false;
  }

  public async requestPersistentStorage(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
      try {
        const result = await navigator.storage.persist();
        // console.log(`[Storage Persistence] Enabled: ${result}`);
        this.isPersistedState = result;
        this.notifyUpdate();
        return result;
      } catch (err) {
        console.warn("[Storage Persistence] Permission request failed:", err);
        return false;
      }
    }
    return false;
  }

  public isStoragePersisted(): boolean {
    return this.isPersistedState;
  }

  private handleNetworkChange(online: boolean) {
    this.isOnlineState = online;
    this.notifyUpdate();
    if (online) {
      try {
        this.syncPendingUsers().catch(() => {});
        const stored = localStorage.getItem('gramin_student_session');
        if (stored) {
          const u = JSON.parse(stored);
          if (u && u.mobile) {
            this.reconcileAllPending(u.mobile);
          }
        }
      } catch (err) {
        console.error("Failed to auto-reconcile on network online event", err);
      }
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
    if (this.isSimulatedOfflineState) return false;
    const navOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    return this.isOnlineState && navOnline;
  }

  // --- CHAT HISTORY CACHING ---
  
  public getChatHistory(characterId: string, userMobile: string): ChatMessage[] {
    if (typeof localStorage === 'undefined' || !userMobile) return [];
    const raw = localStorage.getItem(`gramin_chat_history_${userMobile}_${characterId}`);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public saveChatHistory(characterId: string, history: ChatMessage[], userMobile: string) {
    if (typeof localStorage === 'undefined' || !userMobile) return;
    try {
      localStorage.setItem(`gramin_chat_history_${userMobile}_${characterId}`, JSON.stringify(history));
    } catch (e) {
      console.warn("Failed to save chat history to localStorage:", e);
    }
    this.notifyUpdate();
  }

  public clearChatHistory(characterId: string, userMobile: string) {
    if (typeof localStorage === 'undefined' || !userMobile) return;
    try {
      localStorage.removeItem(`gramin_chat_history_${userMobile}_${characterId}`);
    } catch (e) {
      console.warn("Failed to clear chat history from localStorage:", e);
    }
    this.notifyUpdate();
  }

  // --- PENDING CHATS QUEUE ---

  public getPendingChats(userMobile: string): PendingChat[] {
    if (typeof localStorage === 'undefined' || !userMobile) return [];
    const raw = localStorage.getItem(`gramin_pending_chats_${userMobile}`);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public queuePendingChat(chat: PendingChat, userMobile: string) {
    if (typeof localStorage === 'undefined' || !userMobile) return;
    try {
      const list = this.getPendingChats(userMobile);
      list.push(chat);
      localStorage.setItem(`gramin_pending_chats_${userMobile}`, JSON.stringify(list));
    } catch (e) {
      console.warn("Failed to queue pending chat to localStorage:", e);
    }
    this.notifyUpdate();

    // Try automatic immediate reconciliation if online
    if (this.isOnline()) {
      this.reconcileAllPending(userMobile);
    }
  }

  public removePendingChat(chatId: string, userMobile: string) {
    if (typeof localStorage === 'undefined' || !userMobile) return;
    try {
      const list = this.getPendingChats(userMobile).filter(c => c.id !== chatId);
      localStorage.setItem(`gramin_pending_chats_${userMobile}`, JSON.stringify(list));
      this.notifyUpdate();
    } catch (e) {
      console.warn("Failed to remove pending chat:", e);
    }
  }

  // --- PENDING PROGRESS QUEUE ---

  public getPendingProgress(userMobile: string): PendingProgress[] {
    if (typeof localStorage === 'undefined' || !userMobile) return [];
    const raw = localStorage.getItem(`gramin_pending_progress_${userMobile}`);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public queuePendingProgress(type: 'quiz_points' | 'medal_earned', value: string | number, userMobile: string) {
    if (typeof localStorage === 'undefined' || !userMobile) return;
    try {
      const list = this.getPendingProgress(userMobile);
      list.push({
        id: 'prog-' + Math.random().toString(36).substring(2, 9),
        type,
        value,
        timestamp: Date.now()
      });
      localStorage.setItem(`gramin_pending_progress_${userMobile}`, JSON.stringify(list));
    } catch (e) {
      console.warn("Failed to queue pending progress to localStorage:", e);
    }
    this.notifyUpdate();

    // Trigger reconciliation if online
    if (this.isOnline()) {
      this.reconcileAllPending(userMobile);
    }
  }

  // --- RECONCILIATION / SYNC ALGORITHM ---

  private isReconciling = false;

  public async reconcileAllPending(userMobile: string): Promise<{ chatsSynced: number; progressSynced: number; error?: string }> {
    if (this.isReconciling) return { chatsSynced: 0, progressSynced: 0 };
    if (!this.isOnline()) {
      return { chatsSynced: 0, progressSynced: 0, error: "Network offline. Cannot sync right now." };
    }

    this.isReconciling = true;
    let chatsSynced = 0;
    let progressSynced = 0;

    try {
      // 1. Reconcile Pending Chats FIRST with live Gemini (highest priority for user feedback)
      const pendingChats = this.getPendingChats(userMobile);
      if (pendingChats.length > 0) {
        const remainingChats: PendingChat[] = [];

        for (const chat of pendingChats) {
          try {
            // 0. Set generating placeholder in chat history and notify subscribers immediately
            try {
              const currentHist = this.getChatHistory(chat.characterId, userMobile);
              const cleaned = currentHist.filter(m => !m.id.startsWith('ai-off-') && !m.id.startsWith('ai-generating-'));
              const generatingMsg: ChatMessage = {
                id: 'ai-generating-' + chat.id,
                sender: 'assistant',
                text: chat.lang === 'hi' 
                  ? '🔄 इंटरनेट बहाल हुआ! स्वामी एआई आपके प्रश्न का उत्तर तैयार कर रहे हैं...'
                  : '🔄 Online connection restored! Generating your response now...',
                isGenerating: true,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              };
              this.saveChatHistory(chat.characterId, [...cleaned, generatingMsg], userMobile);
              this.notifyUpdate();
            } catch (genErr) {
              console.warn("Failed to inject generating placeholder:", genErr);
            }

            const characterInfo = this.getMascotConfig(chat.characterId);
            
            const bodyPayload: any = {
              message: chat.message,
              systemInstruction: chat.systemInstruction || characterInfo.systemInstruction,
              board: chat.board || 'CBSE',
              lang: chat.lang || 'en'
            };

            if (chat.image) {
              bodyPayload.image = {
                data: chat.image.data,
                mimeType: chat.image.mimeType
              };
            }

            // Fire response to live back-end setup
            const data = await safeFetchJson("/api/gemini/chat", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(bodyPayload)
            });

            if (data.success || data.text) {
              const responseText = data.text || data.message || "Here is the explanation for your query!";
              const history = this.getChatHistory(chat.characterId, userMobile);
              
              // Un-pending user message and remove any temporary offline notice!
              const userIndex = history.findIndex(item => item.id === chat.id);
              
              const aiMsg: ChatMessage = {
                id: 'ai-resumed-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
                sender: 'assistant',
                text: responseText,
                isResumedAfterOnline: true,
                isGenerating: false,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              };

              let updatedHistory: ChatMessage[];
              if (userIndex !== -1) {
                const confirmedUserMsg: ChatMessage = {
                  ...history[userIndex],
                  pending: false,
                  failed: false
                };
                // Strip out any offline notice(s) or generating placeholders
                const before = history.slice(0, userIndex).filter(m => !m.id.startsWith('ai-off-') && !m.id.startsWith('ai-generating-'));
                const after = history.slice(userIndex + 1).filter(m => !m.id.startsWith('ai-off-') && !m.id.startsWith('ai-generating-'));
                updatedHistory = [...before, confirmedUserMsg, aiMsg, ...after];
              } else {
                const cleaned = history.filter(m => !m.id.startsWith('ai-off-') && !m.id.startsWith('ai-generating-'));
                updatedHistory = [...cleaned, aiMsg];
              }

              this.saveChatHistory(chat.characterId, updatedHistory, userMobile);
              chatsSynced++;

              // Also sync into stored session if present
              try {
                const storedSession = localStorage.getItem('gramin_student_session');
                if (storedSession) {
                  const u = JSON.parse(storedSession);
                  if (u && u.chatSessions) {
                    const sessions = JSON.parse(u.chatSessions);
                    if (Array.isArray(sessions)) {
                      const updatedSessions = sessions.map((s: any) => {
                        if (s.characterId === chat.characterId) {
                          return { ...s, messages: updatedHistory, updatedAt: Date.now() };
                        }
                        return s;
                      });
                      u.chatSessions = JSON.stringify(updatedSessions);
                      localStorage.setItem('gramin_student_session', JSON.stringify(u));
                    }
                  }
                }
              } catch (sessErr) {
                // Non-critical session sync
              }
            } else {
              // Hold for next attempt - clean up temporary generating notice
              try {
                const hist = this.getChatHistory(chat.characterId, userMobile);
                const cleaned = hist.filter(m => !m.id.startsWith('ai-generating-'));
                this.saveChatHistory(chat.characterId, cleaned, userMobile);
              } catch {}
              remainingChats.push(chat);
            }
          } catch (itemErr) {
            console.error("Error synchronizing single chat index:", chat.id, itemErr);
            try {
              const hist = this.getChatHistory(chat.characterId, userMobile);
              const cleaned = hist.filter(m => !m.id.startsWith('ai-generating-'));
              this.saveChatHistory(chat.characterId, cleaned, userMobile);
            } catch {}
            remainingChats.push(chat);
          }
        }
        
        localStorage.setItem(`gramin_pending_chats_${userMobile}`, JSON.stringify(remainingChats));
      }

      // 2. Reconcile Learning Progress
      const pendingProgress = this.getPendingProgress(userMobile);
      if (pendingProgress.length > 0) {
        // Submit each progress update to the backend or apply locally to confirmed states
        for (const prog of pendingProgress) {
          if (prog.type === 'quiz_points') {
            const confirmedPoints = parseInt(localStorage.getItem(`${userMobile}_quizzes_total_points`) || '0', 10);
            const nextPoints = confirmedPoints + Number(prog.value);
            localStorage.setItem(`${userMobile}_quizzes_total_points`, String(nextPoints));
          } else if (prog.type === 'medal_earned') {
            const rawMedals = localStorage.getItem(`${userMobile}_profile_earned_medals`);
            const medals: string[] = rawMedals ? JSON.parse(rawMedals) : [];
            if (!medals.includes(String(prog.value))) {
              medals.push(String(prog.value));
              localStorage.setItem(`${userMobile}_profile_earned_medals`, JSON.stringify(medals));
            }
          }
          progressSynced++;
        }
        // Safely clear the progress queue
        localStorage.setItem(`gramin_pending_progress_${userMobile}`, JSON.stringify([]));
      }

      // 3. Reconcile user session non-blocking using Last-Write-Wins (LWW) conflict resolution
      const stored = localStorage.getItem('gramin_student_session');
      if (stored) {
        try {
          const localUser = JSON.parse(stored);
          if (localUser && localUser.mobile === userMobile) {
            import('../lib/firebase').then(({ syncFirebaseUserWithLWW }) => {
              syncFirebaseUserWithLWW(userMobile, localUser).then(({ resolvedUser, conflictResolved, source }) => {
                if (conflictResolved && source === 'remote') {
                  localStorage.setItem('gramin_student_session', JSON.stringify(resolvedUser));
                }
              }).catch(() => {});
            }).catch(() => {});
          }
        } catch (sessionErr) {
          console.warn("[LWW Reconciler] User session LWW reconciliation skipped:", sessionErr);
        }
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

  // --- RECENT LEARNING FEED ---

  public getLearningFeed(userMobile: string, signupDate?: string): LearningFeedEvent[] {
    if (typeof localStorage === 'undefined' || !userMobile) return [];
    const saved = localStorage.getItem(`gramin_learning_feed_${userMobile}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback
      }
    }
    // Default feed for a brand-new user (only has the registration event, no yesterday/today study logs!)
    const defaultFeed: LearningFeedEvent[] = [
      {
        id: 'evt-register',
        type: 'register',
        title: 'Registered GyaanBot Student Academic ID',
        subtitle: `Joined Date: ${signupDate || new Date().toLocaleDateString()}`,
        icon: '🔑',
        bgClass: 'bg-purple-50',
        textClass: 'text-purple-600',
        timestamp: 'Joined'
      }
    ];
    return defaultFeed;
  }

  public addLearningFeedEvent(userMobile: string, event: Omit<LearningFeedEvent, 'id'>) {
    if (typeof localStorage === 'undefined' || !userMobile) return;
    const feed = this.getLearningFeed(userMobile);
    const newEvent: LearningFeedEvent = {
      ...event,
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
    };
    
    // Prevent exactly identical events from stacking up back-to-back
    if (feed.length > 0 && feed[0].title === event.title && feed[0].type === event.type) {
      return;
    }

    const updated = [newEvent, ...feed.filter(e => e.id !== 'evt-register')];
    
    // Keep registration event at the end
    const regEvent = feed.find(e => e.id === 'evt-register');
    if (regEvent && !updated.some(e => e.id === 'evt-register')) {
      updated.push(regEvent);
    }
    
    localStorage.setItem(`gramin_learning_feed_${userMobile}`, JSON.stringify(updated.slice(0, 15)));
    this.notifyUpdate();
  }

  // Helper to fetch Mascot System Instructions
  public getMascotConfig(id: string) {
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

  // =========================================================================
  // OFFLINE USER REGISTRY & RECONCILIATION
  // =========================================================================

  public getLocalUser(mobile: string): User | null {
    if (typeof localStorage === 'undefined' || !mobile) return null;
    try {
      // 1. Check direct mobile key
      const rawUser = localStorage.getItem(`gramin_user_${mobile}`);
      if (rawUser) {
        return JSON.parse(rawUser) as User;
      }

      // 2. Check registered users dictionary
      const rawReg = localStorage.getItem('gramin_registered_users');
      if (rawReg) {
        const dict = JSON.parse(rawReg) as Record<string, User>;
        if (dict && dict[mobile]) {
          return dict[mobile];
        }
      }

      // 3. Check active student/admin sessions
      const studentSession = localStorage.getItem('gramin_student_session');
      if (studentSession) {
        const u = JSON.parse(studentSession) as User;
        if (u && u.mobile === mobile) return u;
      }
      const adminSession = localStorage.getItem('gramin_admin_session');
      if (adminSession) {
        const u = JSON.parse(adminSession) as User;
        if (u && u.mobile === mobile) return u;
      }

      // 4. Default Admin fallback for administrative mobile
      if (mobile === '9999999999') {
        const defaultAdmin: User = {
          mobile: '9999999999',
          name: 'System Administrator',
          role: 'admin',
          adminPin: '999999',
          defaultLanguage: 'en',
          signupDate: new Date().toLocaleDateString(),
          village: 'HQ Control Center',
          school: 'State Education Board',
          standard: 'Admin Staff',
          streakDays: 99,
          totalPoints: 5000,
          studyMins: 1200
        };
        return defaultAdmin;
      }
    } catch (e) {
      console.warn("Error reading local user:", e);
    }
    return null;
  }

  public saveLocalUser(user: Partial<User> & { mobile: string }, isNewRegistration: boolean = false): User {
    if (typeof localStorage === 'undefined' || !user.mobile) return user as User;
    
    const existing = this.getLocalUser(user.mobile);
    const fullUser: User = {
      mobile: user.mobile,
      name: user.name || existing?.name || "Student",
      defaultLanguage: user.defaultLanguage || existing?.defaultLanguage || "en",
      role: user.role || existing?.role || (user.mobile === "9999999999" ? "admin" : "student"),
      signupDate: user.signupDate || existing?.signupDate || new Date().toLocaleDateString(),
      state: user.state || existing?.state || "Gujarat",
      village: user.village || existing?.village || "",
      school: user.school || existing?.school || "",
      standard: user.standard || existing?.standard || "",
      board: user.board || existing?.board || "",
      streakDays: user.streakDays ?? existing?.streakDays ?? 1,
      totalPoints: user.totalPoints ?? existing?.totalPoints ?? 15,
      studyMins: user.studyMins ?? existing?.studyMins ?? 30,
      adminPin: user.adminPin || existing?.adminPin || (user.role === 'admin' ? '999999' : undefined),
      isOfflineCreated: user.isOfflineCreated ?? existing?.isOfflineCreated ?? !this.isOnline(),
      pendingSync: user.pendingSync ?? (isNewRegistration || !this.isOnline()),
      updatedAt: user.updatedAt || Date.now(),
      ...user
    };

    try {
      localStorage.setItem(`gramin_user_${user.mobile}`, JSON.stringify(fullUser));
      
      const rawReg = localStorage.getItem('gramin_registered_users');
      const dict: Record<string, User> = rawReg ? JSON.parse(rawReg) : {};
      dict[user.mobile] = fullUser;
      localStorage.setItem('gramin_registered_users', JSON.stringify(dict));

      if (fullUser.pendingSync) {
        this.queuePendingUserSync(fullUser);
      }
    } catch (e) {
      console.warn("Failed saving local user:", e);
    }

    this.notifyUpdate();

    if (this.isOnline()) {
      this.syncPendingUsers().catch(() => {});
    }

    return fullUser;
  }

  public getAllLocalUsers(): User[] {
    if (typeof localStorage === 'undefined') return [];
    try {
      const rawReg = localStorage.getItem('gramin_registered_users');
      if (rawReg) {
        const dict = JSON.parse(rawReg) as Record<string, User>;
        return Object.values(dict);
      }
    } catch (e) {
      console.warn("Error getting all local users:", e);
    }
    return [];
  }

  public getPendingUsersToSync(): User[] {
    if (typeof localStorage === 'undefined') return [];
    try {
      const raw = localStorage.getItem('gramin_pending_user_sync');
      if (raw) return JSON.parse(raw) as User[];
    } catch (e) {}
    return [];
  }

  public queuePendingUserSync(user: User) {
    if (typeof localStorage === 'undefined') return;
    try {
      const list = this.getPendingUsersToSync();
      const existingIdx = list.findIndex(u => u.mobile === user.mobile);
      if (existingIdx >= 0) {
        list[existingIdx] = user;
      } else {
        list.push(user);
      }
      localStorage.setItem('gramin_pending_user_sync', JSON.stringify(list));
    } catch (e) {
      console.warn("Failed to queue pending user sync:", e);
    }
  }

  public async syncPendingUsers(): Promise<number> {
    if (!this.isOnline()) return 0;
    const pending = this.getPendingUsersToSync();
    if (pending.length === 0) return 0;

    let synced = 0;
    try {
      // 1. Sync batch with backend API
      const res = await safeFetchJson('/api/auth/offline-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users: pending })
      });

      // 2. Sync each with Firestore
      const { syncFirebaseUserWithLWW } = await import('../lib/firebase');
      for (const u of pending) {
        try {
          await syncFirebaseUserWithLWW(u.mobile, u);
          synced++;
        } catch (fbErr) {
          console.warn("Firestore sync for user skipped/deferred:", fbErr);
        }
      }

      // Clear pending queue upon successful backend broadcast
      if (res && res.success) {
        localStorage.setItem('gramin_pending_user_sync', JSON.stringify([]));
      }
    } catch (err) {
      console.warn("Failed syncing pending users:", err);
    }

    return synced;
  }
}

export const offlineSyncManager = new OfflineSyncManager();
