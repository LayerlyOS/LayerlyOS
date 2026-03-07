import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/prints_service.dart';
import '../../../shared/models/print.dart';

class PrintsState {
  final List<Print> prints;
  final bool isLoading;
  final String? error;

  const PrintsState({
    this.prints = const [],
    this.isLoading = false,
    this.error,
  });

  PrintsState copyWith({
    List<Print>? prints,
    bool? isLoading,
    String? error,
  }) {
    return PrintsState(
      prints: prints ?? this.prints,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class PrintsNotifier extends StateNotifier<PrintsState> {
  final PrintsService _printsService;

  PrintsNotifier(this._printsService) : super(const PrintsState());

  Future<void> loadPrints() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final prints = await _printsService.getPrints();
      state = state.copyWith(prints: prints, isLoading: false);
    } catch (e) {
      state = state.copyWith(
        error: e.toString().replaceFirst('Exception: ', ''),
        isLoading: false,
      );
    }
  }

  Future<void> createPrint({
    required String name,
    required double weight,
    required int timeH,
    required int timeM,
    required int qty,
    required double price,
    required double profit,
    required double totalCost,
    String? printerId,
    String? filamentId,
    String? orderId,
    String? brand,
    String? color,
    double? extraCost,
    double? manualPrice,
    Map<String, dynamic>? advancedSettings,
  }) async {
    try {
      await _printsService.createPrint(
        name: name,
        weight: weight,
        timeH: timeH,
        timeM: timeM,
        qty: qty,
        price: price,
        profit: profit,
        totalCost: totalCost,
        printerId: printerId,
        filamentId: filamentId,
        orderId: orderId,
        brand: brand,
        color: color,
        extraCost: extraCost,
        manualPrice: manualPrice,
        advancedSettings: advancedSettings,
      );
      await loadPrints();
    } catch (e) {
      state = state.copyWith(
        error: e.toString().replaceFirst('Exception: ', ''),
      );
      rethrow;
    }
  }

  Future<void> deletePrint(String id) async {
    try {
      await _printsService.deletePrint(id);
      await loadPrints();
    } catch (e) {
      state = state.copyWith(
        error: e.toString().replaceFirst('Exception: ', ''),
      );
      rethrow;
    }
  }
}

final printsProvider = StateNotifierProvider<PrintsNotifier, PrintsState>((ref) {
  final printsService = ref.watch(printsServiceProvider);
  return PrintsNotifier(printsService);
});
