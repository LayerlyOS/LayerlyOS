import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Fast path for static files and API routes
  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api') || 
    /\.[^/]+$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  // 2. Update Session & Get User/Client
  // This handles cookie refreshing and auth verification
  const { response, supabase, user } = await updateSession(request);

  // 3. Maintenance Check
  const isComingSoonPage = pathname === '/coming-soon';
  const isLoginPage = pathname === '/login';
  
  try {
    // Check global settings via Supabase (not direct DB)
    const { data: setting } = await supabase
      .from('global_settings')
      .select('value')
      .eq('key', 'maintenance_mode')
      .single();
      
    // Cast value to expected type
    const maintenanceEnabled = (setting?.value as { enabled: boolean })?.enabled || false;

    if (maintenanceEnabled) {
      let isAdmin = false;
      if (user) {
        // Check if user is admin via Supabase
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('is_admin, role')
          .eq('id', user.id)
          .single();
          
        isAdmin = !!(profile?.is_admin || profile?.role === 'ADMIN');
      }

      // If not admin, block access to everything except coming soon and login
      if (!isAdmin && !isComingSoonPage && !isLoginPage) {
        const url = request.nextUrl.clone();
        url.pathname = '/coming-soon';
        return NextResponse.redirect(url);
      }
    } else {
       // If maintenance is OFF, redirect away from coming-soon
       if (isComingSoonPage) {
        const url = request.nextUrl.clone();
        url.pathname = '/';
        return NextResponse.redirect(url);
       }
    }
  } catch (e) {
    // Ignore error - fail open
  }

  // 4. Protected Routes
  const isProtectedPath = pathname.startsWith('/dashboard') || pathname.startsWith('/admin');
  
  if (isProtectedPath && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // 5. Locale cleanup (optional)
  if (pathname.startsWith('/pl/') || pathname === '/pl' || pathname.startsWith('/en/') || pathname === '/en') {
     const url = request.nextUrl.clone();
     const newPath = pathname.replace(/^\/(pl|en)/, '') || '/';
     url.pathname = newPath;
     return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|opengraph-image|robots.txt|sitemap.xml|icon|apple-icon|.*\\..*).*)'],
};
