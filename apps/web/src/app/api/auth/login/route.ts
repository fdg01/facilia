// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  SupabaseUserRepository,
  SupabaseAuthRepository,
  createServiceRoleSupabaseClient,
} from '@modules/identity/infrastructure'
import { createLoginUseCase } from '@modules/identity/application/use-cases'
import { IdentityError } from '@modules/identity/application/errors'

const LoginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = LoginSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Email y contraseña son requeridos' } },
        { status: 400 },
      )
    }

    const serviceClient = createServiceRoleSupabaseClient()
    const userRepo = new SupabaseUserRepository(serviceClient)
    const authRepo = new SupabaseAuthRepository(serviceClient)

    const login = createLoginUseCase(userRepo, authRepo)
    const result = await login(parsed.data)

    return NextResponse.json({ data: result }, { status: 200 })
  } catch (error) {
    if (error instanceof IdentityError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.statusCode },
      )
    }
    console.error('Login error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } },
      { status: 500 },
    )
  }
}
