// server/index.js
import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: true }))
app.use(express.json())

const resources = ['clientes','mascotas','citas','tratamientos','veterinarios']
const dataDir = path.resolve(__dirname, 'data')
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir)

const filePath = (r) => path.join(dataDir, `${r}.json`)
const ensure = (r) => { const p = filePath(r); if (!fs.existsSync(p)) fs.writeFileSync(p, '[]') }
const read = (r) => { ensure(r); return JSON.parse(fs.readFileSync(filePath(r), 'utf-8') || '[]') }
const write = (r, arr) => fs.writeFileSync(filePath(r), JSON.stringify(arr, null, 2))
const sortBy = (arr, sort) => {
  if(!sort) return arr
  const desc = sort.startsWith('-')
  const f = desc ? sort.slice(1) : sort
  return [...arr].sort((a,b)=> {
    const av=a?.[f], bv=b?.[f]
    if (av>bv) return desc?-1:1
    if (av<bv) return desc?1:-1
    return 0
  })
}
const isValidResource = (r) => resources.includes(r)

app.get('/api/auth/me', (req, res) => res.json({ id: '1', name: 'Admin', email: 'admin@example.com', role: 'admin' }))
app.post('/api/upload', (req, res) => res.json({ url: `/uploads/fake-${Date.now()}.png` }))

app.get('/api/:resource', (req, res) => {
  const r = req.params.resource
  if (!isValidResource(r)) return res.status(404).json({ error: 'not found' })
  const sort = req.query.sort
  res.json(sortBy(read(r), sort))
})

app.get('/api/:resource/:id', (req, res) => {
  const r = req.params.resource
  const id = req.params.id
  if (!isValidResource(r)) return res.status(404).json({ error: 'not found' })
  const item = read(r).find(i => String(i.id) === String(id))
  return item ? res.json(item) : res.status(404).json({ error: 'not found' })
})

app.post('/api/:resource', (req, res) => {
  const r = req.params.resource
  if (!isValidResource(r)) return res.status(404).json({ error: 'not found' })
  const items = read(r)
  const id = String(Date.now())
  const item = { ...req.body, id, created_date: new Date().toISOString() }
  items.push(item)
  write(r, items)
  res.status(201).json(item)
})

app.put('/api/:resource/:id', (req, res) => {
  const r = req.params.resource
  const id = req.params.id
  if (!isValidResource(r)) return res.status(404).json({ error: 'not found' })
  const items = read(r)
  const idx = items.findIndex(i => String(i.id) === String(id))
  if (idx === -1) return res.status(404).json({ error: 'not found' })
  items[idx] = { ...items[idx], ...req.body, updated_date: new Date().toISOString() }
  write(r, items)
  res.json(items[idx])
})

app.delete('/api/:resource/:id', (req, res) => {
  const r = req.params.resource
  const id = req.params.id
  if (!isValidResource(r)) return res.status(404).json({ error: 'not found' })
  const items = read(r).filter(i => String(i.id) !== String(id))
  write(r, items)
  res.json({ id })
})

// 📦 Servir frontend de React (Vite build)
const frontendPath = path.join(__dirname, "../dist");
app.use(express.static(frontendPath));

// 🔁 Cualquier ruta que no sea API devuelve el index.html
app.use((req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});


if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
}
