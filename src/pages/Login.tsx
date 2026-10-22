import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import logoGrupoVl from '@/assets/logogrupovlsemfundo-099cc.png'
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
    <div className="min-h-screen bg-[#F0F2F7] flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-slate-200 bg-white">
        <CardHeader className="text-center space-y-3 pb-6">
          <div className="mx-auto bg-white px-5 py-3 rounded-2xl shadow-md border border-slate-200/80 flex items-center justify-center w-fit">
            <img
              src={logoGrupoVl}
              alt="Grupo VL"
              className="h-20 w-auto max-w-[180px] object-contain drop-shadow-xs"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-[#1E2749]">Gestão Patrimonial</CardTitle>
          <CardDescription className="text-sm text-slate-500">
            Acesso ao sistema corporativo de gestão física, digital e patrimonial do Grupo VL
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
                <Link
                  to="/forgot-password"
                  className="text-xs text-[#1E2749] hover:underline font-medium"
                >
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

            <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-700 border border-slate-200 flex flex-col gap-1">
              <span className="font-semibold text-[#1E2749]">
                Acesso Demonstração Administrador:
              </span>
              <span>
                E-mail: <strong className="text-slate-900">admin@flarquivos.com</strong>
              </span>
              <span>
                Senha: <strong className="text-slate-900">Skip@Pass</strong>
              </span>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-white font-medium shadow-md shadow-primary/20"
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
              <Link to="/signup" className="text-[#1E2749] font-semibold hover:underline">
                Criar conta
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
