import client from './client'

export const getMatchup = (id) => client.get(`/matchups/${id}`)
