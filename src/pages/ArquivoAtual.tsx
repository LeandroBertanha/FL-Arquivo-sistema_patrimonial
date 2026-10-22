import React from 'react'
import ArchiveView from '@/components/ArchiveView'

export default function ArquivoAtual() {
  return (
    <ArchiveView
      archiveType="Atual"
      title="Arquivo Atual (Uso Corrente)"
      description="Pastas físicas em atividade contábil, societária, pessoal e imobiliária (Guia ARQUIVO ATUAL)"
    />
  )
}
