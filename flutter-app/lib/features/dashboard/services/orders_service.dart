import 'package:dio/dio.dart';
import '../../../core/config/app_config.dart';
import '../../../shared/models/order.dart';

class OrdersService {
  final Dio _dio;

  OrdersService(this._dio);

  /// Fetch all orders for the current user
  Future<List<Order>> getOrders() async {
    try {
      final response = await _dio.get('${AppConfig.baseUrl}/orders');
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data;
        return data.map((json) => Order.fromJson(json as Map<String, dynamic>)).toList();
      }
      throw Exception('Failed to fetch orders: ${response.statusCode}');
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        throw Exception('Unauthorized');
      }
      throw Exception('Failed to fetch orders: ${e.message}');
    }
  }

  /// Fetch a single order by ID with all details
  Future<Order> getOrderById(String id) async {
    try {
      final response = await _dio.get('${AppConfig.baseUrl}/orders/$id');
      if (response.statusCode == 200) {
        return Order.fromJson(response.data as Map<String, dynamic>);
      }
      throw Exception('Failed to fetch order: ${response.statusCode}');
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        throw Exception('Unauthorized');
      }
      if (e.response?.statusCode == 404) {
        throw Exception('Order not found');
      }
      throw Exception('Failed to fetch order: ${e.message}');
    }
  }
}
