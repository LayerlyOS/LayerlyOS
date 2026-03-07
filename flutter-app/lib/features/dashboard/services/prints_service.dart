import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../shared/models/print.dart';

class PrintsService {
  final Dio _dio;

  PrintsService(this._dio);

  // Get all prints
  Future<List<Print>> getPrints() async {
    try {
      final response = await _dio.get('/prints');
      final List<dynamic> data = response.data;
      return data.map((json) => Print.fromJson(json as Map<String, dynamic>)).toList();
    } on DioException catch (e) {
      if (e.response != null) {
        throw Exception(e.response?.data['error'] ?? 'Failed to fetch prints');
      }
      throw Exception('Network error: ${e.message}');
    }
  }

  // Create a print
  Future<Print> createPrint({
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
      final response = await _dio.post(
        '/prints',
        data: {
          'name': name,
          'weight': weight.toString(),
          'timeH': timeH.toString(),
          'timeM': timeM.toString(),
          'qty': qty.toString(),
          'price': price.toString(),
          'profit': profit.toString(),
          'totalCost': totalCost.toString(),
          'printerId': printerId,
          'filamentId': filamentId,
          'orderId': orderId,
          'brand': brand,
          'color': color,
          'extraCost': extraCost?.toString(),
          'manualPrice': manualPrice?.toString(),
          'advancedSettings': advancedSettings,
        },
      );

      return Print.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      if (e.response != null) {
        throw Exception(e.response?.data['error'] ?? 'Failed to create print');
      }
      throw Exception('Network error: ${e.message}');
    }
  }

  // Update a print
  Future<Print> updatePrint(String id, Map<String, dynamic> data) async {
    try {
      final response = await _dio.patch('/prints/$id', data: data);
      return Print.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      if (e.response != null) {
        throw Exception(e.response?.data['error'] ?? 'Failed to update print');
      }
      throw Exception('Network error: ${e.message}');
    }
  }

  // Get a single print by ID
  Future<Print> getPrintById(String id) async {
    try {
      // Since there's no GET /prints/:id endpoint, we fetch all and filter
      final prints = await getPrints();
      final print = prints.firstWhere(
        (p) => p.id == id,
        orElse: () => throw Exception('Print not found'),
      );
      return print;
    } on DioException catch (e) {
      if (e.response != null) {
        throw Exception(e.response?.data['error'] ?? 'Failed to fetch print');
      }
      throw Exception('Network error: ${e.message}');
    }
  }

  // Delete a print
  Future<void> deletePrint(String id) async {
    try {
      await _dio.delete('/prints/$id');
    } on DioException catch (e) {
      if (e.response != null) {
        throw Exception(e.response?.data['error'] ?? 'Failed to delete print');
      }
      throw Exception('Network error: ${e.message}');
    }
  }
}

final printsServiceProvider = Provider<PrintsService>((ref) {
  final dio = ref.watch(apiClientProvider);
  return PrintsService(dio);
});
