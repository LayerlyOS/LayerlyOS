import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api/api_client.dart';
import '../../core/storage/cookie_jar_service.dart';
import '../../core/storage/secure_storage_service.dart';
import '../../features/auth/services/auth_service.dart';
import '../models/user.dart';
import '../models/session.dart';

class AuthState {
  final User? user;
  final bool isLoading;
  final String? error;
  final bool twoFactorRequired;

  const AuthState({
    this.user,
    this.isLoading = false,
    this.error,
    this.twoFactorRequired = false,
  });

  /// User is signed in (session exists), even if 2FA is still required.
  bool get hasSession => user != null;

  /// Fully authenticated user (2FA completed).
  bool get isAuthenticated => user != null && !twoFactorRequired;

  AuthState copyWith({
    User? user,
    bool? isLoading,
    String? error,
    bool? twoFactorRequired,
  }) {
    return AuthState(
      user: user ?? this.user,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      twoFactorRequired: twoFactorRequired ?? this.twoFactorRequired,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final SecureStorageService _storage = SecureStorageService();
  final Dio? _dio;
  final AuthService? _authService;

  AuthNotifier(this._dio, this._authService) : super(const AuthState()) {
    _loadSession();
  }

  Future<void> _loadSession() async {
    state = state.copyWith(isLoading: true);
    try {
      // Use Supabase to check session
      if (_authService != null) {
        final session = await _authService.checkSession();
        if (session != null) {
          await setSession(session);
          return;
        }
      }
      // No session found - user is not logged in
    } catch (e) {
      // Token invalid or expired
      await _storage.clearAll();
      await CookieJarService.clear();
    } finally {
      state = state.copyWith(isLoading: false);
    }
  }

  Future<void> setSession(Session session) async {
    if (session.session?.token != null) {
      await _storage.saveToken(session.session!.token);
    }
    state = state.copyWith(
      user: session.user,
      twoFactorRequired: session.twoFactorRequired,
    );
  }

  Future<void> setTwoFactorRequired(bool required) async {
    state = state.copyWith(twoFactorRequired: required);
  }

  Future<void> logout() async {
    await _storage.clearAll();
    await CookieJarService.clear();
    state = const AuthState();
  }

  void clearError() {
    state = state.copyWith(error: null);
  }

  Future<void> refreshUser() async {
    if (_dio == null || state.user == null) return;

    try {
      final response = await _dio.get('/user/me');
      if (response.statusCode == 200) {
        final userData = response.data;
        if (userData is Map<String, dynamic>) {
          // Preserve existing user data (emailVerified, subscriptionTier, role) if not in response
          final currentUser = state.user!;
          final updatedUser = User.fromJson({
            ...userData,
            // Preserve fields that might not be in response
            'emailVerified': userData['emailVerified'] ?? currentUser.emailVerified,
            'subscriptionTier': userData['subscriptionTier'] ?? currentUser.subscriptionTier,
            'role': userData['role'] ?? currentUser.role,
          });
          state = state.copyWith(user: updatedUser);
        }
      }
    } catch (e) {
      // Silently fail - user data might be stale but that's okay
    }
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final dio = ref.watch(apiClientProvider);
  final authService = ref.watch(authServiceProvider);
  return AuthNotifier(dio, authService);
});
