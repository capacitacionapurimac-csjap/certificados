import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({
    message: 'Sesión cerrada exitosamente'
  })

  response.cookies.delete('token')

  return response
}