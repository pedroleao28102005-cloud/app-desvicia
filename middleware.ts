import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          res.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          res.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  // Rotas públicas que não precisam de autenticação
  const publicPaths = ['/', '/auth/callback'];
  const isPublicPath = publicPaths.includes(req.nextUrl.pathname);

  // Se não tem sessão e tenta acessar rota protegida -> login
  if (!session && !isPublicPath) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // Se tem sessão e está na página de login -> redirecionar baseado no perfil
  if (session && req.nextUrl.pathname === '/') {
    try {
      const { data: profile } = await supabase
        .from('user_profile')
        .select('id')
        .eq('id', session.user.id)
        .maybeSingle();
      
      if (profile) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      } else {
        return NextResponse.redirect(new URL('/quiz', req.url));
      }
    } catch (error) {
      console.error('Erro ao verificar perfil:', error);
    }
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\..*).*)'],
};
