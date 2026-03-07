import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../config/app_config.dart';
import '../config/supabase_config.dart';
import '../storage/secure_storage_service.dart';

final apiClientProvider = Provider<Dio>((ref) {
  final dio = Dio(
    BaseOptions(
      baseUrl: AppConfig.baseUrl,
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ),
  );

  // Request interceptor - add Supabase JWT token
  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) async {
        // Get Supabase session token
        final session = SupabaseConfig.client.auth.currentSession;
        if (session != null && session.accessToken.isNotEmpty) {
          options.headers['Authorization'] = 'Bearer ${session.accessToken}';
          debugPrint('Adding Supabase JWT token to request');
        } else {
          // Fallback to stored token if Supabase session is not available
          final token = await SecureStorageService().getToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
            debugPrint('Adding stored token to request');
          }
        }
        return handler.next(options);
      },
      onResponse: (response, handler) {
        // Ensure response.data is properly typed
        if (response.data is! Map && response.data is! List) {
          // If it's a string, try to parse it as JSON
          if (response.data is String) {
            try {
              // Dio should handle this, but just in case
              return handler.next(response);
            } catch (_) {
              // Ignore
            }
          }
        }
        return handler.next(response);
      },
      onError: (error, handler) async {
        // Enhanced error logging
        debugPrint('API Error: ${error.type}');
        debugPrint('API Error path: ${error.requestOptions.path}');
        debugPrint('API Error message: ${error.message}');
        if (error.response != null) {
          debugPrint('API Error status: ${error.response?.statusCode}');
          debugPrint('API Error data: ${error.response?.data}');
        } else {
          debugPrint('API Error: No response (connection error)');
          debugPrint('API Error: Check if backend is running and accessible');
          debugPrint('API Error: Base URL: ${error.requestOptions.baseUrl}');
        }
        
        // Handle 401 - unauthorized
        if (error.response?.statusCode == 401) {
          // Token expired or invalid - clear storage and sign out from Supabase
          await SecureStorageService().clearAll();
          await SupabaseConfig.client.auth.signOut();
        }
        return handler.next(error);
      },
    ),
  );

  return dio;
});
