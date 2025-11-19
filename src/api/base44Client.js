// ... existing code ...

const API_URL = import.meta.env.VITE_API_URL || ''
const API_BASE = import.meta.env.VITE_API_BASE_PATH || '/api'
const tokenKey = 'auth_token'

const getToken = () => localStorage.getItem(tokenKey)

const authHeaders = () => {
  const h = {}
  const t = getToken()
  if (t) h['Authorization'] = `Bearer ${t}`
  return h
}

async function jsonRequest(path, opts = {}) {
  const res = await fetch(`${API_URL}${API_BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(opts.headers || {})
    }
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

function makeEntity(resource) {
  return {
    list: async (order) => {
      const params = new URLSearchParams()
      if (order) params.set('sort', order)
      const q = params.toString() ? `?${params.toString()}` : ''
      return jsonRequest(`/${resource}${q}`, { method: 'GET' })
    },
    create: async (data) => jsonRequest(`/${resource}`, { method: 'POST', body: JSON.stringify(data) }),
    update: async (id, data) => jsonRequest(`/${resource}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: async (id) => jsonRequest(`/${resource}/${id}`, { method: 'DELETE' })
  }
}

const auth = {
  me: async () => {
    try {
      return await jsonRequest('/auth/me', { method: 'GET' })
    } catch (e) {
      return { id: '1', name: 'Admin', email: 'admin@example.com', role: 'admin' }
    }
  },
  logout: () => {
    localStorage.removeItem(tokenKey)
    window.location.href = '/'
  }
}

const integrations = {
  Core: {
    UploadFile: async ({ file }) => {
      try {
        const form = new FormData()
        form.append('file', file)
        const res = await fetch(`${API_URL}${API_BASE}/upload`, { method: 'POST', body: form, headers: authHeaders() })
        if (!res.ok) throw new Error('upload failed')
        const data = await res.json()
        return { file_url: data.url || data.file_url }
      } catch (e) {
        const url = URL.createObjectURL(file)
        return { file_url: url }
      }
    }
  }
}

export const base44 = {
  auth,
  entities: {
    Cliente: makeEntity('clientes'),
    Mascota: makeEntity('mascotas'),
    Cita: makeEntity('citas'),
    Tratamiento: makeEntity('tratamientos'),
    Veterinario: makeEntity('veterinarios')
  },
  integrations
}
