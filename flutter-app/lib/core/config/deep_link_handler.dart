import 'dart:async';
import 'package:app_links/app_links.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart' hide Session, User;
import 'package:gotrue/gotrue.dart' as gotrue;
import '../../shared/providers/auth_provider.dart' as app_auth;
import '../../features/auth/services/auth_service.dart';
import 'app_config.dart';
import 'supabase_config.dart';

class DeepLinkHandler {
  final AppLinks _appLinks = AppLinks();
  StreamSubscription<gotrue.AuthState>? _authStateSubscription;

  Future<void> initialize(WidgetRef ref) async {
    // Set up Supabase auth state listener (as per documentation)
    // This will automatically handle OAuth callbacks
    _authStateSubscription = SupabaseConfig.client.auth.onAuthStateChange.listen(
      (data) {
        final AuthChangeEvent event = data.event;
        final gotrue.Session? supabaseSession = data.session;
        
        debugPrint('Auth state changed: $event');
        
        if (event == AuthChangeEvent.signedIn && supabaseSession != null) {
          debugPrint('User signed in via OAuth, session available');
          // Handle signed in event
          _handleAuthStateChange(ref);
        } else if (event == AuthChangeEvent.signedOut) {
          debugPrint('User signed out');
          // Handle signed out event
          ref.read(app_auth.authProvider.notifier).logout();
        }
      },
    );

    // Handle initial link (if app was opened via deep link)
    final initialLink = await _appLinks.getInitialLink();
    if (initialLink != null) {
      _handleDeepLink(initialLink, ref);
    }

    // Listen for deep links while app is running
    _appLinks.uriLinkStream.listen(
      (uri) => _handleDeepLink(uri, ref),
      onError: (err) {
        debugPrint('Deep link error: $err');
      },
    );
  }

  Future<void> _handleAuthStateChange(WidgetRef ref) async {
    try {
      debugPrint('Handling auth state change, checking session...');
      final authService = ref.read(authServiceProvider);
      final appSession = await authService.checkSession();
      
      if (appSession != null) {
        debugPrint('Session found! User: ${appSession.user.email}');
        final authNotifier = ref.read(app_auth.authProvider.notifier);
        await authNotifier.setSession(appSession);
        debugPrint('Auth state updated with session');
      }
    } catch (e) {
      debugPrint('Error handling auth state change: $e');
    }
  }

  void dispose() {
    _authStateSubscription?.cancel();
  }

  Future<void> _handleDeepLink(Uri uri, WidgetRef ref) async {
    debugPrint('Deep link received: $uri');

    // OAuth callback: layerly://auth/callback
    // According to Supabase documentation, we should let onAuthStateChange handle the session
    // The deep link just triggers the callback, Supabase handles the rest
    final isOAuthCallback = uri.scheme == AppConfig.deepLinkScheme &&
        uri.host == 'auth' &&
        uri.path == '/callback';

    if (isOAuthCallback) {
      debugPrint('OAuth callback deep link received');
      // According to Supabase docs, onAuthStateChange will automatically fire
      // when Supabase processes the callback, so we just wait for that
      // The session will be handled by _handleAuthStateChange
      
      // Give Supabase a moment to process the callback
      await Future.delayed(const Duration(milliseconds: 500));
      
      // Check if session is already available
      final currentSession = SupabaseConfig.client.auth.currentSession;
      if (currentSession != null) {
        debugPrint('Session already available from Supabase');
        await _handleAuthStateChange(ref);
      } else {
        debugPrint('Waiting for Supabase to process callback...');
        // onAuthStateChange will handle it
      }
    }
  }
}

final deepLinkHandlerProvider = Provider<DeepLinkHandler>((ref) {
  return DeepLinkHandler();
});
