import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../shared/models/filament.dart';
import '../../../shared/theme/app_theme.dart';
import '../providers/filaments_provider.dart';
import '../../../shared/widgets/inputs/text_field.dart';
import '../../../shared/widgets/common/error_banner.dart';

class _StyledDropdown<T> extends StatelessWidget {
  final T? value;
  final String label;
  final List<DropdownMenuItem<T>> items;
  final ValueChanged<T?>? onChanged;
  final String? hint;

  const _StyledDropdown({
    required this.value,
    required this.label,
    required this.items,
    this.onChanged,
    this.hint,
  });

  @override
  Widget build(BuildContext context) {
    return DropdownButtonFormField<T>(
      initialValue: value,
      isDense: true,
      isExpanded: true,
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
        filled: true,
        fillColor: AppTheme.white,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppTheme.radiusMd),
          borderSide: const BorderSide(color: AppTheme.slate200),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppTheme.radiusMd),
          borderSide: const BorderSide(color: AppTheme.slate200),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppTheme.radiusMd),
          borderSide: const BorderSide(
            color: AppTheme.blue600,
            width: 2,
          ),
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: AppTheme.spacing4,
          vertical: AppTheme.spacing3,
        ),
      ),
      dropdownColor: AppTheme.white,
      borderRadius: BorderRadius.circular(AppTheme.radiusMd),
      menuMaxHeight: 300,
      items: items,
      onChanged: onChanged,
      style: const TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w500,
        color: AppTheme.slate900,
        fontFamily: AppTheme.fontFamily,
      ),
      icon: Icon(
        Icons.keyboard_arrow_down_rounded,
        color: AppTheme.slate600,
        size: 20,
      ),
    );
  }
}

class FilamentsTab extends ConsumerStatefulWidget {
  const FilamentsTab({super.key});

  @override
  ConsumerState<FilamentsTab> createState() => _FilamentsTabState();
}

class _FilamentsTabState extends ConsumerState<FilamentsTab>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Beautiful Tab Bar with gradient
        Container(
          decoration: BoxDecoration(
            color: AppTheme.white,
            boxShadow: [
              BoxShadow(
                color: AppTheme.slate200.withValues(alpha: 0.2),
                blurRadius: 4,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: TabBar(
            controller: _tabController,
            labelColor: AppTheme.blue600,
            unselectedLabelColor: AppTheme.slate500,
            indicatorColor: AppTheme.blue600,
            indicatorWeight: 3,
            indicatorSize: TabBarIndicatorSize.tab,
            dividerColor: Colors.transparent,
            labelStyle: const TextStyle(
              fontWeight: FontWeight.w600,
              fontSize: 14,
              fontFamily: AppTheme.fontFamily,
            ),
            unselectedLabelStyle: const TextStyle(
              fontWeight: FontWeight.w500,
              fontSize: 14,
              fontFamily: AppTheme.fontFamily,
            ),
            tabs: const [
              Tab(
                icon: Icon(Icons.inventory_2, size: 20),
                text: 'Warehouse',
              ),
              Tab(
                icon: Icon(Icons.public, size: 20),
                text: 'Global',
              ),
            ],
          ),
        ),
        // Tab Content
        Expanded(
          child: TabBarView(
            controller: _tabController,
            children: const [
              _WarehouseTab(),
              _GlobalTab(),
            ],
          ),
        ),
      ],
    );
  }
}

class _WarehouseTab extends ConsumerStatefulWidget {
  const _WarehouseTab();

  @override
  ConsumerState<_WarehouseTab> createState() => _WarehouseTabState();
}

class _WarehouseTabState extends ConsumerState<_WarehouseTab> {
  final _searchController = TextEditingController();
  Timer? _searchDebounce;

  @override
  void initState() {
    super.initState();
    _searchController.text = ref.read(filamentsProvider).search;
  }

  @override
  void dispose() {
    _searchDebounce?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchChanged(String value) {
    _searchDebounce?.cancel();
    _searchDebounce = Timer(const Duration(milliseconds: 500), () {
      if (mounted) {
        ref.read(filamentsProvider.notifier).setSearch(value);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(filamentsProvider);
    final notifier = ref.read(filamentsProvider.notifier);

    // Update controller if search changed externally
    if (_searchController.text != state.search) {
      _searchController.text = state.search;
    }

    return Column(
      children: [
        // Filters
        Container(
          padding: const EdgeInsets.all(AppTheme.spacing4),
          decoration: BoxDecoration(
            color: AppTheme.white,
            boxShadow: [
              BoxShadow(
                color: AppTheme.slate200.withValues(alpha: 0.1),
                blurRadius: 2,
                offset: const Offset(0, 1),
              ),
            ],
          ),
          child: Column(
            children: [
              // Search
              AppTextField(
                hint: 'Search filament...',
                leftIcon: const Icon(Icons.search, size: 20),
                controller: _searchController,
                onChanged: _onSearchChanged,
              ),
              const SizedBox(height: AppTheme.spacing3),
              // Filters Row
              Row(
                children: [
                  // Brand Filter
                  Expanded(
                    flex: 2,
                    child: _StyledDropdown<String>(
                      value: state.selectedBrand.isEmpty ? null : state.selectedBrand,
                      label: 'Brand',
                      hint: 'All brands',
                      items: [
                        const DropdownMenuItem(
                          value: '',
                          child: Text('All brands', overflow: TextOverflow.ellipsis),
                        ),
                        ...state.brands.map((brand) => DropdownMenuItem(
                              value: brand,
                              child: Text(brand, overflow: TextOverflow.ellipsis),
                            )),
                      ],
                      onChanged: (value) {
                        notifier.setBrand(value ?? '');
                      },
                    ),
                  ),
                  const SizedBox(width: AppTheme.spacing2),
                  // Sort
                  Expanded(
                    flex: 2,
                    child: _StyledDropdown<String>(
                      value: state.sortBy,
                      label: 'Sort by',
                      items: const [
                        DropdownMenuItem(value: 'brand', child: Text('Brand', overflow: TextOverflow.ellipsis)),
                        DropdownMenuItem(value: 'material', child: Text('Material', overflow: TextOverflow.ellipsis)),
                        DropdownMenuItem(value: 'price', child: Text('Price', overflow: TextOverflow.ellipsis)),
                        DropdownMenuItem(value: 'weight', child: Text('Weight', overflow: TextOverflow.ellipsis)),
                      ],
                      onChanged: (value) {
                        if (value != null) {
                          notifier.setSort(value, state.sortOrder);
                        }
                      },
                    ),
                  ),
                  const SizedBox(width: AppTheme.spacing2),
                  // Sort Order
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      border: Border.all(color: AppTheme.slate200),
                      borderRadius: BorderRadius.circular(AppTheme.radiusMd),
                    ),
                    child: IconButton(
                      padding: EdgeInsets.zero,
                      icon: Icon(
                        state.sortOrder == 'asc' ? Icons.arrow_upward : Icons.arrow_downward,
                        color: AppTheme.blue600,
                        size: 20,
                      ),
                      onPressed: () {
                        notifier.setSort(
                          state.sortBy,
                          state.sortOrder == 'asc' ? 'desc' : 'asc',
                        );
                      },
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        // Content
        Expanded(
          child: _FilamentsContentBuilder.build(
            isLoading: state.isLoading,
            error: state.error,
            filaments: state.filaments,
            hasMore: state.pagination != null &&
                state.pagination!.page < state.pagination!.totalPages,
            isLoadingMore: state.isLoadingMore,
            onLoadMore: () => notifier.loadFilaments(loadMore: true),
            onRefresh: () => notifier.refresh(),
            isGlobal: false,
          ),
        ),
      ],
    );
  }
}

class _FilamentsContentBuilder {
  static Widget build({
    required bool isLoading,
    required String? error,
    required List filaments,
    required bool hasMore,
    required bool isLoadingMore,
    required VoidCallback onLoadMore,
    required VoidCallback onRefresh,
    required bool isGlobal,
  }) {
    if (isLoading && filaments.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    if (error != null && filaments.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(AppTheme.spacing6),
          child: ErrorBanner(
            message: error,
            onDismiss: () => onRefresh(),
          ),
        ),
      );
    }

    if (filaments.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              isGlobal ? Icons.public : Icons.inventory_2,
              size: 64,
              color: AppTheme.slate400,
            ),
            const SizedBox(height: AppTheme.spacing4),
            Text(
              isGlobal ? 'No filaments found' : 'No filaments in warehouse',
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: AppTheme.slate600,
              ),
            ),
            const SizedBox(height: AppTheme.spacing2),
            Text(
              isGlobal
                  ? 'Try adjusting your filters'
                  : 'Add your first filament to get started',
              style: TextStyle(
                fontSize: 14,
                color: AppTheme.slate500,
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () async => onRefresh(),
      child: ListView.builder(
        padding: const EdgeInsets.all(AppTheme.spacing4),
        itemCount: filaments.length + (hasMore ? 1 : 0),
        itemBuilder: (context, index) {
          if (index == filaments.length) {
            if (isLoadingMore) {
              return const Padding(
                padding: EdgeInsets.all(AppTheme.spacing4),
                child: Center(child: CircularProgressIndicator()),
              );
            }
            WidgetsBinding.instance.addPostFrameCallback((_) => onLoadMore());
            return const SizedBox.shrink();
          }

          final filament = filaments[index];
          return _FilamentCard(filament: filament, isGlobal: isGlobal);
        },
      ),
    );
  }
}

class _GlobalTab extends ConsumerStatefulWidget {
  const _GlobalTab();

  @override
  ConsumerState<_GlobalTab> createState() => _GlobalTabState();
}

class _GlobalTabState extends ConsumerState<_GlobalTab> {
  final _searchController = TextEditingController();
  Timer? _searchDebounce;

  @override
  void initState() {
    super.initState();
    _searchController.text = ref.read(globalFilamentsProvider).search;
  }

  @override
  void dispose() {
    _searchDebounce?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchChanged(String value) {
    _searchDebounce?.cancel();
    _searchDebounce = Timer(const Duration(milliseconds: 500), () {
      if (mounted) {
        ref.read(globalFilamentsProvider.notifier).setSearch(value);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(globalFilamentsProvider);
    final notifier = ref.read(globalFilamentsProvider.notifier);

    // Update controller if search changed externally
    if (_searchController.text != state.search) {
      _searchController.text = state.search;
    }

    return Column(
      children: [
        // Filters
        Container(
          padding: const EdgeInsets.all(AppTheme.spacing4),
          decoration: BoxDecoration(
            color: AppTheme.white,
            boxShadow: [
              BoxShadow(
                color: AppTheme.slate200.withValues(alpha: 0.1),
                blurRadius: 2,
                offset: const Offset(0, 1),
              ),
            ],
          ),
          child: Column(
            children: [
              // Search
              AppTextField(
                hint: 'Search filament...',
                leftIcon: const Icon(Icons.search, size: 20),
                controller: _searchController,
                onChanged: _onSearchChanged,
              ),
              const SizedBox(height: AppTheme.spacing3),
              // Filters Row
              Row(
                children: [
                  // Brand Filter
                  Expanded(
                    flex: 2,
                    child: _StyledDropdown<String>(
                      value: state.selectedBrand.isEmpty ? null : state.selectedBrand,
                      label: 'Brand',
                      hint: 'All brands',
                      items: [
                        const DropdownMenuItem(
                          value: '',
                          child: Text('All brands', overflow: TextOverflow.ellipsis),
                        ),
                        ...state.brands.map((brand) => DropdownMenuItem(
                              value: brand,
                              child: Text(brand, overflow: TextOverflow.ellipsis),
                            )),
                      ],
                      onChanged: (value) {
                        notifier.setBrand(value ?? '');
                      },
                    ),
                  ),
                  const SizedBox(width: AppTheme.spacing2),
                  // Sort
                  Expanded(
                    flex: 2,
                    child: _StyledDropdown<String>(
                      value: state.sortBy,
                      label: 'Sort by',
                      items: const [
                        DropdownMenuItem(value: 'brand', child: Text('Brand', overflow: TextOverflow.ellipsis)),
                        DropdownMenuItem(value: 'material', child: Text('Material', overflow: TextOverflow.ellipsis)),
                        DropdownMenuItem(value: 'color', child: Text('Color', overflow: TextOverflow.ellipsis)),
                      ],
                      onChanged: (value) {
                        if (value != null) {
                          notifier.setSort(value, state.sortOrder);
                        }
                      },
                    ),
                  ),
                  const SizedBox(width: AppTheme.spacing2),
                  // Sort Order
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      border: Border.all(color: AppTheme.slate200),
                      borderRadius: BorderRadius.circular(AppTheme.radiusMd),
                    ),
                    child: IconButton(
                      padding: EdgeInsets.zero,
                      icon: Icon(
                        state.sortOrder == 'asc' ? Icons.arrow_upward : Icons.arrow_downward,
                        color: AppTheme.blue600,
                        size: 20,
                      ),
                      onPressed: () {
                        notifier.setSort(
                          state.sortBy,
                          state.sortOrder == 'asc' ? 'desc' : 'asc',
                        );
                      },
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        // Content
        Expanded(
          child: _FilamentsContentBuilder.build(
            isLoading: state.isLoading,
            error: state.error,
            filaments: state.filaments,
            hasMore: state.pagination != null &&
                state.pagination!.page < state.pagination!.totalPages,
            isLoadingMore: state.isLoadingMore,
            onLoadMore: () => notifier.loadFilaments(loadMore: true),
            onRefresh: () => notifier.refresh(),
            isGlobal: true,
          ),
        ),
      ],
    );
  }
}

class _FilamentCard extends StatelessWidget {
  final dynamic filament;
  final bool isGlobal;

  const _FilamentCard({
    required this.filament,
    required this.isGlobal,
  });

  Color _getColorFromHex(String? hex) {
    if (hex == null || hex.isEmpty) return AppTheme.slate400;
    try {
      return Color(int.parse(hex.replaceFirst('#', '0xFF')));
    } catch (_) {
      return AppTheme.slate400;
    }
  }

  @override
  Widget build(BuildContext context) {
    String? colorHex;
    String brand;
    String materialName;
    String filamentColor;
    double? spoolPrice;
    double? spoolWeight;
    double? remainingWeight;

    if (isGlobal) {
      final gf = filament as GlobalFilament;
      colorHex = gf.colorHex;
      brand = gf.brand;
      materialName = gf.materialName;
      filamentColor = gf.color;
      spoolPrice = gf.spoolPrice;
      spoolWeight = gf.spoolWeight;
      remainingWeight = null;
    } else {
      final f = filament as Filament;
      colorHex = f.colorHex;
      brand = f.brand;
      materialName = f.materialName;
      filamentColor = f.color;
      spoolPrice = f.spoolPrice;
      spoolWeight = f.spoolWeight;
      remainingWeight = f.remainingWeight;
    }

    final color = _getColorFromHex(colorHex);

    // Determine if color is light (white/light colors need darker border)
    final isLightColor = color.computeLuminance() > 0.5;
    final borderColor = isLightColor 
        ? AppTheme.slate400 
        : AppTheme.slate200.withValues(alpha: 0.5);

    return Container(
      margin: const EdgeInsets.only(bottom: AppTheme.spacing3),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppTheme.white,
            AppTheme.slate50.withValues(alpha: 0.3),
          ],
        ),
        borderRadius: BorderRadius.circular(AppTheme.radiusXl),
        border: Border.all(
          color: AppTheme.slate200.withValues(alpha: 0.5),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: AppTheme.slate200.withValues(alpha: 0.2),
            blurRadius: 12,
            offset: const Offset(0, 4),
            spreadRadius: 0,
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(AppTheme.radiusXl),
          onTap: () {
            // Future: Navigate to filament details
          },
          child: Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: AppTheme.spacing4,
              vertical: AppTheme.spacing4,
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                // Color indicator with better visibility for light colors
                Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    color: color,
                    borderRadius: BorderRadius.circular(AppTheme.radiusLg),
                    border: Border.all(
                      color: borderColor,
                      width: isLightColor ? 2 : 1.5,
                    ),
                    boxShadow: [
                      if (!isLightColor)
                        BoxShadow(
                          color: color.withValues(alpha: 0.3),
                          blurRadius: 12,
                          offset: const Offset(0, 4),
                          spreadRadius: 0,
                        ),
                      BoxShadow(
                        color: AppTheme.slate200.withValues(alpha: 0.2),
                        blurRadius: 6,
                        offset: const Offset(0, 2),
                        spreadRadius: 0,
                      ),
                    ],
                  ),
                  child: isLightColor
                      ? Container(
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(AppTheme.radiusLg),
                            border: Border.all(
                              color: AppTheme.slate400.withValues(alpha: 0.2),
                              width: 1,
                            ),
                          ),
                        )
                      : null,
                ),
                const SizedBox(width: AppTheme.spacing4),
                // Info section
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      // Brand and Material with icon
                      Row(
                        children: [
                          Icon(
                            Icons.inventory_2,
                            size: 16,
                            color: AppTheme.blue600,
                          ),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              '$brand $materialName',
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: AppTheme.slate900,
                                fontFamily: AppTheme.fontFamily,
                                height: 1.3,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      // Color with badge style
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 5,
                        ),
                        decoration: BoxDecoration(
                          color: AppTheme.slate100,
                          borderRadius: BorderRadius.circular(AppTheme.radiusMd),
                          border: Border.all(
                            color: AppTheme.slate200,
                            width: 1,
                          ),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              width: 14,
                              height: 14,
                              decoration: BoxDecoration(
                                color: color,
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: borderColor,
                                  width: 1.5,
                                ),
                                boxShadow: [
                                  if (!isLightColor)
                                    BoxShadow(
                                      color: color.withValues(alpha: 0.4),
                                      blurRadius: 4,
                                      offset: const Offset(0, 1),
                                    ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 8),
                            Flexible(
                              child: Text(
                                filamentColor,
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                  color: AppTheme.slate700,
                                  fontFamily: AppTheme.fontFamily,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      ),
                      // Remaining weight (for warehouse)
                      if (!isGlobal && remainingWeight != null) ...[
                        const SizedBox(height: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 5,
                          ),
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                AppTheme.blue50,
                                AppTheme.blue50.withValues(alpha: 0.8),
                              ],
                            ),
                            borderRadius: BorderRadius.circular(AppTheme.radiusMd),
                            border: Border.all(
                              color: AppTheme.blue200,
                              width: 1,
                            ),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.scale,
                                size: 14,
                                color: AppTheme.blue700,
                              ),
                              const SizedBox(width: 6),
                              Text(
                                '${remainingWeight.toStringAsFixed(0)}g',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                  color: AppTheme.blue700,
                                  fontFamily: AppTheme.fontFamily,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(width: AppTheme.spacing3),
                // Price and Weight section - compact
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    if (spoolPrice != null)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 8,
                        ),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [
                              AppTheme.blue600,
                              AppTheme.blue700,
                            ],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(AppTheme.radiusMd),
                          boxShadow: [
                            BoxShadow(
                              color: AppTheme.blue600.withValues(alpha: 0.4),
                              blurRadius: 8,
                              offset: const Offset(0, 3),
                              spreadRadius: 0,
                            ),
                          ],
                        ),
                        child: Text(
                          '\$${spoolPrice.toStringAsFixed(2)}',
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                            fontFamily: AppTheme.fontFamily,
                            letterSpacing: 0.3,
                          ),
                        ),
                      ),
                    if (spoolWeight != null) ...[
                      const SizedBox(height: 6),
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.fiber_manual_record,
                            size: 6,
                            color: AppTheme.slate400,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            '${spoolWeight.toStringAsFixed(0)}g',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: AppTheme.slate600,
                              fontFamily: AppTheme.fontFamily,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
