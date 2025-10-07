import React, { createContext, useContext, useMemo, useState } from 'react';
import { azubis as seedAzubis, firmen as seedFirmen, initialMatches, initialMessages } from '../data/mock';

type Role = 'azubi' | 'firma';
type Azubi = typeof seedAzubis[number];
type Firma = typeof seedFirmen[number];

interface Match { id: string; azubiId: string; firmaId: string; createdAt: number }
interface Message { id: string; chatId: string; senderId: string; text: string; createdAt: number }

interface AppState {
  currentUser: Azubi | Firma;
  azubis: Azubi[];
  firmen: Firma[];
  matches: Match[];
  messages: Message[];
  createMatch: (azubiId: string, firmaId: string) => void;
  sendMessage: (chatId: string, senderId: string, text: string) => void;
}

const Ctx = createContext<AppState>(null as any);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [azubis] = useState(seedAzubis);
  const [firmen] = useState(seedFirmen);
  const [matches, setMatches] = useState<Match[]>(initialMatches as any);
  const [messages, setMessages] = useState<Message[]>(initialMessages as any);

  // Demo: eingeloggt als Firma f1
  const currentUser: Azubi | Firma = firmen[0];

  const createMatch = (azubiId: string, firmaId: string) => {
    const m: Match = { id: `m_${Date.now()}`, azubiId, firmaId, createdAt: Date.now() };
    setMatches(prev => [m, ...prev]);
  };

  const sendMessage = (chatId: string, senderId: string, text: string) => {
    const msg: Message = { id: `msg_${Date.now()}`, chatId, senderId, text, createdAt: Date.now() };
    setMessages(prev => [...prev, msg]);
  };

  const value = useMemo(() => ({ currentUser, azubis, firmen, matches, messages, createMatch, sendMessage }),
    [currentUser, azubis, firmen, matches, messages]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useApp = () => useContext(Ctx);
