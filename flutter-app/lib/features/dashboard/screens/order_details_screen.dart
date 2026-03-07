import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/config/app_config.dart';
import '../../../core/router/app_router.dart';
import '../../../shared/models/order.dart';
import '../../../shared/models/print.dart';
import '../../../shared/theme/app_theme.dart';
import '../../../shared/widgets/common/error_banner.dart';
import '../../../shared/utils/print_utils.dart';
import 'package:dio/dio.dart';

class OrderDetailsScreen extends ConsumerStatefulWidget {
  final String orderId;

  const OrderDetailsScreen({
    super.key,
    required this.orderId,
  });

  @override
  ConsumerState<OrderDetailsScreen> createState() => _OrderDetailsScreenState();
}

class _OrderDetailsScreenState extends ConsumerState<OrderDetailsScreen> {
  Order? _order;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadOrder();
  }

  Future<void> _loadOrder() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final dio = ref.read(apiClientProvider);
      final response = await dio.get('${AppConfig.baseUrl}/orders/${widget.orderId}');
      
      if (response.statusCode == 200) {
        setState(() {
          _order = Order.fromJson(response.data as Map<String, dynamic>);
          _isLoading = false;
        });
      } else {
        setState(() {
          _error = 'Failed to load order';
          _isLoading = false;
        });
      }
    } on DioException catch (e) {
      setState(() {
        _error = e.response?.statusCode == 404
            ? 'Order not found'
            : 'Failed to load order: ${e.message}';
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Failed to load order: ${e.toString()}';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.slate50,
      appBar: AppBar(
        title: const Text(
          'Order Details',
          style: TextStyle(
            fontFamily: AppTheme.fontFamily,
            fontWeight: FontWeight.bold,
          ),
        ),
        backgroundColor: AppTheme.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            final router = ref.read(routerProvider);
            router.pop();
          },
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadOrder,
            tooltip: 'Refresh',
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: ErrorBanner(
                    message: _error!,
                    onDismiss: () {},
                  ),
                )
              : _order == null
                  ? const Center(child: Text('Order not found'))
                  : _buildOrderDetails(context),
    );
  }

  Widget _buildOrderDetails(BuildContext context) {
    final order = _order!;
    final totals = _calculateTotals(order);
    final statusColor = _getStatusColor(order.status);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(AppTheme.spacing4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Order Header Card
          Card(
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(AppTheme.radiusLg),
              side: BorderSide(color: AppTheme.slate200, width: 1),
            ),
            child: Padding(
              padding: const EdgeInsets.all(AppTheme.spacing5),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          order.title,
                          style: const TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.slate900,
                            fontFamily: AppTheme.fontFamily,
                          ),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: AppTheme.spacing3,
                          vertical: AppTheme.spacing2,
                        ),
                        decoration: BoxDecoration(
                          color: statusColor.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(AppTheme.radiusMd),
                          border: Border.all(color: statusColor.withValues(alpha: 0.3)),
                        ),
                        child: Text(
                          order.status.displayName,
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: statusColor,
                            fontFamily: AppTheme.fontFamily,
                          ),
                        ),
                      ),
                    ],
                  ),
                  if (order.customerName != null) ...[
                    const SizedBox(height: AppTheme.spacing3),
                    Row(
                      children: [
                        Icon(Icons.person, size: 18, color: AppTheme.slate500),
                        const SizedBox(width: AppTheme.spacing2),
                        Text(
                          order.customerName!,
                          style: TextStyle(
                            fontSize: 16,
                            color: AppTheme.slate700,
                            fontFamily: AppTheme.fontFamily,
                          ),
                        ),
                      ],
                    ),
                  ],
                  if (order.deadline != null) ...[
                    const SizedBox(height: AppTheme.spacing2),
                    Row(
                      children: [
                        Icon(Icons.calendar_today, size: 18, color: AppTheme.slate500),
                        const SizedBox(width: AppTheme.spacing2),
                        Text(
                          'Deadline: ${_formatDate(order.deadline!)}',
                          style: TextStyle(
                            fontSize: 14,
                            color: AppTheme.slate600,
                            fontFamily: AppTheme.fontFamily,
                          ),
                        ),
                      ],
                    ),
                  ],
                  if (order.notes != null && order.notes!.isNotEmpty) ...[
                    const SizedBox(height: AppTheme.spacing3),
                    Container(
                      padding: const EdgeInsets.all(AppTheme.spacing3),
                      decoration: BoxDecoration(
                        color: AppTheme.slate50,
                        borderRadius: BorderRadius.circular(AppTheme.radiusMd),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Notes',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.slate500,
                              fontFamily: AppTheme.fontFamily,
                            ),
                          ),
                          const SizedBox(height: AppTheme.spacing2),
                          Text(
                            order.notes!,
                            style: TextStyle(
                              fontSize: 14,
                              color: AppTheme.slate700,
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
          ),
          const SizedBox(height: AppTheme.spacing4),
          // Financial Summary
          Card(
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(AppTheme.radiusLg),
              side: BorderSide(color: AppTheme.slate200, width: 1),
            ),
            child: Padding(
              padding: const EdgeInsets.all(AppTheme.spacing5),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Financial Summary',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.slate900,
                      fontFamily: AppTheme.fontFamily,
                    ),
                  ),
                  const SizedBox(height: AppTheme.spacing4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _StatItem(
                        label: 'Total Price',
                        value: _formatCurrency(totals['price']),
                        valueColor: AppTheme.slate900,
                        icon: Icons.attach_money,
                      ),
                      _StatItem(
                        label: 'Total Profit',
                        value: _formatCurrency(totals['profit']),
                        valueColor: AppTheme.green600,
                        icon: Icons.trending_up,
                      ),
                      _StatItem(
                        label: 'Prints',
                        value: '${totals['count']}',
                        valueColor: AppTheme.blue600,
                        icon: Icons.print,
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: AppTheme.spacing4),
          // Prints List
          Text(
            'Prints (${order.printEntries.length})',
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AppTheme.slate900,
              fontFamily: AppTheme.fontFamily,
            ),
          ),
          const SizedBox(height: AppTheme.spacing3),
          if (order.printEntries.isEmpty)
            Card(
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(AppTheme.radiusLg),
                side: BorderSide(color: AppTheme.slate200, width: 1),
              ),
              child: Padding(
                padding: const EdgeInsets.all(AppTheme.spacing6),
                child: Center(
                  child: Column(
                    children: [
                      Icon(Icons.print_disabled, size: 48, color: AppTheme.slate400),
                      const SizedBox(height: AppTheme.spacing3),
                      Text(
                        'No prints in this order',
                        style: TextStyle(
                          fontSize: 16,
                          color: AppTheme.slate500,
                          fontFamily: AppTheme.fontFamily,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            )
          else
            ...order.printEntries.map((print) => _PrintCard(print: print)),
        ],
      ),
    );
  }

  Map<String, dynamic> _calculateTotals(Order order) {
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
      count += qty;
    }

    return {
      'price': totalPrice,
      'profit': totalProfit,
      'count': count,
    };
  }

  Color _getStatusColor(OrderStatus status) {
    switch (status) {
      case OrderStatus.quote:
        return AppTheme.blue600;
      case OrderStatus.inProduction:
        return AppTheme.orange600;
      case OrderStatus.ready:
        return AppTheme.green600;
      case OrderStatus.shipped:
        return AppTheme.slate600;
    }
  }

  String _formatDate(DateTime date) {
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
  final IconData icon;

  const _StatItem({
    required this.label,
    required this.value,
    required this.valueColor,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Icon(icon, color: valueColor, size: 24),
        const SizedBox(height: AppTheme.spacing2),
        Text(
          value,
          style: TextStyle(
            fontSize: 20,
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

class _PrintCard extends StatelessWidget {
  final Print print;

  const _PrintCard({required this.print});

  @override
  Widget build(BuildContext context) {
    final profit = getProfit(print);
    final price = getPrice(print);
    final cost = getCost(print);

    return Card(
      margin: const EdgeInsets.only(bottom: AppTheme.spacing3),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppTheme.radiusLg),
        side: BorderSide(color: AppTheme.slate200, width: 1),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AppTheme.spacing4),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
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
                      _InfoItem(label: 'Weight', value: '${print.weight}g'),
                      _InfoItem(label: 'Time', value: '${print.timeH}h ${print.timeM}m'),
                    ],
                  ),
                  const SizedBox(height: AppTheme.spacing2),
                  const Divider(height: 1),
                  const SizedBox(height: AppTheme.spacing2),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _InfoItem(
                        label: 'Price',
                        value: _formatCurrency(price * print.qty),
                        valueColor: AppTheme.slate900,
                      ),
                      _InfoItem(
                        label: 'Cost',
                        value: _formatCurrency(cost * print.qty),
                        valueColor: AppTheme.slate600,
                      ),
                      _InfoItem(
                        label: 'Profit',
                        value: _formatCurrency(profit), // profitTotal is already total, don't multiply by qty
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
    );
  }

  String _formatCurrency(double amount) {
    return '\$${amount.toStringAsFixed(2)}';
  }
}

class _InfoItem extends StatelessWidget {
  final String label;
  final String value;
  final Color? valueColor;

  const _InfoItem({
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
