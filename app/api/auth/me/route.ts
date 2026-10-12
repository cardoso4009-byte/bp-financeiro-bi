import {
  authorizationErrorResponse,
  getCurrentIdentity,
} from '@/lib/authorization'

export async function GET(request: Request) {
  try {
    const identity = await getCurrentIdentity(request)

    return Response.json({
      ok: true,
      user: {
        id: identity.userId,
        email: identity.email,
        name: identity.name,
      },
      company: {
        id: identity.companyId,
        name: identity.companyName,
      },
      role: identity.roleKey,
      permissions: identity.permissions,
    })
  } catch (error) {
    return authorizationErrorResponse(error)
  }
}
