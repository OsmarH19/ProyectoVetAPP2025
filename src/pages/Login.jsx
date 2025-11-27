import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const canSubmit = email.trim() && password.trim() && !isLoading

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!canSubmit) return
    setIsLoading(true)
    setError("")
    try {
      const res = await fetch("http://localhost:8000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (data?.status) {
        localStorage.setItem("auth_user", JSON.stringify(data.user))
        const last = localStorage.getItem('last_route')
        navigate(last && last.toLowerCase() !== '/login' ? last : "/Dashboard", { replace: true })
      } else {
        setError(data?.message || "Credenciales incorrectas")
      }
    } catch (e1) {
      setError("No se pudo iniciar sesión. Inténtalo nuevamente")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      <div className="hidden md:block relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/30 z-10 pointer-events-none" />
        <img
          src="/img/login.jpg"
          alt="VetCare"
          className="absolute inset-0 w-full h-full object-cover object-center md:object-left"
        />
        <div className="absolute z-20 bottom-8 left-8 text-white">
          <p className="text-lg font-medium">Bienvenido a VetCare</p>
          <p className="text-sm opacity-80">Gestión veterinaria moderna</p>
        </div>
      </div>
      <div className="flex items-center justify-center p-6 sm:p-10 bg-gradient-to-br from-white via-white to-gray-50">
        <Card className="w-full max-w-md shadow-xl border-none">
          <CardContent className="p-8 space-y-6">
            <div className="space-y-2 text-center">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">Iniciar Sesión</h1>
              <p className="text-sm text-gray-600">Ingresa tus credenciales para continuar</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@correo.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              {error && (
                <div className="rounded-md bg-red-50 text-red-700 text-sm px-3 py-2">
                  {error}
                </div>
              )}
              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={!canSubmit}
              >
                {isLoading ? "Ingresando..." : "Iniciar Sesión"}
              </Button>
            </form>
            <div className="text-center">
              <p className="text-xs text-gray-500">© {new Date().getFullYear()} VetCare</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
