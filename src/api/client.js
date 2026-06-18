import axios from 'axios'

// Fallback ensures the URL is always present even if the build env var is missing
const BASE_URL =
  import.meta.env.VITE_API_URL ||
  'https://uglbx8p4l4.execute-api.eu-west-3.amazonaws.com/prod'

const client = axios.create({ baseURL: BASE_URL })

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('pp_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('pp_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default client
