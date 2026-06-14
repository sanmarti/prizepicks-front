import { create } from 'zustand'

export const useEnergyStore = create((set) => ({
  balance: 0,
  setBalance: (n) => set({ balance: n }),
  addBalance: (n) => set((s) => ({ balance: s.balance + n })),
}))
