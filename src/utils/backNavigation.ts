import { LanguageCode } from '../types';

export type BackHandler = () => boolean;

interface BackHandlerEntry {
  id: string;
  handler: BackHandler;
}

const handlerStack: BackHandlerEntry[] = [];
let nextId = 1;

/**
 * Register a modal/drawer back handler.
 * If the handler returns true, the back action was consumed and default back navigation is halted.
 * Returns an unregister cleanup function.
 */
export function registerBackHandler(handler: BackHandler): () => void {
  const id = `bh_${nextId++}`;
  handlerStack.push({ id, handler });
  return () => {
    const idx = handlerStack.findIndex(entry => entry.id === id);
    if (idx !== -1) {
      handlerStack.splice(idx, 1);
    }
  };
}

/**
 * Execute the topmost registered handler.
 * Returns true if a handler consumed the event.
 */
export function executeBackHandlers(): boolean {
  for (let i = handlerStack.length - 1; i >= 0; i--) {
    try {
      const consumed = handlerStack[i].handler();
      if (consumed) {
        return true;
      }
    } catch (e) {
      console.warn('[backNavigation] Error in back handler:', e);
    }
  }
  return false;
}

export const EXIT_TOAST_MESSAGES: Record<LanguageCode, string> = {
  en: 'Press back again to exit GyaanBot',
  hi: 'ज्ञानबॉट से बाहर निकलने के लिए दोबारा बैक दबाएं',
  gu: 'જ્ઞાનબોટમાંથી બહાર નીકળવા માટે ફરીથી બેક દબાવો',
  mr: 'ज्ञानबॉटमधून बाहेर पडण्यासाठी पुन्हा बॅक दाबा',
  ta: 'GyaanBot-லிருந்து வெளியேற மீண்டும் பின் செல்ல அழுத்தவும்',
  te: 'జ్ఞాన్‌బాట్ నుండి నిష్క్రమించడానికి మళ్లీ వెనుకకు నొక్కండి',
};
