import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../shared/models/filament.dart';

class FilamentsService {
  final Dio _dio;

  FilamentsService(this._dio);

  Future<FilamentsResponse> getFilaments({
    int page = 1,
    int limit = 50,
    String search = '',
    String brand = '',
    String sort = 'brand',
    String order = 'asc',
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'page': page.toString(),
        'limit': limit.toString(),
        if (search.isNotEmpty) 'search': search,
        if (brand.isNotEmpty) 'brand': brand,
        'sort': sort,
        'order': order,
      };

      final response = await _dio.get(
        '/filaments',
        queryParameters: queryParams,
      );

      final data = response.data;
      final filamentsData = data['data'] as List<dynamic>;
      final pagination = data['pagination'] as Map<String, dynamic>;

      return FilamentsResponse(
        filaments: filamentsData
            .map((json) => Filament.fromJson(json as Map<String, dynamic>))
            .toList(),
        pagination: PaginationInfo(
          page: pagination['page'] as int,
          limit: pagination['limit'] as int,
          total: pagination['total'] as int,
          totalPages: pagination['totalPages'] as int,
        ),
      );
    } on DioException catch (e) {
      if (e.response != null) {
        throw Exception(e.response?.data['error'] ?? 'Failed to fetch filaments');
      }
      throw Exception('Network error: ${e.message}');
    }
  }

  Future<List<String>> getBrands() async {
    try {
      final response = await _dio.get('/filaments/brands');
      return List<String>.from(response.data);
    } on DioException catch (e) {
      if (e.response != null) {
        throw Exception(e.response?.data['error'] ?? 'Failed to fetch brands');
      }
      throw Exception('Network error: ${e.message}');
    }
  }
}

class GlobalFilamentsService {
  final Dio _dio;

  GlobalFilamentsService(this._dio);

  Future<GlobalFilamentsResponse> getGlobalFilaments({
    int page = 1,
    int limit = 50,
    String search = '',
    String brand = '',
    String sort = 'brand',
    String order = 'asc',
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'page': page.toString(),
        'limit': limit.toString(),
        if (search.isNotEmpty) 'search': search,
        if (brand.isNotEmpty) 'brand': brand,
        'sort': sort,
        'order': order,
      };

      final response = await _dio.get(
        '/filaments/global',
        queryParameters: queryParams,
      );

      final data = response.data;
      final filamentsData = data['data'] as List<dynamic>;
      final pagination = data['pagination'] as Map<String, dynamic>;

      return GlobalFilamentsResponse(
        filaments: filamentsData
            .map((json) => GlobalFilament.fromJson(json as Map<String, dynamic>))
            .toList(),
        pagination: PaginationInfo(
          page: pagination['page'] as int,
          limit: pagination['limit'] as int,
          total: pagination['total'] as int,
          totalPages: pagination['totalPages'] as int,
        ),
      );
    } on DioException catch (e) {
      if (e.response != null) {
        throw Exception(e.response?.data['error'] ?? 'Failed to fetch global filaments');
      }
      throw Exception('Network error: ${e.message}');
    }
  }

  Future<List<String>> getBrands() async {
    try {
      final response = await _dio.get('/filaments/global/brands');
      return List<String>.from(response.data);
    } on DioException catch (e) {
      if (e.response != null) {
        throw Exception(e.response?.data['error'] ?? 'Failed to fetch brands');
      }
      throw Exception('Network error: ${e.message}');
    }
  }
}

class FilamentsResponse {
  final List<Filament> filaments;
  final PaginationInfo pagination;

  FilamentsResponse({
    required this.filaments,
    required this.pagination,
  });
}

class GlobalFilamentsResponse {
  final List<GlobalFilament> filaments;
  final PaginationInfo pagination;

  GlobalFilamentsResponse({
    required this.filaments,
    required this.pagination,
  });
}

class PaginationInfo {
  final int page;
  final int limit;
  final int total;
  final int totalPages;

  PaginationInfo({
    required this.page,
    required this.limit,
    required this.total,
    required this.totalPages,
  });
}

final filamentsServiceProvider = Provider<FilamentsService>((ref) {
  final dio = ref.watch(apiClientProvider);
  return FilamentsService(dio);
});

final globalFilamentsServiceProvider = Provider<GlobalFilamentsService>((ref) {
  final dio = ref.watch(apiClientProvider);
  return GlobalFilamentsService(dio);
});
