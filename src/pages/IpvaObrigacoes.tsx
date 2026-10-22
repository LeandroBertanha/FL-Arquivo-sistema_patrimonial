import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function IpvaObrigacoes() {
  const navigate = useNavigate()

  useEffect(() => {
    navigate('/veiculos?aba=ipva', { replace: true })
  }, [navigate])

  return (
    <div className="flex items-center justify-center py-20 text-xs text-slate-500">
      Redirecionando para a aba IPVA e Obrigações na tela de Veículos...
    </div>
  )
}
