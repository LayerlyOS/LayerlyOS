import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureStorageService {
  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(
      encryptedSharedPreferences: true,
    ),
  );

  static const String _tokenKey = 'auth_token';
  static const String _sessionKey = 'session_data';

  // Token management
  Future<void> saveToken(String token) async {
    await _storage.write(key: _tokenKey, value: token);
    // ignore: avoid_print
    debugPrint('Token saved to secure storage: ${token.substring(0, 10)}...');
  }

  Future<String?> getToken() async {
    final token = await _storage.read(key: _tokenKey);
    // ignore: avoid_print
    debugPrint('Token retrieved from storage: ${token != null ? "${token.substring(0, 10)}..." : "null"}');
    return token;
  }

  Future<void> deleteToken() async {
    await _storage.delete(key: _tokenKey);
  }

  // Session data
  Future<void> saveSessionData(String data) async {
    await _storage.write(key: _sessionKey, value: data);
  }

  Future<String?> getSessionData() async {
    return await _storage.read(key: _sessionKey);
  }

  Future<void> clearAll() async {
    await _storage.deleteAll();
  }
}
