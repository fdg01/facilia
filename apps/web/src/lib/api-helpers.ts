// lib/api-helpers.ts
import { NextResponse } from 'next/server'

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof Error) {
    if (error.message.includes('NO_SESSION')) {
      return NextResponse.json(
        { error: { code: 'NO_SESSION', message: 'No autenticado' } },
        { status: 401 },
      )
    }
    if (error.message.includes('FORBIDDEN')) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'No tiene permisos' } },
        { status: 403 },
      )
    }
    if (error.message === 'CHECKLIST_INCOMPLETE') {
      return NextResponse.json(
        { error: { code: 'CHECKLIST_INCOMPLETE', message: 'Hay ítems obligatorios sin marcar' } },
        { status: 400 },
      )
    }
    if (error.message === 'INVALID_CONTENT_TYPE') {
      return NextResponse.json(
        { error: { code: 'INVALID_CONTENT_TYPE', message: 'Tipo de contenido no permitido' } },
        { status: 400 },
      )
    }
    if (error.message.includes('not found') || error.message.includes('not found')) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: error.message } },
        { status: 404 },
      )
    }
  }
  console.error('API error:', error)
  return NextResponse.json(
    { error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } },
    { status: 500 },
  )
}
