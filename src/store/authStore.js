import { create } from 'zustand'

function decodeJwt(token) {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload))
  } catch {
    return null
  }
}

const storedToken = localStorage.getItem('pp_token')

export const useAuthStore = create((set) => ({
  token: storedToken || null,
  user: storedToken ? decodeJwt(storedToken) : null,

  login(data) {
    const { token } = data
    localStorage.setItem('pp_token', token)
    set({ token, user: decodeJwt(token) })
  },

  logout() {
    localStorage.removeItem('pp_token')
    set({ token: null, user: null })
    window.location.href = '/login'
  },
}))
