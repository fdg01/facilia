// src/app/api/auth/change-password/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  SupabaseUserRepository,
  SupabaseAuthRepository,
  createServiceRoleSupabaseClient,
} from '@modules/identity/infrastructure'
import { createChangeOwnPasswordUseCase } from '@modules/identity/application/use-cases'
import { IdentityError } from '@modules/identity/application/errors'
import { requireSession } from '@/lib/session'

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
})

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession()

    const body = await request.json()
    const parsed = ChangePasswordSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Datos inválidos', details: parsed.error.issues } },
        { status: 400 },
      )
    }

    const serviceClient = createServiceRoleSupabaseClient()
    const userRepo = new SupabaseUserRepository(serviceClient)
    const authRepo = new SupabaseAuthRepository(serviceClient)

    const changePassword = createChangeOwnPasswordUseCase(userRepo, authRepo)
    await changePassword({
      authId: session.authId,
      currentPassword: parsed.data.currentPassword,
      newPassword: parsed.data.newPassword,
    })

    return NextResponse.json({ data: { success: true } }, { status: 200 })
  } catch (error) {
    if (error instanceof IdentityError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.statusCode },
      )
    }
    console.error('Change password error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } },
      { status: 500 },
    )
  }
}
