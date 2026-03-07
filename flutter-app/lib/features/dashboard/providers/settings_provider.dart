import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/settings_service.dart';
import '../../../shared/models/settings.dart';

class SettingsNotifier extends StateNotifier<AsyncValue<Settings>> {
  final SettingsService _service;

  SettingsNotifier(this._service) : super(const AsyncValue.loading()) {
    loadSettings();
  }

  Future<void> loadSettings() async {
    state = const AsyncValue.loading();
    try {
      final settings = await _service.getSettings();
      state = AsyncValue.data(settings);
    } catch (e, stackTrace) {
      state = AsyncValue.error(e, stackTrace);
    }
  }

  Future<void> updateSettings({
    double? energyRate,
    String? defaultPrinterId,
    bool? useGravatar,
    String? language,
  }) async {
    try {
      final updated = await _service.updateSettings(
        energyRate: energyRate,
        defaultPrinterId: defaultPrinterId,
        useGravatar: useGravatar,
        language: language,
      );
      state = AsyncValue.data(updated);
    } catch (e, stackTrace) {
      state = AsyncValue.error(e, stackTrace);
      rethrow;
    }
  }
}

final settingsProvider = StateNotifierProvider<SettingsNotifier, AsyncValue<Settings>>((ref) {
  final service = ref.watch(settingsServiceProvider);
  return SettingsNotifier(service);
});
