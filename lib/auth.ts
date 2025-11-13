import { cookies } from 'next/headers';

export interface Session {
  userId: number;
  username: string;
}

/**
 * Get current session from cookies
 * For now, this is a simplified version for development
 * In production, this would validate JWT tokens
 * 
 * DEV MODE: Returns default user session if no cookie exists
 */
export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');
  
  if (!sessionCookie) {
    // DEV MODE: Auto-create session for testing CRUD operations
    if (process.env.NODE_ENV === 'development') {
      return {
        userId: 1,
        username: 'dev-user'
      };
    }
    return null;
  }

  try {
    // In a real implementation, this would validate and decode a JWT
    // For now, we'll parse a simple JSON structure
    const session = JSON.parse(sessionCookie.value);
    return session as Session;
  } catch (error) {
    return null;
  }
}

/**
 * Create a new session
 * For development purposes - in production this would create a JWT
 */
export async function createSession(userId: number, username: string): Promise<void> {
  const cookieStore = await cookies();
  const session: Session = { userId, username };
  
  cookieStore.set('session', JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

/**
 * Delete current session
 */
export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}
