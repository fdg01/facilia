// src/app/api/admin/organizations/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  SupabaseOrganizationRepository,
  createServiceRoleSupabaseClient,
} from '@modules/identity/infrastructure'
import {
  createListOrganizationsUseCase,
  createCreateOrganizationUseCase,
} from '@modules/identity/application/use-cases'
import { requireRole } from '@/lib/session'
import { IdentityError } from '@modules/identity/application/errors'

const CreateOrgSchema = z.object({
  name: z.string().min(1),
  taxId: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
})

export async function GET() {
  try {
    await requireRole('admin')
    const serviceClient = createServiceRoleSupabaseClient()
    const orgRepo = new SupabaseOrganizationRepository(serviceClient)
    const listOrganizations = createListOrganizationsUseCase(orgRepo)
    const orgs = await listOrganizations()
    return NextResponse.json({ data: orgs }, { status: 200 })
  } catch (error) {
    if (error instanceof IdentityError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.statusCode },
      )
    }
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Error interno' } },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole('admin')

    const body = await request.json()
    const parsed = CreateOrgSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Datos inválidos' } },
        { status: 400 },
      )
    }

    const serviceClient = createServiceRoleSupabaseClient()
    const orgRepo = new SupabaseOrganizationRepository(serviceClient)
    const createOrganization = createCreateOrganizationUseCase(orgRepo)
    const org = await createOrganization(parsed.data)

    return NextResponse.json({ data: org }, { status: 201 })
  } catch (error) {
    if (error instanceof IdentityError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.statusCode },
      )
    }
    console.error('Create org error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Error interno' } },
      { status: 500 },
    )
  }
}
