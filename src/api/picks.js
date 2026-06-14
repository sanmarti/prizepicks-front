import client from './client'

export const submitPicks = (data) => client.post('/picks', data)
export const getPicks = (gameweekId) => client.get(`/picks?gameweek=${gameweekId}`)
