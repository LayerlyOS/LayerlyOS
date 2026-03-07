import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/router/app_router.dart';
import '../../../shared/models/print.dart';
import '../../../shared/theme/app_theme.dart';
import '../../../shared/utils/print_utils.dart';
import '../../../shared/widgets/common/error_banner.dart';
import '../services/prints_service.dart';
import 'print_advanced_details_modal.dart';

class PrintDetailsScreen extends ConsumerStatefulWidget {
  final String printId;

  const PrintDetailsScreen({
    super.key,
    required this.printId,
  });

  @override
  ConsumerState<PrintDetailsScreen> createState() => _PrintDetailsScreenState();
}

class _PrintDetailsScreenState extends ConsumerState<PrintDetailsScreen> {
  Print? _print;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadPrint();
  }

  Future<void> _loadPrint() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final service = ref.read(printsServiceProvider);
      final print = await service.getPrintById(widget.printId);
      setState(() {
        _print = print;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
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
          'Print Details',
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
            onPressed: _loadPrint,
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
              : _print == null
                  ? const Center(child: Text('Print not found'))
                  : _buildPrintDetails(context),
    );
  }

  Widget _buildPrintDetails(BuildContext context) {
    final print = _print!;
    final price = getPrice(print);
    final profit = getProfit(print);
    final cost = getCost(print);
    final totalWeight = print.weight * print.qty;
    final totalWeightDisplay = totalWeight >= 1000
        ? '${(totalWeight / 1000).toStringAsFixed(2)} kg'
        : '${totalWeight.toStringAsFixed(2)} g';
    final totalTime = (print.timeH * 60 + print.timeM) * print.qty;
    final totalTimeH = totalTime ~/ 60;
    final totalTimeM = totalTime % 60;
    final profitPercentage = price > 0 ? (profit / (price * print.qty)) * 100 : 0;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(AppTheme.spacing4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Card
          Card(
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(AppTheme.radiusLg),
              side: BorderSide(color: AppTheme.slate200, width: 1),
            ),
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    AppTheme.indigo600,
                    AppTheme.purple600,
                    AppTheme.slate900,
                  ],
                ),
                borderRadius: BorderRadius.circular(AppTheme.radiusLg),
              ),
              padding: const EdgeInsets.all(AppTheme.spacing5),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(AppTheme.spacing3),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(AppTheme.radiusMd),
                        ),
                        child: const Icon(
                          Icons.layers,
                          color: Colors.white,
                          size: 24,
                        ),
                      ),
                      const SizedBox(width: AppTheme.spacing3),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              print.name,
                              style: const TextStyle(
                                fontSize: 24,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                                fontFamily: AppTheme.fontFamily,
                              ),
                            ),
                            const SizedBox(height: AppTheme.spacing2),
                            Row(
                              children: [
                                Icon(Icons.access_time, size: 16, color: Colors.white70),
                                const SizedBox(width: 4),
                                Text(
                                  _formatDate(print.date),
                                  style: TextStyle(
                                    fontSize: 14,
                                    color: Colors.white70,
                                    fontFamily: AppTheme.fontFamily,
                                  ),
                                ),
                                const SizedBox(width: AppTheme.spacing3),
                                Icon(Icons.inventory_2, size: 16, color: Colors.white70),
                                const SizedBox(width: 4),
                                Text(
                                  '${print.qty} pcs',
                                  style: TextStyle(
                                    fontSize: 14,
                                    color: Colors.white70,
                                    fontFamily: AppTheme.fontFamily,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: AppTheme.spacing4),
                  // Profit banner – subtler, matches purple background
                  Container(
                    padding: const EdgeInsets.all(AppTheme.spacing4),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(AppTheme.radiusMd),
                      border: Border.all(
                        color: Colors.white.withValues(alpha: 0.2),
                        width: 1,
                      ),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Total Profit',
                              style: TextStyle(
                                fontSize: 14,
                                color: Colors.white70,
                                fontFamily: AppTheme.fontFamily,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              _formatCurrency(profit),
                              style: TextStyle(
                                fontSize: 28,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                                fontFamily: AppTheme.fontFamily,
                              ),
                            ),
                          ],
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(
                              '${profitPercentage.toStringAsFixed(1)}%',
                              style: TextStyle(
                                fontSize: 24,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                                fontFamily: AppTheme.fontFamily,
                              ),
                            ),
                            Text(
                              'Margin',
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.white70,
                                fontFamily: AppTheme.fontFamily,
                              ),
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
          const SizedBox(height: AppTheme.spacing4),
          // Quick Stats Grid
          Row(
            children: [
              Expanded(
                child: _QuickStatCard(
                  icon: Icons.access_time,
                  label: 'Time per item',
                  value: '${print.timeH}h ${print.timeM}m',
                  color: AppTheme.blue600,
                ),
              ),
              const SizedBox(width: AppTheme.spacing3),
              Expanded(
                child: _QuickStatCard(
                  icon: Icons.access_time,
                  label: 'Total time',
                  value: '${totalTimeH}h ${totalTimeM}m',
                  color: AppTheme.purple600,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppTheme.spacing3),
          Row(
            children: [
              Expanded(
                child: _QuickStatCard(
                  icon: Icons.scale,
                  label: 'Weight per item',
                  value: '${print.weight.toStringAsFixed(2)} g',
                  color: AppTheme.orange600,
                ),
              ),
              const SizedBox(width: AppTheme.spacing3),
              Expanded(
                child: _QuickStatCard(
                  icon: Icons.scale,
                  label: 'Total weight',
                  value: totalWeightDisplay,
                  color: AppTheme.teal600,
                ),
              ),
            ],
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
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
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
                      TextButton.icon(
                        onPressed: () {
                          showDialog(
                            context: context,
                            builder: (context) => PrintAdvancedDetailsModal(
                              print: print,
                            ),
                          );
                        },
                        icon: const Icon(Icons.info_outline, size: 16),
                        label: const Text('Advanced Details'),
                        style: TextButton.styleFrom(
                          foregroundColor: AppTheme.blue600,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: AppTheme.spacing4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _StatCard(
                        icon: Icons.attach_money,
                        label: 'Total Price',
                        value: _formatCurrency(price * print.qty),
                        color: AppTheme.blue600,
                      ),
                      _StatCard(
                        icon: Icons.trending_down,
                        label: 'Total Cost',
                        value: _formatCurrency(cost * print.qty),
                        color: AppTheme.slate600,
                      ),
                      _StatCard(
                        icon: Icons.trending_up,
                        label: 'Total Profit',
                        value: _formatCurrency(profit),
                        color: AppTheme.green600,
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: AppTheme.spacing4),
          // Print Information (combined Equipment & Material)
          _PrintInfoCard(print: print),
          const SizedBox(height: AppTheme.spacing4),
          // Print Details
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
                    'Print Details',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.slate900,
                      fontFamily: AppTheme.fontFamily,
                    ),
                  ),
                  const SizedBox(height: AppTheme.spacing4),
                  _DetailRow(
                    icon: Icons.scale,
                    label: 'Weight',
                    value: '${print.weight}g per item',
                    subValue: '$totalWeightDisplay total',
                  ),
                  const SizedBox(height: AppTheme.spacing3),
                  Container(
                    height: 1,
                    color: AppTheme.slate200,
                  ),
                  const SizedBox(height: AppTheme.spacing3),
                  _DetailRow(
                    icon: Icons.access_time,
                    label: 'Time',
                    value: '${print.timeH}h ${print.timeM}m per item',
                    subValue: '${totalTimeH}h ${totalTimeM}m total',
                  ),
                  if (print.brand != null || print.color != null) ...[
                    const SizedBox(height: AppTheme.spacing3),
                    Container(
                      height: 1,
                      color: AppTheme.slate200,
                    ),
                    const SizedBox(height: AppTheme.spacing3),
                    _DetailRow(
                      icon: Icons.palette,
                      label: 'Filament',
                      value: '${print.brand ?? 'N/A'} • ${print.color ?? 'N/A'}',
                    ),
                  ],
                  if (print.extraCost != null && print.extraCost! > 0) ...[
                    const SizedBox(height: AppTheme.spacing3),
                    Container(
                      height: 1,
                      color: AppTheme.slate200,
                    ),
                    const SizedBox(height: AppTheme.spacing3),
                    _DetailRow(
                      icon: Icons.add_circle,
                      label: 'Extra Cost',
                      value: _formatCurrency(print.extraCost!),
                    ),
                  ],
                  if (print.manualPrice != null && print.manualPrice! > 0) ...[
                    const SizedBox(height: AppTheme.spacing3),
                    Container(
                      height: 1,
                      color: AppTheme.slate200,
                    ),
                    const SizedBox(height: AppTheme.spacing3),
                    _DetailRow(
                      icon: Icons.edit,
                      label: 'Manual Price',
                      value: _formatCurrency(print.manualPrice!),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
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

class _StatCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;

  const _StatCard({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Icon(icon, color: color, size: 28),
        const SizedBox(height: AppTheme.spacing2),
        Text(
          value,
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: color,
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

class _DetailRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final String? subValue;

  const _DetailRow({
    required this.icon,
    required this.label,
    required this.value,
    this.subValue,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppTheme.spacing2),
      child: Row(
        children: [
          Icon(icon, size: 20, color: AppTheme.slate600),
          const SizedBox(width: AppTheme.spacing3),
          Expanded(
            child: Column(
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
                    color: AppTheme.slate900,
                    fontFamily: AppTheme.fontFamily,
                  ),
                ),
                if (subValue != null) ...[
                  const SizedBox(height: 2),
                  Text(
                    subValue!,
                    style: TextStyle(
                      fontSize: 14,
                      color: AppTheme.slate600,
                      fontFamily: AppTheme.fontFamily,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _QuickStatCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;

  const _QuickStatCard({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
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
              children: [
                Container(
                  padding: const EdgeInsets.all(AppTheme.spacing2),
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(AppTheme.radiusSm),
                  ),
                  child: Icon(icon, size: 18, color: color),
                ),
                const SizedBox(width: AppTheme.spacing2),
                Expanded(
                  child: Text(
                    label,
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.slate500,
                      fontFamily: AppTheme.fontFamily,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppTheme.spacing2),
            Text(
              value,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: color,
                fontFamily: AppTheme.fontFamily,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PrintInfoCard extends StatelessWidget {
  final Print print;

  const _PrintInfoCard({required this.print});

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppTheme.radiusLg),
        side: BorderSide(color: AppTheme.slate200, width: 1),
      ),
      child: Container(
        decoration: BoxDecoration(
          color: AppTheme.white,
          borderRadius: BorderRadius.circular(AppTheme.radiusLg),
        ),
        padding: const EdgeInsets.all(AppTheme.spacing5),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(AppTheme.spacing2),
                  decoration: BoxDecoration(
                    color: AppTheme.blue500.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(AppTheme.radiusSm),
                  ),
                  child: const Icon(Icons.info_outline, size: 18, color: AppTheme.blue700),
                ),
                const SizedBox(width: AppTheme.spacing2),
                const Text(
                  'Print Information',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.slate900,
                    fontFamily: AppTheme.fontFamily,
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppTheme.spacing5),
            // Printer & Order
            _InfoRow(
              icon: Icons.print,
              label: 'Printer',
              value: print.printer?['name'] as String? ?? (print.printerId.isNotEmpty ? print.printerId : '—'),
            ),
            if (print.orderId != null || print.order != null) ...[
              const SizedBox(height: AppTheme.spacing3),
              _InfoRow(
                icon: Icons.receipt_long,
                label: 'Order',
                value: print.order?['title'] as String? ?? print.orderId ?? '—',
              ),
            ],
            // Material Information
            if (print.brand != null || print.color != null) ...[
              const SizedBox(height: AppTheme.spacing5),
              Container(
                height: 1,
                color: AppTheme.slate200,
              ),
              const SizedBox(height: AppTheme.spacing5),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(AppTheme.spacing2),
                    decoration: BoxDecoration(
                      color: AppTheme.orange600.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(AppTheme.radiusSm),
                    ),
                    child: const Icon(Icons.layers, size: 18, color: AppTheme.orange700),
                  ),
                  const SizedBox(width: AppTheme.spacing2),
                  const Text(
                    'Material',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.slate700,
                      fontFamily: AppTheme.fontFamily,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AppTheme.spacing4),
              _InfoRow(
                icon: Icons.palette,
                label: 'Filament',
                value: '${print.brand ?? 'N/A'} • ${print.color ?? 'N/A'}',
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _InfoRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(
          child: Row(
            children: [
              Icon(icon, size: 16, color: AppTheme.slate600),
              const SizedBox(width: AppTheme.spacing2),
              Flexible(
                child: Text(
                  label,
                  style: TextStyle(
                    fontSize: 14,
                    color: AppTheme.slate600,
                    fontFamily: AppTheme.fontFamily,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ),
        Flexible(
          child: Text(
            value,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: AppTheme.slate900,
              fontFamily: AppTheme.fontFamily,
            ),
            textAlign: TextAlign.end,
            overflow: TextOverflow.ellipsis,
            maxLines: 2,
          ),
        ),
      ],
    );
  }
}
