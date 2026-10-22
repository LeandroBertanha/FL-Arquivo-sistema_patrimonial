import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
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
import { Mail, CheckCircle2 } from 'lucide-react'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await pb.collection('users').requestPasswordReset(email)
    } catch (_) {
      // Ignora erro por segurança
    } finally {
      setLoading(false)
      setSubmitted(true)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-slate-200">
        <CardHeader className="text-center space-y-3 pb-6">
          <div className="mx-auto bg-white px-5 py-3 rounded-2xl shadow-md border border-slate-200/80 flex items-center justify-center w-fit">
            <img
              src={logoGrupoVl}
              alt="Grupo VL"
              className="h-16 w-auto max-w-[150px] object-contain drop-shadow-xs"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">Recuperar Senha</CardTitle>
          <CardDescription className="text-sm text-slate-500">
            Enviaremos um link para você redefinir sua senha
          </CardDescription>
        </CardHeader>

        {submitted ? (
          <CardContent className="space-y-4 text-center py-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <p className="text-sm text-slate-700">
              Se o e-mail informado estiver cadastrado, você receberá instruções com o link para
              redefinição.
            </p>
            <div className="pt-2">
              <Link to="/login">
                <Button variant="outline" className="w-full">
                  Voltar para o Login
                </Button>
              </Link>
            </div>
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">E-mail cadastrado</label>
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
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
              </Button>
              <div className="text-center text-xs text-slate-500">
                Lembrou a senha?{' '}
                <Link to="/login" className="text-blue-600 font-semibold hover:underline">
                  Voltar ao login
                </Link>
              </div>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  )
}
