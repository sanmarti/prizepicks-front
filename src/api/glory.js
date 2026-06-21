import client from './client'

export const getGloryStatus       = ()           => client.get('/glory/status')
export const getCurrentGameweek   = ()           => client.get('/glory/gameweek')
export const getGloryGameweek     = (id)         => client.get(`/glory/gameweek/${id}`)
export const submitGloryPicks     = (id, picks)  => client.post(`/glory/gameweek/${id}/picks`, { picks })
export const getMyGloryPicks      = (id)         => client.get(`/glory/gameweek/${id}/picks`)
export const getGloryProfile      = ()           => client.get('/glory/profile')
export const getGloryLeaderboard  = (params)     => client.get('/glory/leaderboard', { params })
export const getGlorySprints      = ()           => client.get('/glory/sprints')
