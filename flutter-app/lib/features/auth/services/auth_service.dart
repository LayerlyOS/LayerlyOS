import 'package:flutter/foundation.dart'; // Add this import
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart' hide Session, User;
import 'package:supabase_flutter/supabase_flutter.dart' as sb;
import '../../../core/api/api_client.dart';
import '../../../core/config/supabase_config.dart';
import '../../../core/storage/secure_storage_service.dart';
import '../../../shared/models/session.dart';
import '../../../shared/models/user.dart';

class AuthService {
  final Dio _dio;
  final _supabase = SupabaseConfig.client;

  AuthService(this._dio);

  Future<void> startOAuth({
    required sb.OAuthProvider provider,
    required BuildContext context,
    bool isRetry = false,
  }) async {
    try {
      const deepLinkRedirect = 'layerly://auth/callback';
      
      // Use external browser in debug mode (Simulator) to ensure reliable redirect,
      // but use platform default (in-app modal) in release for better UX/Apple compliance.
      final launchMode = kDebugMode 
          ? sb.LaunchMode.externalApplication 
          : sb.LaunchMode.platformDefault;

      await _supabase.auth.signInWithOAuth(
        provider,
        redirectTo: deepLinkRedirect,
        authScreenLaunchMode: launchMode,
      );
    } catch (e) {
      debugPrint('OAuth start error: $e');
      rethrow;
    }
  }

  // Sign in with email and password
  Future<Session> signIn({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _supabase.auth.signInWithPassword(
        email: email,
        password: password,
      );

      if (response.user == null) {
        throw Exception('Invalid email or password');
      }

      // Check MFA status
      final mfaResponse = await _supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      // Using string comparison as AuthenticatorAssuranceLevel enum might not be exported directly
      final bool isMfaRequired = mfaResponse.nextLevel == 'aal2' && 
                                mfaResponse.currentLevel == 'aal1';

      User user = await _getUserWithFallback(response.user!);

      return Session(
        user: user,
        session: response.session != null
            ? SessionToken(
                token: response.session!.accessToken,
                expiresAt: response.session!.expiresAt != null
                    ? DateTime.fromMillisecondsSinceEpoch(response.session!.expiresAt! * 1000)
                    : DateTime.now().add(const Duration(days: 7)),
              )
            : null,
        twoFactorRequired: isMfaRequired,
      );
    } catch (e) {
      debugPrint('Sign-in error: $e');
      if (e is sb.AuthException) {
         if (e.message.contains('Invalid login credentials')) {
            throw Exception('Invalid email or password');
         }
         throw Exception(e.message);
      }
      throw Exception('Sign in failed: ${e.toString()}');
    }
  }

  // Sign up with email, password, and name
  Future<Session> signUp({
    required String email,
    required String password,
    required String name,
  }) async {
    try {
      final response = await _supabase.auth.signUp(
        email: email,
        password: password,
        data: {
          'name': name,
          'full_name': name,
        },
      );

      if (response.user == null) {
         if (response.session == null) {
           throw Exception('Please check your email to confirm your account.');
         }
         throw Exception('Sign up failed');
      }

      User user = await _getUserWithFallback(response.user!);

      return Session(
        user: user,
        session: response.session != null
            ? SessionToken(
                token: response.session!.accessToken,
                expiresAt: response.session!.expiresAt != null
                    ? DateTime.fromMillisecondsSinceEpoch(response.session!.expiresAt! * 1000)
                    : DateTime.now().add(const Duration(days: 7)),
              )
            : null,
        twoFactorRequired: false,
      );
    } catch (e) {
      debugPrint('Sign-up error: $e');
      if (e is sb.AuthException) {
        throw Exception(e.message);
      }
      if (e.toString().contains('already registered')) {
        throw Exception('This email already exists');
      }
      throw Exception('Sign up failed: ${e.toString()}');
    }
  }

  // Sign out
  Future<void> signOut() async {
    try {
      await _supabase.auth.signOut();
    } catch (e) {
      debugPrint('Sign out error (ignored): $e');
    } finally {
      await SecureStorageService().clearAll();
      debugPrint('Local storage cleared');
    }
  }

  // Verify TOTP code
  Future<Session> verifyTotp({
    required String code,
    required bool trustDevice,
  }) async {
    try {
      // Supabase Dart SDK returns AuthMFAListFactorsResponse which contains 'all' property
      final factorsResponse = await _supabase.auth.mfa.listFactors();
      final totpFactor = factorsResponse.all.firstWhere(
        (f) => f.factorType == sb.FactorType.totp && f.status == sb.FactorStatus.verified,
        orElse: () => throw Exception('No verified TOTP factor found'),
      );

      final challenge = await _supabase.auth.mfa.challenge(factorId: totpFactor.id);

      // Verify returns AuthMFAVerifyResponse which might not contain session directly in older/newer versions
      // but usually updates the current session in the client.
      // We will re-fetch the session after verification.
      await _supabase.auth.mfa.verify(
        factorId: totpFactor.id,
        challengeId: challenge.id,
        code: code,
      );
      
      // After verification, the session should be upgraded to AAL2.
      // We need to get the updated session.
      final session = _supabase.auth.currentSession;
      if (session == null) {
        throw Exception('Verification failed: No session active');
      }
      
      User user = await _getUserWithFallback(session.user);

      return Session(
        user: user,
        session: SessionToken(
          token: session.accessToken,
          expiresAt: session.expiresAt != null
              ? DateTime.fromMillisecondsSinceEpoch(session.expiresAt! * 1000)
              : DateTime.now().add(const Duration(days: 7)),
        ),
        twoFactorRequired: false,
      );
    } catch (e) {
      debugPrint('TOTP Verification error: $e');
      if (e is sb.AuthException) {
        throw Exception(e.message);
      }
      throw Exception('Verification failed');
    }
  }

  // Verify backup code
  Future<Session> verifyBackupCode({
    required String code,
    required bool trustDevice,
  }) async {
     throw UnimplementedError('Backup code verification is not supported yet.');
  }

  // Get current user (with fallback)
  Future<User> getCurrentUser() async {
    final user = _supabase.auth.currentUser;
    if (user != null) {
       return _getUserWithFallback(user);
    }
    throw Exception('No user logged in');
  }

  Future<User> _getUserWithFallback(sb.User supabaseUser) async {
    try {
      // Try to get user profile from API
      final response = await _dio.get('/user/me');
      final data = response.data;
      if (data is Map<String, dynamic>) {
        return User.fromJson(data);
      }
    } catch (e) {
      // debugPrint('Failed to get user from API, using Supabase data: $e');
    }

    // Fallback: create User from Supabase user data
    return User(
      id: supabaseUser.id,
      email: supabaseUser.email ?? '',
      name: supabaseUser.userMetadata?['name'] ?? supabaseUser.userMetadata?['full_name'] ?? '',
      image: supabaseUser.userMetadata?['avatar_url'] ?? supabaseUser.userMetadata?['picture'],
      emailVerified: supabaseUser.emailConfirmedAt != null,
      subscriptionTier: 'HOBBY',
      role: 'USER',
    );
  }

  // Check session status
  Future<Session?> checkSession() async {
    try {
      final session = _supabase.auth.currentSession;
      
      if (session == null) {
        return null;
      }

      final mfaResponse = await _supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      final bool isMfaRequired = mfaResponse.nextLevel == 'aal2' && 
                                mfaResponse.currentLevel == 'aal1';
      
      User user = await _getUserWithFallback(session.user);
      
      return Session(
        user: user,
        session: SessionToken(
          token: session.accessToken,
          expiresAt: session.expiresAt != null
              ? DateTime.fromMillisecondsSinceEpoch(session.expiresAt! * 1000)
              : DateTime.now().add(const Duration(days: 7)),
        ),
        twoFactorRequired: isMfaRequired,
      );
    } catch (e) {
      debugPrint('checkSession: Error: $e');
      return null;
    }
  }
}

final authServiceProvider = Provider<AuthService>((ref) {
  final dio = ref.watch(apiClientProvider);
  return AuthService(dio);
});
