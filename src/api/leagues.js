import client from './client'

export const getLeagues = () => client.get('/leagues')
export const getLeague = (id) => client.get(`/leagues/${id}`)
export const createLeague = (data) => client.post('/leagues', data)
export const updateLeague = (id, data) => client.put(`/leagues/${id}`, data)
export const joinLeague = (code) => client.post('/leagues/join', { code })
export const getStandings = (id) => client.get(`/leagues/${id}/standings`)
