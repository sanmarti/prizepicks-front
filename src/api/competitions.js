import axios from 'axios'

const publicClient = axios.create({
  baseURL: import.meta.env.VITE_PUBLIC_API_URL ?? import.meta.env.VITE_API_URL,
})

export const getCompetitions = () => publicClient.get('/competitions')
