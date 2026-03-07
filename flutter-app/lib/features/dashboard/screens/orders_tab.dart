import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/router/app_router.dart';
import '../../../shared/theme/app_theme.dart';
import '../../../shared/widgets/common/error_banner.dart';
import '../../../shared/utils/print_utils.dart';
import '../providers/orders_provider.dart';

class OrdersTab extends ConsumerWidget {
  const OrdersTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ordersState = ref.watch(ordersProvider);

    return Scaffold(
      backgroundColor: AppTheme.slate50,
      appBar: AppBar(
        title: const Text(
          'Orders',
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
            onPressed: () => ref.read(ordersProvider.notifier).refresh(),
            tooltip: 'Refresh',
          ),
        ],
      ),
      body: ordersState.isLoading
          ? const Center(child: CircularProgressIndicator())
          : ordersState.error != null
              ? Center(
                  child: ErrorBanner(
                    message: ordersState.error!,
                    onDismiss: () {},
                  ),
                )
              : ordersState.orders.isEmpty
                  ? _buildEmptyState(context)
                  : _buildOrdersList(context, ref, ordersState.orders),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.receipt_long,
            size: 80,
            color: AppTheme.slate400,
          ),
          const SizedBox(height: AppTheme.spacing4),
          Text(
            'No orders yet',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: AppTheme.slate600,
              fontFamily: AppTheme.fontFamily,
            ),
          ),
          const SizedBox(height: AppTheme.spacing2),
          Text(
            'Create your first order to get started',
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

  Widget _buildOrdersList(BuildContext context, WidgetRef ref, List orders) {
    return RefreshIndicator(
      onRefresh: () => ref.read(ordersProvider.notifier).refresh(),
      child: ListView.builder(
        padding: const EdgeInsets.all(AppTheme.spacing4),
        itemCount: orders.length,
        itemBuilder: (context, index) {
          final order = orders[index];
          return _OrderCard(order: order, router: ref.read(routerProvider));
        },
      ),
    );
  }
}

class _OrderCard extends StatelessWidget {
  final dynamic order;
  final dynamic router;

  const _OrderCard({required this.order, required this.router});

  @override
  Widget build(BuildContext context) {
    final totals = _calculateTotals(order);
    final statusColor = _getStatusColor(order.status);
    final statusLabel = order.status.displayName;

    return Card(
      margin: const EdgeInsets.only(bottom: AppTheme.spacing3),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppTheme.radiusLg),
        side: BorderSide(color: AppTheme.slate200, width: 1),
      ),
      child: InkWell(
        onTap: () {
          router.push('/orders/${order.id}');
        },
        borderRadius: BorderRadius.circular(AppTheme.radiusLg),
        child: Padding(
          padding: const EdgeInsets.all(AppTheme.spacing4),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header: Title and Status
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          order.title,
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.slate900,
                            fontFamily: AppTheme.fontFamily,
                          ),
                        ),
                        if (order.customerName != null) ...[
                          const SizedBox(height: 4),
                          Text(
                            'Client: ${order.customerName}',
                            style: TextStyle(
                              fontSize: 14,
                              color: AppTheme.slate600,
                              fontFamily: AppTheme.fontFamily,
                            ),
                          ),
                        ],
                        if (order.deadline != null) ...[
                          const SizedBox(height: 4),
                          Text(
                            'Deadline: ${_formatDate(order.deadline)}',
                            style: TextStyle(
                              fontSize: 12,
                              color: AppTheme.slate400,
                              fontFamily: AppTheme.fontFamily,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppTheme.spacing3,
                      vertical: AppTheme.spacing1,
                    ),
                    decoration: BoxDecoration(
                      color: statusColor.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(AppTheme.radiusMd),
                      border: Border.all(color: statusColor.withValues(alpha: 0.3)),
                    ),
                    child: Text(
                      statusLabel,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: statusColor,
                        fontFamily: AppTheme.fontFamily,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AppTheme.spacing4),
              // Financial Summary
              Container(
                padding: const EdgeInsets.all(AppTheme.spacing3),
                decoration: BoxDecoration(
                  color: AppTheme.slate50,
                  borderRadius: BorderRadius.circular(AppTheme.radiusMd),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _StatItem(
                      label: 'Total',
                      value: _formatCurrency(totals['price']),
                      valueColor: AppTheme.slate900,
                    ),
                    Container(
                      width: 1,
                      height: 40,
                      color: AppTheme.slate200,
                    ),
                    _StatItem(
                      label: 'Profit',
                      value: _formatCurrency(totals['profit']),
                      valueColor: AppTheme.green600,
                    ),
                    Container(
                      width: 1,
                      height: 40,
                      color: AppTheme.slate200,
                    ),
                    _StatItem(
                      label: 'Prints',
                      value: '${totals['count']}',
                      valueColor: AppTheme.slate600,
                    ),
                  ],
                ),
              ),
              if (order.shareToken != null) ...[
                const SizedBox(height: AppTheme.spacing2),
                Row(
                  children: [
                    Icon(
                      Icons.link,
                      size: 14,
                      color: AppTheme.blue600,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      'Shared',
                      style: TextStyle(
                        fontSize: 12,
                        color: AppTheme.blue600,
                        fontFamily: AppTheme.fontFamily,
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Map<String, dynamic> _calculateTotals(dynamic order) {
    double totalPrice = 0;
    double totalProfit = 0;
    int count = 0;

    for (final print in order.printEntries) {
      final qty = print.qty;
      // Use priceItem if available (per item), otherwise price (which might be total)
      final unitPrice = getPrice(print);
      totalPrice += (unitPrice * qty);
      // profitTotal is already total, profit is per item - use getProfit which handles this
      totalProfit += getProfit(print);
      count += qty as int;
    }

    return {
      'price': totalPrice,
      'profit': totalProfit,
      'count': count,
    };
  }

  Color _getStatusColor(dynamic status) {
    switch (status.toString()) {
      case 'OrderStatus.quote':
        return AppTheme.blue600;
      case 'OrderStatus.inProduction':
        return AppTheme.orange600;
      case 'OrderStatus.ready':
        return AppTheme.green600;
      case 'OrderStatus.shipped':
        return AppTheme.slate600;
      default:
        return AppTheme.slate600;
    }
  }

  String _formatDate(DateTime? date) {
    if (date == null) return '';
    return '${date.day}/${date.month}/${date.year}';
  }

  String _formatCurrency(double amount) {
    return '\$${amount.toStringAsFixed(2)}';
  }
}

class _StatItem extends StatelessWidget {
  final String label;
  final String value;
  final Color valueColor;

  const _StatItem({
    required this.label,
    required this.value,
    required this.valueColor,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: valueColor,
            fontFamily: AppTheme.fontFamily,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: AppTheme.slate500,
            fontFamily: AppTheme.fontFamily,
          ),
        ),
      ],
    );
  }
}
