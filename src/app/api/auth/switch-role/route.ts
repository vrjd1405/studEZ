import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  // Role switching within an active session is strictly forbidden as per requirements.
  // Users must explicitly log out and log in with their assigned role credentials.
  return NextResponse.json(
    {
      error:
        'Direct role switching is disabled. To change roles, please log out and log in with the required account email (e.g. teacher@campus.edu for Teachers, student@campus.edu for Students, or admin@campus.edu for Admins).',
      requiresLogout: true,
    },
    { status: 403 }
  )
}
