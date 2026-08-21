// src/app/api/session/route.ts
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { IdentityError } from '@modules/identity/application/errors'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { error: { code: 'NO_SESSION', message: 'No hay sesión activa' } },
        { status: 401 },
      )
    }

    return NextResponse.json(
      {
        data: {
          userId: session.userId,
          email: session.email,
          firstName: session.firstName,
          lastName: session.lastName,
          role: session.role,
          organizationId: session.organizationId,
          status: session.status,
          mustChangePassword: session.mustChangePassword,
        },
      },
      { status: 200 },
    )
  } catch (error) {
    if (error instanceof IdentityError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.statusCode },
      )
    }
    console.error('Get session error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } },
      { status: 500 },
    )
  }
}
