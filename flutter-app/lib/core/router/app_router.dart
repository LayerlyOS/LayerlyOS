import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../features/auth/screens/login_screen.dart';
import '../../features/auth/screens/two_factor_screen.dart';
import '../../features/dashboard/screens/home_screen.dart';
import '../../features/dashboard/screens/profile_screen.dart';
import '../../features/dashboard/screens/orders_tab.dart';
import '../../features/dashboard/screens/order_details_screen.dart';
import '../../features/dashboard/screens/prints_list_screen.dart';
import '../../features/dashboard/screens/print_details_screen.dart';
import '../../shared/providers/auth_provider.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final router = GoRouter(
    initialLocation: '/login',
    redirect: (context, state) {
      final authState = ref.read(authProvider);
      final hasSession = authState.hasSession;
      final isTwoFactorRequired = authState.twoFactorRequired;
      final isLoginRoute = state.matchedLocation == '/login';
      final isTwoFactorRoute = state.matchedLocation == '/two-factor';

      // Handle deep link callback route - redirect to login which handles session check
      if (state.uri.toString().contains('auth/callback')) {
        return '/login';
      }

      // If not authenticated and not on login, redirect to login
      if (!hasSession && !isLoginRoute && !isTwoFactorRoute) {
        return '/login';
      }

      // If authenticated but 2FA required and not on 2FA screen
      if (hasSession && isTwoFactorRequired && !isTwoFactorRoute) {
        return '/two-factor';
      }

      // If authenticated and 2FA done, but on login/2FA, redirect to dashboard
      if (hasSession && !isTwoFactorRequired) {
        if (isLoginRoute || isTwoFactorRoute) {
          return '/dashboard';
        }
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/two-factor',
        builder: (context, state) => const TwoFactorScreen(),
      ),
      GoRoute(
        path: '/dashboard',
        builder: (context, state) => const HomeScreen(),
      ),
      GoRoute(
        path: '/profile',
        builder: (context, state) => const ProfileScreen(),
      ),
      GoRoute(
        path: '/orders',
        builder: (context, state) => const OrdersTab(),
      ),
      GoRoute(
        path: '/orders/:id',
        builder: (context, state) {
          final orderId = state.pathParameters['id']!;
          return OrderDetailsScreen(orderId: orderId);
        },
      ),
      GoRoute(
        path: '/prints',
        builder: (context, state) => const PrintsListScreen(),
      ),
      GoRoute(
        path: '/prints/:id',
        builder: (context, state) {
          final printId = state.pathParameters['id']!;
          return PrintDetailsScreen(printId: printId);
        },
      ),
    ],
  );

  // Listen to auth state changes and redirect if needed
  ref.listen<AuthState>(authProvider, (previous, next) {
    if (previous?.isAuthenticated != next.isAuthenticated) {
      // Auth state changed - trigger redirect
      router.refresh();
    }
  });

  return router;
});
