import { create } from 'zustand';
import { api } from '../lib/api';

// Module-scoped poll interval so it survives component remounts
let pollInterval = null;

const STALE_MS = 20_000;

export const useWhatsappStore = create((set, get) => ({
  connected: false,
  phone: null,
  state: 'disconnected',
  lastChecked: 0,
  checking: false,

  setStatus: ({ connected, phone, state }) =>
    set({
      connected: !!connected,
      phone: phone || null,
      state: state || (connected ? 'open' : 'disconnected'),
      lastChecked: Date.now(),
    }),

  fetchStatus: async (force = false) => {
    const { checking, lastChecked } = get();
    if (checking) return null;
    if (!force && Date.now() - lastChecked < STALE_MS) return null;

    set({ checking: true });
    try {
      const data = await api.get('/whatsapp/status');
      set({
        connected: !!data.connected,
        phone: data.phone || null,
        state: data.state || (data.connected ? 'open' : 'disconnected'),
        lastChecked: Date.now(),
        checking: false,
      });
      return data;
    } catch (err) {
      set({ checking: false });
      return null;
    }
  },

  startPolling: (onConnected) => {
    if (pollInterval) clearInterval(pollInterval);
    pollInterval = setInterval(async () => {
      const data = await get().fetchStatus(true);
      if (data?.connected) {
        get().stopPolling();
        if (typeof onConnected === 'function') onConnected(data);
      }
    }, 3000);
  },

  stopPolling: () => {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  },

  reset: () => {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
    set({
      connected: false,
      phone: null,
      state: 'disconnected',
      lastChecked: Date.now(),
      checking: false,
    });
  },
}));

export function stopGlobalPolling() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
}
