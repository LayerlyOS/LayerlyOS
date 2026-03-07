import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/router/app_router.dart';
import '../../../shared/models/print.dart';
import '../../../shared/theme/app_theme.dart';
import '../../../shared/utils/print_utils.dart';
import '../../../shared/widgets/common/error_banner.dart';
import '../providers/prints_provider.dart';

class PrintsListScreen extends ConsumerWidget {
  const PrintsListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final printsState = ref.watch(printsProvider);

    return Scaffold(
      backgroundColor: AppTheme.slate50,
      appBar: AppBar(
        title: const Text(
          'Prints',
          style: TextStyle(
            fontFamily: AppTheme.fontFamily,
            fontWeight: FontWeight.bold,
          ),
        ),
        backgroundColor: AppTheme.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.read(printsProvider.notifier).loadPrints(),
            tooltip: 'Refresh',
          ),
        ],
      ),
      body: printsState.isLoading
          ? const Center(child: CircularProgressIndicator())
          : printsState.error != null
              ? Center(
                  child: ErrorBanner(
                    message: printsState.error!,
                    onDismiss: () {},
                  ),
                )
              : printsState.prints.isEmpty
                  ? _buildEmptyState(context)
                  : _buildPrintsList(context, ref, printsState.prints),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.print_disabled,
            size: 80,
            color: AppTheme.slate400,
          ),
          const SizedBox(height: AppTheme.spacing4),
          Text(
            'No prints yet',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: AppTheme.slate600,
              fontFamily: AppTheme.fontFamily,
            ),
          ),
          const SizedBox(height: AppTheme.spacing2),
          Text(
            'Create your first print to get started',
            style: TextStyle(
              fontSize: 14,
              color: AppTheme.slate400,
              fontFamily: AppTheme.fontFamily,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPrintsList(BuildContext context, WidgetRef ref, List<Print> prints) {
    // Sort by date (newest first)
    final sortedPrints = List<Print>.from(prints)
      ..sort((a, b) => b.date.compareTo(a.date));

    return RefreshIndicator(
      onRefresh: () => ref.read(printsProvider.notifier).loadPrints(),
      child: ListView.builder(
        padding: const EdgeInsets.all(AppTheme.spacing4),
        itemCount: sortedPrints.length,
        itemBuilder: (context, index) {
          final print = sortedPrints[index];
          return _PrintCard(print: print, router: ref.read(routerProvider));
        },
      ),
    );
  }
}

class _PrintCard extends StatelessWidget {
  final Print print;
  final dynamic router;

  const _PrintCard({required this.print, required this.router});

  @override
  Widget build(BuildContext context) {
    final price = getPrice(print);
    final profit = getProfit(print);
    final cost = getCost(print);
    final totalWeight = print.weight * print.qty;
    final totalWeightDisplay = totalWeight >= 1000
        ? '${(totalWeight / 1000).toStringAsFixed(2)} kg'
        : '${totalWeight.toStringAsFixed(2)} g';

    return Card(
      margin: const EdgeInsets.only(bottom: AppTheme.spacing3),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppTheme.radiusLg),
        side: BorderSide(color: AppTheme.slate200, width: 1),
      ),
      child: InkWell(
        onTap: () {
          router.push('/prints/${print.id}');
        },
        borderRadius: BorderRadius.circular(AppTheme.radiusLg),
        child: Padding(
          padding: const EdgeInsets.all(AppTheme.spacing4),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header: Name and Date
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          print.name,
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.slate900,
                            fontFamily: AppTheme.fontFamily,
                          ),
                        ),
                        if (print.brand != null || print.color != null) ...[
                          const SizedBox(height: 4),
                          Text(
                            '${print.brand ?? 'N/A'} • ${print.color ?? 'N/A'}',
                            style: TextStyle(
                              fontSize: 12,
                              color: AppTheme.slate500,
                              fontFamily: AppTheme.fontFamily,
                            ),
                          ),
                        ],
                        const SizedBox(height: 4),
                        Text(
                          _formatDate(print.date),
                          style: TextStyle(
                            fontSize: 12,
                            color: AppTheme.slate400,
                            fontFamily: AppTheme.fontFamily,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppTheme.spacing2,
                      vertical: AppTheme.spacing1,
                    ),
                    decoration: BoxDecoration(
                      color: AppTheme.blue50,
                      borderRadius: BorderRadius.circular(AppTheme.radiusSm),
                    ),
                    child: Text(
                      'Qty: ${print.qty}',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.blue700,
                        fontFamily: AppTheme.fontFamily,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AppTheme.spacing3),
              // Stats
              Container(
                padding: const EdgeInsets.all(AppTheme.spacing3),
                decoration: BoxDecoration(
                  color: AppTheme.slate50,
                  borderRadius: BorderRadius.circular(AppTheme.radiusMd),
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        _StatItem(label: 'Weight', value: totalWeightDisplay),
                        _StatItem(label: 'Time', value: '${print.timeH}h ${print.timeM}m'),
                      ],
                    ),
                    const SizedBox(height: AppTheme.spacing2),
                    Container(
                      height: 1,
                      color: AppTheme.slate200,
                    ),
                    const SizedBox(height: AppTheme.spacing2),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        _StatItem(
                          label: 'Price',
                          value: _formatCurrency(price * print.qty),
                          valueColor: AppTheme.slate900,
                        ),
                        _StatItem(
                          label: 'Cost',
                          value: _formatCurrency(cost * print.qty),
                          valueColor: AppTheme.slate600,
                        ),
                        _StatItem(
                          label: 'Profit',
                          value: _formatCurrency(profit),
                          valueColor: AppTheme.green600,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year} ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
  }

  String _formatCurrency(double amount) {
    return '\$${amount.toStringAsFixed(2)}';
  }
}

class _StatItem extends StatelessWidget {
  final String label;
  final String value;
  final Color? valueColor;

  const _StatItem({
    required this.label,
    required this.value,
    this.valueColor,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: AppTheme.slate500,
            fontFamily: AppTheme.fontFamily,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: valueColor ?? AppTheme.slate700,
            fontFamily: AppTheme.fontFamily,
          ),
        ),
      ],
    );
  }
}
