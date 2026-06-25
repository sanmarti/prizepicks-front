import axios from 'axios'
import client from './client'

// Public API is a separate Gateway — never fall back to the private main API
const publicClient = axios.create({
  baseURL:
    import.meta.env.VITE_PUBLIC_API_URL ||
    'https://5gdrajqcvb.execute-api.eu-west-3.amazonaws.com/prod',
})

export const getCompetitions    = ()     => publicClient.get('/competitions')
export const getScores          = (date) => client.get('/scores', { params: date ? { date } : {} })
export const getPublicGameweek  = ()     => publicClient.get('/public/gameweek')
