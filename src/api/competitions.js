import axios from 'axios'
import client from './client'

const publicClient = axios.create({
  baseURL: import.meta.env.VITE_PUBLIC_API_URL ?? import.meta.env.VITE_API_URL,
})

export const getCompetitions    = ()     => publicClient.get('/competitions')
export const getScores          = (date) => client.get('/scores', { params: date ? { date } : {} })
export const getPublicGameweek  = ()     => publicClient.get('/public/gameweek')
