import React, { createContext, useContext, useMemo, useState } from 'react';
import { azubis as seedAzubis, firmen as seedFirmen, initialMatches, initialMessages } from '../data/mock';

const Ctx = createContext(null);

export function AppProvider({ children }) {
  const [azubis] = useState(seedAzubis);
  const [firmen] = useState(seedFirmen);
  const [matches, setMatches] = useState(initialMatches);
  const [messages, setMessages] = useState(initialMessages);
  const currentUser = firmen[0]; // Demo: als Firma f1 eingeloggt

  const createMatch = (azubiId, firmaId) => {
    setMatches(prev => [{ id: `m_${Date.now()}`, azubiId, firmaId, createdAt: Date.now() }, ...prev]);
  };

  const sendMessage = (chatId, senderId, text) => {
    setMessages(prev => [...prev, { id: `msg_${Date.now()}`, chatId, senderId, text, createdAt: Date.now() }]);
  };

  const value = useMemo(() => ({ currentUser, azubis, firmen, matches, messages, createMatch, sendMessage }), [currentUser, azubis, firmen, matches, messages]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useApp = () => useContext(Ctx);
