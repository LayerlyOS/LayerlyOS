import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/filaments_service.dart';
import '../../../shared/models/filament.dart';

class FilamentsState {
  final List<Filament> filaments;
  final List<String> brands;
  final bool isLoading;
  final bool isLoadingMore;
  final String? error;
  final PaginationInfo? pagination;
  final String search;
  final String selectedBrand;
  final String sortBy;
  final String sortOrder;

  const FilamentsState({
    this.filaments = const [],
    this.brands = const [],
    this.isLoading = false,
    this.isLoadingMore = false,
    this.error,
    this.pagination,
    this.search = '',
    this.selectedBrand = '',
    this.sortBy = 'brand',
    this.sortOrder = 'asc',
  });

  FilamentsState copyWith({
    List<Filament>? filaments,
    List<String>? brands,
    bool? isLoading,
    bool? isLoadingMore,
    String? error,
    PaginationInfo? pagination,
    String? search,
    String? selectedBrand,
    String? sortBy,
    String? sortOrder,
  }) {
    return FilamentsState(
      filaments: filaments ?? this.filaments,
      brands: brands ?? this.brands,
      isLoading: isLoading ?? this.isLoading,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      error: error,
      pagination: pagination ?? this.pagination,
      search: search ?? this.search,
      selectedBrand: selectedBrand ?? this.selectedBrand,
      sortBy: sortBy ?? this.sortBy,
      sortOrder: sortOrder ?? this.sortOrder,
    );
  }
}

class FilamentsNotifier extends StateNotifier<FilamentsState> {
  final FilamentsService _service;

  FilamentsNotifier(this._service) : super(const FilamentsState()) {
    loadFilaments();
    loadBrands();
  }

  Future<void> loadFilaments({bool loadMore = false}) async {
    if (loadMore) {
      state = state.copyWith(isLoadingMore: true, error: null);
    } else {
      state = state.copyWith(isLoading: true, error: null, filaments: []);
    }

    try {
      final page = loadMore && state.pagination != null
          ? state.pagination!.page + 1
          : 1;

      if (loadMore && state.pagination != null) {
        if (page > state.pagination!.totalPages) {
          state = state.copyWith(isLoadingMore: false);
          return;
        }
      }

      final response = await _service.getFilaments(
        page: page,
        limit: 50,
        search: state.search,
        brand: state.selectedBrand,
        sort: state.sortBy,
        order: state.sortOrder,
      );

      state = state.copyWith(
        filaments: loadMore
            ? [...state.filaments, ...response.filaments]
            : response.filaments,
        pagination: response.pagination,
        isLoading: false,
        isLoadingMore: false,
      );
    } catch (e) {
      state = state.copyWith(
        error: e.toString().replaceFirst('Exception: ', ''),
        isLoading: false,
        isLoadingMore: false,
      );
    }
  }

  Future<void> loadBrands() async {
    try {
      final brands = await _service.getBrands();
      state = state.copyWith(brands: brands);
    } catch (e) {
      // Silently fail - brands are optional
    }
  }

  void setSearch(String search) {
    state = state.copyWith(search: search);
    loadFilaments();
  }

  void setBrand(String brand) {
    state = state.copyWith(selectedBrand: brand);
    loadFilaments();
  }

  void setSort(String sortBy, String sortOrder) {
    state = state.copyWith(sortBy: sortBy, sortOrder: sortOrder);
    loadFilaments();
  }

  void refresh() {
    loadFilaments();
  }
}

class GlobalFilamentsState {
  final List<GlobalFilament> filaments;
  final List<String> brands;
  final bool isLoading;
  final bool isLoadingMore;
  final String? error;
  final PaginationInfo? pagination;
  final String search;
  final String selectedBrand;
  final String sortBy;
  final String sortOrder;

  const GlobalFilamentsState({
    this.filaments = const [],
    this.brands = const [],
    this.isLoading = false,
    this.isLoadingMore = false,
    this.error,
    this.pagination,
    this.search = '',
    this.selectedBrand = '',
    this.sortBy = 'brand',
    this.sortOrder = 'asc',
  });

  GlobalFilamentsState copyWith({
    List<GlobalFilament>? filaments,
    List<String>? brands,
    bool? isLoading,
    bool? isLoadingMore,
    String? error,
    PaginationInfo? pagination,
    String? search,
    String? selectedBrand,
    String? sortBy,
    String? sortOrder,
  }) {
    return GlobalFilamentsState(
      filaments: filaments ?? this.filaments,
      brands: brands ?? this.brands,
      isLoading: isLoading ?? this.isLoading,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      error: error,
      pagination: pagination ?? this.pagination,
      search: search ?? this.search,
      selectedBrand: selectedBrand ?? this.selectedBrand,
      sortBy: sortBy ?? this.sortBy,
      sortOrder: sortOrder ?? this.sortOrder,
    );
  }
}

class GlobalFilamentsNotifier extends StateNotifier<GlobalFilamentsState> {
  final GlobalFilamentsService _service;

  GlobalFilamentsNotifier(this._service) : super(const GlobalFilamentsState()) {
    loadFilaments();
    loadBrands();
  }

  Future<void> loadFilaments({bool loadMore = false}) async {
    if (loadMore) {
      state = state.copyWith(isLoadingMore: true, error: null);
    } else {
      state = state.copyWith(isLoading: true, error: null, filaments: []);
    }

    try {
      final page = loadMore && state.pagination != null
          ? state.pagination!.page + 1
          : 1;

      if (loadMore && state.pagination != null) {
        if (page > state.pagination!.totalPages) {
          state = state.copyWith(isLoadingMore: false);
          return;
        }
      }

      final response = await _service.getGlobalFilaments(
        page: page,
        limit: 50,
        search: state.search,
        brand: state.selectedBrand,
        sort: state.sortBy,
        order: state.sortOrder,
      );

      state = state.copyWith(
        filaments: loadMore
            ? [...state.filaments, ...response.filaments]
            : response.filaments,
        pagination: response.pagination,
        isLoading: false,
        isLoadingMore: false,
      );
    } catch (e) {
      state = state.copyWith(
        error: e.toString().replaceFirst('Exception: ', ''),
        isLoading: false,
        isLoadingMore: false,
      );
    }
  }

  Future<void> loadBrands() async {
    try {
      final brands = await _service.getBrands();
      state = state.copyWith(brands: brands);
    } catch (e) {
      // Silently fail - brands are optional
    }
  }

  void setSearch(String search) {
    state = state.copyWith(search: search);
    loadFilaments();
  }

  void setBrand(String brand) {
    state = state.copyWith(selectedBrand: brand);
    loadFilaments();
  }

  void setSort(String sortBy, String sortOrder) {
    state = state.copyWith(sortBy: sortBy, sortOrder: sortOrder);
    loadFilaments();
  }

  void refresh() {
    loadFilaments();
  }
}

final filamentsProvider = StateNotifierProvider<FilamentsNotifier, FilamentsState>((ref) {
  final service = ref.watch(filamentsServiceProvider);
  return FilamentsNotifier(service);
});

final globalFilamentsProvider =
    StateNotifierProvider<GlobalFilamentsNotifier, GlobalFilamentsState>((ref) {
  final service = ref.watch(globalFilamentsServiceProvider);
  return GlobalFilamentsNotifier(service);
});
