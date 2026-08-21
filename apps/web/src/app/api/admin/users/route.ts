// src/app/api/admin/users/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  SupabaseUserRepository,
  SupabaseAuthRepository,
  SupabaseOrganizationRepository,
  createServiceRoleSupabaseClient,
} from '@modules/identity/infrastructure'
import {
  createListUsersUseCase,
  createCreateUserUseCase,
} from '@modules/identity/application/use-cases'
import { IdentityError } from '@modules/identity/application/errors'
import { requireRole, sessionToUser } from '@/lib/session'

const CreateUserSchema = z.object({
  email: z.email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['admin', 'employee', 'client']),
  organizationId: z.string().uuid().optional(),
  phone: z.string().optional(),
  temporaryPassword: z.string().min(8),
})

export async function GET(request: NextRequest) {
  try {
    const session = await requireRole('admin')

    const url = new URL(request.url)
    const role = url.searchParams.get('role')
    const status = url.searchParams.get('status')
    const filters = {
      role: role as 'admin' | 'employee' | 'client' | undefined ?? undefined,
      status: status as 'active' | 'inactive' | undefined ?? undefined,
      organizationId: url.searchParams.get('organizationId') ?? undefined,
      page: parseInt(url.searchParams.get('page') ?? '1'),
      pageSize: parseInt(url.searchParams.get('pageSize') ?? '20'),
    }

    const serviceClient = createServiceRoleSupabaseClient()
    const userRepo = new SupabaseUserRepository(serviceClient)

    const listUsers = createListUsersUseCase(userRepo)
    const result = await listUsers({ requester: sessionToUser(session), filters })

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    if (error instanceof IdentityError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.statusCode },
      )
    }
    console.error('List users error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole('admin')

    const body = await request.json()
    const parsed = CreateUserSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Datos inválidos', details: parsed.error.issues } },
        { status: 400 },
      )
    }

    const serviceClient = createServiceRoleSupabaseClient()
    const userRepo = new SupabaseUserRepository(serviceClient)
    const authRepo = new SupabaseAuthRepository(serviceClient)
    const orgRepo = new SupabaseOrganizationRepository(serviceClient)

    const createUser = createCreateUserUseCase(userRepo, authRepo, orgRepo)
    const user = await createUser({
      requester: sessionToUser(session),
      ...parsed.data,
    })

    return NextResponse.json({ data: user }, { status: 201 })
  } catch (error) {
    if (error instanceof IdentityError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.statusCode },
      )
    }
    console.error('Create user error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } },
      { status: 500 },
    )
  }
}
