import React, { useState, useEffect } from 'react'
import {
  Settings as SettingsIcon,
  User,
  Users,
  Shield,
  Key,
  CheckCircle2,
  Lock,
  Mail,
  UserPlus,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/contexts/AuthContext'
import { logAudit } from '@/services/api'
import type { User as UserType, Role } from '@/types'
import { toast } from 'sonner'

export default function Configuracoes() {
  const { user, role, isAdmin } = useAuth()
  const [usersList, setUsersList] = useState<UserType[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  // Perfil próprio
  const [name, setName] = useState(user?.name || '')
  const [savingProfile, setSavingProfile] = useState(false)

  // Senha própria
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  // Modal Novo Usuário (Admin)
  const [newUserModalOpen, setNewUserModalOpen] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [newName, setNewName] = useState('')
  const [newRole, setNewRole] = useState<Role>('Consulta')
  const [newPasswordValue, setNewPasswordValue] = useState('')
  const [creatingUser, setCreatingUser] = useState(false)

  useEffect(() => {
    if (user?.name) setName(user.name)
    if (isAdmin) {
      loadUsers()
    }
  }, [user, isAdmin])

  const loadUsers = async () => {
    setLoadingUsers(true)
    try {
      const res = await pb.collection('users').getList<UserType>(1, 100, {
        sort: '-created',
      })
      setUsersList(res.items || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSavingProfile(true)
    try {
      await pb.collection('users').update(user.id, { name })
      await logAudit(
        'ATUALIZACAO_PERFIL',
        'users',
        user.id,
        `Usuário ${user.email} atualizou nome para "${name}"`,
      )
      toast.success('Perfil atualizado com sucesso!')
    } catch (err) {
      console.error(err)
      toast.error('Erro ao atualizar perfil.')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem.')
      return
    }
    if (newPassword.length < 8) {
      toast.error('A senha deve ter no mínimo 8 caracteres.')
      return
    }

    setChangingPassword(true)
    try {
      await pb.collection('users').update(user.id, {
        oldPassword,
        password: newPassword,
        passwordConfirm: confirmPassword,
      })
      await logAudit('ALTERACAO_SENHA', 'users', user.id, `Usuário ${user.email} alterou sua senha`)
      toast.success('Senha alterada com sucesso!')
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      console.error(err)
      toast.error(err?.message || 'Erro ao alterar senha. Verifique a senha atual.')
    } finally {
      setChangingPassword(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAdmin) return
    setCreatingUser(true)
    try {
      const created = await pb.collection('users').create({
        email: newEmail,
        name: newName,
        role: newRole,
        password: newPasswordValue,
        passwordConfirm: newPasswordValue,
        emailVisibility: true,
      })

      await logAudit(
        'CRIACAO_USUARIO',
        'users',
        created.id,
        `Administrador criou usuário ${newEmail} com perfil ${newRole}`,
      )

      toast.success('Usuário criado com sucesso!')
      setNewUserModalOpen(false)
      setNewEmail('')
      setNewName('')
      setNewPasswordValue('')
      loadUsers()
    } catch (err: any) {
      console.error(err)
      toast.error(err?.message || 'Erro ao cadastrar usuário.')
    } finally {
      setCreatingUser(false)
    }
  }

  const handleUpdateUserRole = async (targetUserId: string, newRoleValue: Role) => {
    if (!isAdmin) return
    try {
      await pb.collection('users').update(targetUserId, { role: newRoleValue })
      await logAudit(
        'ALTERACAO_PERFIL_ACESSO',
        'users',
        targetUserId,
        `Perfil alterado para ${newRoleValue} pelo administrador`,
      )
      toast.success('Perfil atualizado com sucesso!')
      loadUsers()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao atualizar permissão do usuário.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-slate-700" />
            Configurações do Sistema & Acessos
          </h1>
          <p className="text-sm text-slate-500">
            Gerenciamento do perfil de usuário, credenciais de acesso e controle de perfis de
            segurança
          </p>
        </div>
      </div>

      <Tabs defaultValue="perfil" className="w-full">
        <TabsList className="bg-white border border-slate-200 p-1 rounded-xl shadow-xs">
          <TabsTrigger value="perfil" className="text-xs font-semibold">
            Meu Perfil & Segurança
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="usuarios" className="text-xs font-semibold">
              Gestão de Usuários ({usersList.length})
            </TabsTrigger>
          )}
          <TabsTrigger value="sistema" className="text-xs font-semibold">
            Parâmetros do Arquivo
          </TabsTrigger>
        </TabsList>

        {/* ===== Aba Meu Perfil ===== */}
        <TabsContent value="perfil" className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="shadow-xs border-slate-200">
            <CardHeader className="p-4 pb-2 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" /> Dados Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <form onSubmit={handleUpdateProfile} className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Nome Completo</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="text-xs h-9"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">E-mail</label>
                  <Input value={user?.email || ''} disabled className="text-xs h-9 bg-slate-50" />
                  <span className="text-[11px] text-slate-400">
                    O e-mail é a chave de login e não pode ser alterado diretamente.
                  </span>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Perfil de Acesso Atual</label>
                  <div>
                    <Badge className="bg-slate-900 text-white text-[11px]">
                      {role || 'Consulta'}
                    </Badge>
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={savingProfile}
                  className="bg-blue-600 hover:bg-blue-700 text-xs"
                >
                  {savingProfile ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="shadow-xs border-slate-200">
            <CardHeader className="p-4 pb-2 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-600" /> Alterar Minha Senha
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Senha Atual *</label>
                  <Input
                    type="password"
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="text-xs h-9"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Nova Senha * (mínimo 8)</label>
                  <Input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="text-xs h-9"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Confirmar Nova Senha *</label>
                  <Input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="text-xs h-9"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={changingPassword}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs"
                >
                  {changingPassword ? 'Alterando...' : 'Atualizar Senha'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== Aba Gestão de Usuários (Apenas Admin) ===== */}
        {isAdmin && (
          <TabsContent value="usuarios" className="pt-2 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Usuários do FL Arquivos</h3>
                <p className="text-xs text-slate-500">
                  Defina os níveis de permissão: Gestor do Arquivo, Operador, Consulta ou Auditor
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => setNewUserModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-xs font-semibold"
              >
                <UserPlus className="w-4 h-4 mr-1.5" /> Adicionar Usuário
              </Button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                  <tr>
                    <th className="py-3 px-4">Nome</th>
                    <th className="py-3 px-4">E-mail</th>
                    <th className="py-3 px-4">Perfil de Acesso</th>
                    <th className="py-3 px-4">Data Cadastro</th>
                    <th className="py-3 px-4 text-right">Alterar Perfil</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {u.name || 'Sem nome'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono">{u.email}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            u.role === 'Gestor do Arquivo'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : u.role === 'Auditor'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : u.role === 'Operador'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-slate-50 text-slate-700'
                          }`}
                        >
                          {u.role || 'Consulta'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {new Date(u.created).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <select
                          className="h-7 text-xs border border-slate-200 rounded px-2 bg-white"
                          value={u.role || 'Consulta'}
                          onChange={(e) => handleUpdateUserRole(u.id, e.target.value as Role)}
                          disabled={u.id === user?.id}
                        >
                          <option value="Gestor do Arquivo">Gestor do Arquivo (Admin)</option>
                          <option value="Operador">Operador</option>
                          <option value="Consulta">Consulta</option>
                          <option value="Auditor">Auditor</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        )}

        {/* ===== Aba Parâmetros do Sistema ===== */}
        <TabsContent value="sistema" className="pt-2">
          <Card className="shadow-xs border-slate-200">
            <CardHeader className="p-4 pb-2 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900">
                Parâmetros e Regras de Negócio do Acervo
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs text-slate-600">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-800">Hierarquia Física Padrão:</span>
                <p className="text-slate-600 mt-1">
                  Empresa/Grupo → Unidade → Sala → Armário/Estante → Gaveta/Prateleira → Caixa →
                  Posição → Pasta → Documento.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-800">Preservação de Notação Excel:</span>
                <p className="text-slate-600 mt-1">
                  Códigos legados não sofrem normalização destrutiva (N1, N01, N2, N7/01 permanecem
                  idênticos aos registros físicos).
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-800">Controle de Perfis e Permissões:</span>
                <ul className="list-disc pl-4 mt-1 space-y-1 text-slate-600">
                  <li>
                    <strong>Gestor do Arquivo:</strong> Acesso irrestrito a todas as funções e
                    usuários.
                  </li>
                  <li>
                    <strong>Operador:</strong> Inclusão, movimentação física e conferência de
                    inventário.
                  </li>
                  <li>
                    <strong>Consulta:</strong> Leitura estrita, sem permissão para cadastrar, editar
                    ou excluir.
                  </li>
                  <li>
                    <strong>Auditor:</strong> Visualização e exportação de logs e conferência de
                    trilha de auditoria.
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal Novo Usuário */}
      <Dialog open={newUserModalOpen} onOpenChange={setNewUserModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base text-slate-900">
              Adicionar Usuário ao Sistema
            </DialogTitle>
            <DialogDescription className="text-xs">
              Cadastre um novo operador com perfil de acesso apropriado.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Nome Completo *</label>
              <Input
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: Carlos Silva"
                className="text-xs h-9"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">E-mail *</label>
              <Input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="carlos@grupo.com.br"
                className="text-xs h-9"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Senha Inicial * (mínimo 8)</label>
              <Input
                type="password"
                required
                minLength={8}
                value={newPasswordValue}
                onChange={(e) => setNewPasswordValue(e.target.value)}
                placeholder="••••••••"
                className="text-xs h-9"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Perfil de Acesso</label>
              <select
                className="w-full h-9 border border-slate-200 rounded-md px-3 bg-white text-xs"
                value={newRole}
                onChange={(e: any) => setNewRole(e.target.value)}
              >
                <option value="Consulta">Consulta (Apenas visualização)</option>
                <option value="Operador">Operador (Movimentações e inventário)</option>
                <option value="Auditor">Auditor (Conferência e relatórios)</option>
                <option value="Gestor do Arquivo">Gestor do Arquivo (Administrador Total)</option>
              </select>
            </div>
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setNewUserModalOpen(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={creatingUser}
                className="bg-blue-600 hover:bg-blue-700 text-xs"
              >
                {creatingUser ? 'Criando...' : 'Cadastrar Usuário'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
