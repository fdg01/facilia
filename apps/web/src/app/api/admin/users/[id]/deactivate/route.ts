// src/app/api/admin/users/[id]/deactivate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import {
  SupabaseUserRepository,
  createServiceRoleSupabaseClient,
} from '@modules/identity/infrastructure'
import { createDeactivateUserUseCase } from '@modules/identity/application/use-cases'
import { IdentityError } from '@modules/identity/application/errors'
import { requireRole, sessionToUser } from '@/lib/session'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireRole('admin')
    const { id } = await params

    const serviceClient = createServiceRoleSupabaseClient()
    const userRepo = new SupabaseUserRepository(serviceClient)

    const deactivate = createDeactivateUserUseCase(userRepo)
    const user = await deactivate({ requester: sessionToUser(session), targetUserId: id })

    return NextResponse.json({ data: user }, { status: 200 })
  } catch (error) {
    if (error instanceof IdentityError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.statusCode },
      )
    }
    console.error('Deactivate user error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } },
      { status: 500 },
    )
  }
}
