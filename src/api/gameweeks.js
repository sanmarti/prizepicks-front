import client from './client'

export const getGameweeks = () => client.get('/gameweeks')
export const getGameweek = (id) => client.get(`/gameweeks/${id}`)
