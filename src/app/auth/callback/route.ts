import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;

  if (code) {
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );

    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('Erro ao trocar código por sessão:', error);
        return NextResponse.redirect(`${origin}/?error=auth_failed`);
      }

      // Verificar se usuário tem perfil
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profile } = await supabase
          .from('user_profile')
          .select('id')
          .eq('id', user.id)
          .maybeSingle();
        
        if (!profile) {
          return NextResponse.redirect(`${origin}/quiz`);
        }
        
        return NextResponse.redirect(`${origin}/dashboard`);
      }
    } catch (error) {
      console.error('Erro no callback:', error);
      return NextResponse.redirect(`${origin}/?error=callback_error`);
    }
  }

  return NextResponse.redirect(`${origin}/?error=no_code`);
}
