// src/app/api/admin/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  SupabaseUserRepository,
  createServiceRoleSupabaseClient,
} from '@modules/identity/infrastructure'
import { createEditUserUseCase } from '@modules/identity/application/use-cases'
import { IdentityError } from '@modules/identity/application/errors'
import { requireRole, sessionToUser } from '@/lib/session'

const EditUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  role: z.enum(['admin', 'employee', 'client']).optional(),
  organizationId: z.string().uuid().nullable().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireRole('admin')
    const { id } = await params

    const body = await request.json()
    const parsed = EditUserSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Datos inválidos', details: parsed.error.issues } },
        { status: 400 },
      )
    }

    const serviceClient = createServiceRoleSupabaseClient()
    const userRepo = new SupabaseUserRepository(serviceClient)

    const editUser = createEditUserUseCase(userRepo)
    const updated = await editUser({
      requester: sessionToUser(session),
      targetUserId: id,
      updates: parsed.data,
    })

    return NextResponse.json({ data: updated }, { status: 200 })
  } catch (error) {
    if (error instanceof IdentityError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.statusCode },
      )
    }
    console.error('Edit user error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } },
      { status: 500 },
    )
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole('admin')
    const { id } = await params

    const serviceClient = createServiceRoleSupabaseClient()
    const userRepo = new SupabaseUserRepository(serviceClient)
    const user = await userRepo.findById(id)

    if (!user) {
      return NextResponse.json(
        { error: { code: 'USER_NOT_FOUND', message: 'Usuario no encontrado' } },
        { status: 404 },
      )
    }

    return NextResponse.json({ data: user }, { status: 200 })
  } catch (error) {
    if (error instanceof IdentityError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.statusCode },
      )
    }
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } },
      { status: 500 },
    )
  }
}
