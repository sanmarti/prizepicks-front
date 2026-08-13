import client from './client'

export const getMyLeagues       = ()           => client.get('/leagues')
export const createLeague       = (data)       => client.post('/leagues', data)
export const getLeague          = (id)         => client.get(`/leagues/${id}`)
export const updateLeague       = (id, data)   => client.put(`/leagues/${id}`, data)
export const joinLeague         = (code)       => client.post(`/leagues/join/${code}`)
export const getLeagueStandings = (id)         => client.get(`/leagues/${id}/standings`)
export const createLeaguePeriod = (id, data)   => client.post(`/leagues/${id}/periods`, data)
export const toggleMemberPayment= (id, userId, has_paid) => client.put(`/leagues/${id}/members/${userId}/payment`, { has_paid })
export const leaveLeague        = (id)         => client.delete(`/leagues/${id}/leave`)
export const getSprints         = ()           => client.get('/leagues/sprints')
export const updatePeriod       = (id, periodId, data) => client.put(`/leagues/${id}/periods/${periodId}`, data)
