import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Folders, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin@flarquivos.com')
  const [password, setPassword] = useState('Skip@Pass')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err: unknown) {
      console.error(err)
      setError('Credenciais inválidas. Verifique seu e-mail e senha.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-slate-200">
        <CardHeader className="text-center space-y-2 pb-6">
          <div className="mx-auto w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md">
            <Folders className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">FL Arquivos</CardTitle>
          <CardDescription className="text-sm text-slate-500">
            Acesso ao sistema de gestão física, digital e patrimonial
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive" className="py-2.5">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">E-mail corporativo</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="email"
                  required
                  placeholder="seu.email@empresa.com"
                  className="pl-9 text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">Senha</label>
                <Link to="/forgot-password" className="text-xs text-blue-600 hover:underline">
                  Esqueceu a senha?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="pl-9 text-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="p-3 bg-blue-50/70 rounded-lg text-xs text-blue-900 border border-blue-100 flex flex-col gap-1">
              <span className="font-semibold text-blue-800">
                Acesso Demonstração Administrador:
              </span>
              <span>
                E-mail: <strong className="text-blue-950">admin@flarquivos.com</strong>
              </span>
              <span>
                Senha: <strong className="text-blue-950">Skip@Pass</strong>
              </span>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 font-medium"
            >
              {loading ? (
                'Entrando...'
              ) : (
                <span className="flex items-center gap-2">
                  Entrar no Sistema
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
            <div className="text-center text-xs text-slate-500">
              Não tem conta?{' '}
              <Link to="/signup" className="text-blue-600 font-semibold hover:underline">
                Criar conta
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
