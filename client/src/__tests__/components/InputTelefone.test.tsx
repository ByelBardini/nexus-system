import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { InputTelefone } from '@/components/InputTelefone'

describe('InputTelefone', () => {
  it('renderiza sem crash', () => {
    render(<InputTelefone value="" onChange={vi.fn()} />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('exibe placeholder padrão', () => {
    render(<InputTelefone value="" onChange={vi.fn()} />)
    expect(screen.getByPlaceholderText('(00) 00000-0000')).toBeInTheDocument()
  })

  it('exibe celular formatado', () => {
    render(<InputTelefone value="11999998888" onChange={vi.fn()} />)
    expect(screen.getByDisplayValue('(11) 99999-8888')).toBeInTheDocument()
  })

  it('exibe fixo formatado', () => {
    render(<InputTelefone value="1133334444" onChange={vi.fn()} />)
    expect(screen.getByDisplayValue('(11) 3333-4444')).toBeInTheDocument()
  })

  it('valor vazio exibe campo vazio', () => {
    render(<InputTelefone value="" onChange={vi.fn()} />)
    expect(screen.getByRole('textbox')).toHaveValue('')
  })

  it('chama onChange com apenas dígitos', async () => {
    const onChange = vi.fn()
    render(<InputTelefone value="" onChange={onChange} />)
    await userEvent.type(screen.getByRole('textbox'), '11')
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0] as string
    expect(/^\d+$/.test(lastCall)).toBe(true)
  })

  it('disabled desabilita o input', () => {
    render(<InputTelefone value="" onChange={vi.fn()} disabled />)
    expect(screen.getByRole('textbox')).toBeDisabled()
  })
})
