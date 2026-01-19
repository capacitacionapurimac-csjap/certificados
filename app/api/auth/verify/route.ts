import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json(
        { authenticated: false, error: 'No token found' },
        { status: 401 }
      )
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret-key')

    return NextResponse.json({
      authenticated: true,
      user: decoded
    })
  } catch (error) {
    return NextResponse.json(
      { authenticated: false, error: 'Invalid token' },
      { status: 401 }
    )
  }
}