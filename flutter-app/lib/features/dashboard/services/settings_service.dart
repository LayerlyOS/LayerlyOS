import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../shared/models/settings.dart';

class SettingsService {
  final Dio _dio;

  SettingsService(this._dio);

  // Get settings
  Future<Settings> getSettings() async {
    try {
      final response = await _dio.get('/settings');
      return Settings.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      if (e.response != null) {
        throw Exception(e.response?.data['error'] ?? 'Failed to fetch settings');
      }
      throw Exception('Network error: ${e.message}');
    }
  }

  // Update settings
  Future<Settings> updateSettings({
    double? energyRate,
    String? defaultPrinterId,
    bool? useGravatar,
    String? language,
  }) async {
    try {
      final response = await _dio.patch(
        '/settings',
        data: {
          'energyRate': energyRate,
          'defaultPrinterId': defaultPrinterId,
          'useGravatar': useGravatar,
          'language': language,
        },
      );
      return Settings.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      if (e.response != null) {
        throw Exception(e.response?.data['error'] ?? 'Failed to update settings');
      }
      throw Exception('Network error: ${e.message}');
    }
  }
}

final settingsServiceProvider = Provider<SettingsService>((ref) {
  final dio = ref.watch(apiClientProvider);
  return SettingsService(dio);
});
