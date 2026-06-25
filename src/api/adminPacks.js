import client from './client'

export const listAdminPacks   = ()        => client.get('/admin/energy-packs')
export const createAdminPack  = (data)    => client.post('/admin/energy-packs', data)
export const updateAdminPack  = (id, data)=> client.put(`/admin/energy-packs/${id}`, data)
export const deleteAdminPack  = (id)      => client.delete(`/admin/energy-packs/${id}`)
