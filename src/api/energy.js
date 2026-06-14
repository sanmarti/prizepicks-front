import client from './client'

export const getEnergy = () => client.get('/energy')
export const buyEnergy = (pack) => client.post('/energy/buy', { pack })
