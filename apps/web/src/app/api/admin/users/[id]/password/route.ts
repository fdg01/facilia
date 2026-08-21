// src/app/api/admin/users/[id]/password/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  SupabaseUserRepository,
  SupabaseAuthRepository,
  createServiceRoleSupabaseClient,
} from '@modules/identity/infrastructure'
import { createAdminChangePasswordUseCase } from '@modules/identity/application/use-cases'
import { IdentityError } from '@modules/identity/application/errors'
import { requireRole, sessionToUser } from '@/lib/session'

const Schema = z.object({
  newPassword: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireRole('admin')
    const { id } = await params

    const body = await request.json()
    const parsed = Schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Contraseña inválida' } },
        { status: 400 },
      )
    }

    const serviceClient = createServiceRoleSupabaseClient()
    const userRepo = new SupabaseUserRepository(serviceClient)
    const authRepo = new SupabaseAuthRepository(serviceClient)

    const changePassword = createAdminChangePasswordUseCase(userRepo, authRepo)
    await changePassword({
      requester: sessionToUser(session),
      targetUserId: id,
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
    console.error('Admin change password error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } },
      { status: 500 },
    )
  }
}
