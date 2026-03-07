import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../shared/models/print.dart';
import '../../../shared/theme/app_theme.dart';
import '../../../shared/utils/print_utils.dart';
import '../providers/settings_provider.dart';

class PrintAdvancedDetailsModal extends ConsumerWidget {
  final Print print;

  const PrintAdvancedDetailsModal({
    super.key,
    required this.print,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settingsAsync = ref.watch(settingsProvider);
    final settings = settingsAsync.valueOrNull;
    
    final price = getPrice(print);
    final profit = getProfit(print);
    final cost = getCost(print);
    final pricePerItem = print.priceItem ?? (price / print.qty);
    final costPerItem = print.costItem ?? (cost / print.qty);
    final profitPerItem = profit / print.qty;
    
    // Calculate energy costs
    final printerPower = print.printer?['power'] as num? ?? 0;
    final powerW = printerPower.toDouble();
    final energyRate = settings?.energyRate ?? 0.0;
    final energyCostPerHour = (powerW / 1000) * energyRate;
    final totalHoursPerItem = print.timeH + print.timeM / 60.0;
    final energyCostPerItem = energyCostPerHour * totalHoursPerItem;
    final energyCostTotal = energyCostPerItem * print.qty;
    
    // Material costs
    final filament = print.filament;
    final materialCostPerItem = filament != null && filament['spoolWeight'] != null && filament['spoolPrice'] != null
        ? (filament['spoolPrice'] as num).toDouble() / (filament['spoolWeight'] as num).toDouble() * print.weight
        : null;
    final materialCostTotal = materialCostPerItem != null ? materialCostPerItem * print.qty : null;
    
    // Advanced costs
    final advancedSettings = print.advancedSettings;
    final hasAdvanced = advancedSettings != null && advancedSettings.isNotEmpty;
    
    double? depreciationPerItem;
    double? riskPerItem;
    double? laborPerItem;
    double? logisticsPerItem;
    
    if (hasAdvanced) {
      depreciationPerItem = (advancedSettings['depreciationCost'] as num?)?.toDouble();
      riskPerItem = (advancedSettings['riskCost'] as num?)?.toDouble();
      laborPerItem = (advancedSettings['laborCost'] as num?)?.toDouble();
      logisticsPerItem = (advancedSettings['logisticsCost'] as num?)?.toDouble();
    }
    
    final extraCostPerItem = print.extraCost ?? 0.0;
    final extraCostTotal = extraCostPerItem * print.qty;
    
    // Amortization cost (if material cost is null)
    final amortCostPerItem = materialCostPerItem == null
        ? null
        : costPerItem - (materialCostPerItem + energyCostPerItem + extraCostPerItem);
    final amortCostTotal = amortCostPerItem != null ? amortCostPerItem * print.qty : null;

    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.all(AppTheme.spacing4),
      child: Container(
        constraints: BoxConstraints(
          maxHeight: MediaQuery.of(context).size.height * 0.9,
          maxWidth: 800,
        ),
        decoration: BoxDecoration(
          color: AppTheme.white,
          borderRadius: BorderRadius.circular(AppTheme.radiusXl * 1.5),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.2),
              blurRadius: 30,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header
            Container(
              padding: const EdgeInsets.all(AppTheme.spacing6),
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
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(AppTheme.radiusXl * 1.5),
                  topRight: Radius.circular(AppTheme.radiusXl * 1.5),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Advanced Details',
                          style: TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                            fontFamily: AppTheme.fontFamily,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          print.name,
                          style: TextStyle(
                            fontSize: 15,
                            color: Colors.white.withValues(alpha: 0.9),
                            fontFamily: AppTheme.fontFamily,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white, size: 24),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ],
              ),
            ),
            // Content
            Flexible(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(AppTheme.spacing6),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Print Information & Material (combined)
                    _PrintInfoCard(
                      print: print,
                      filament: filament,
                      powerW: powerW,
                      energyRate: energyRate,
                      energyCostPerHour: energyCostPerHour,
                    ),
                    const SizedBox(height: AppTheme.spacing5),
                    // Costs & Profits Breakdown
                    _SectionTitle('Costs & Profits Breakdown'),
                    const SizedBox(height: AppTheme.spacing5),
                    Column(
                      children: [
                        _CostsCard(
                          title: 'Per Item',
                          items: [
                            if (materialCostPerItem != null)
                              _CostItem('Material', _formatCurrency(materialCostPerItem), icon: Icons.layers),
                            _CostItem('Energy', _formatCurrency(energyCostPerItem), icon: Icons.bolt),
                            if (hasAdvanced && depreciationPerItem != null)
                              _CostItem('Depreciation', _formatCurrency(depreciationPerItem), icon: Icons.settings),
                            if (hasAdvanced && riskPerItem != null)
                              _CostItem('Risk', _formatCurrency(riskPerItem), icon: Icons.warning),
                            if (hasAdvanced && laborPerItem != null)
                              _CostItem('Labor (Amort.)', _formatCurrency(laborPerItem), icon: Icons.person),
                            if (hasAdvanced && logisticsPerItem != null)
                              _CostItem('Logistics (Amort.)', _formatCurrency(logisticsPerItem), icon: Icons.local_shipping),
                            if (extraCostPerItem > 0)
                              _CostItem('Extra', _formatCurrency(extraCostPerItem), icon: Icons.add),
                            if (amortCostPerItem != null && !hasAdvanced)
                              _CostItem('Depreciation', _formatCurrency(amortCostPerItem), icon: Icons.settings),
                            _CostItem('Total Cost', _formatCurrency(costPerItem), isTotal: true, icon: Icons.account_balance_wallet),
                            _CostItem('Price', _formatCurrency(pricePerItem), icon: Icons.attach_money),
                            _CostItem('Profit', _formatCurrency(profitPerItem), isProfit: true),
                          ],
                        ),
                        const SizedBox(height: AppTheme.spacing5),
                        _CostsCard(
                          title: 'Total (x${print.qty})',
                          items: [
                            if (materialCostTotal != null)
                              _CostItem('Material', _formatCurrency(materialCostTotal), icon: Icons.layers),
                            _CostItem('Energy', _formatCurrency(energyCostTotal), icon: Icons.bolt),
                            if (hasAdvanced && depreciationPerItem != null)
                              _CostItem('Depreciation', _formatCurrency(depreciationPerItem * print.qty), icon: Icons.settings),
                            if (hasAdvanced && riskPerItem != null)
                              _CostItem('Risk', _formatCurrency(riskPerItem * print.qty), icon: Icons.warning),
                            if (hasAdvanced && laborPerItem != null)
                              _CostItem('Labor', _formatCurrency(laborPerItem * print.qty), icon: Icons.person),
                            if (hasAdvanced && logisticsPerItem != null)
                              _CostItem('Logistics', _formatCurrency(logisticsPerItem * print.qty), icon: Icons.local_shipping),
                            if (extraCostTotal > 0)
                              _CostItem('Extra', _formatCurrency(extraCostTotal), icon: Icons.add),
                            if (amortCostTotal != null && !hasAdvanced)
                              _CostItem('Depreciation Total', _formatCurrency(amortCostTotal), icon: Icons.settings),
                            _CostItem('Total Cost', _formatCurrency(cost), isTotal: true, icon: Icons.account_balance_wallet),
                            _CostItem('Total Price', _formatCurrency(price), icon: Icons.attach_money),
                            _CostItem('Total Profit', _formatCurrency(profit), isProfit: true),
                          ],
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            // Footer
            Container(
              padding: const EdgeInsets.all(AppTheme.spacing4),
              decoration: BoxDecoration(
                color: AppTheme.slate50,
                borderRadius: const BorderRadius.only(
                  bottomLeft: Radius.circular(AppTheme.radiusXl * 1.5),
                  bottomRight: Radius.circular(AppTheme.radiusXl * 1.5),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  TextButton(
                    onPressed: () => Navigator.of(context).pop(),
                    style: TextButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: AppTheme.spacing5, vertical: AppTheme.spacing3),
                    ),
                    child: const Text(
                      'Close',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        fontFamily: AppTheme.fontFamily,
                      ),
                    ),
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

class _SectionTitle extends StatelessWidget {
  final String title;

  const _SectionTitle(this.title);

  @override
  Widget build(BuildContext context) {
    return Text(
      title,
      style: const TextStyle(
        fontSize: 18,
        fontWeight: FontWeight.bold,
        color: AppTheme.slate900,
        fontFamily: AppTheme.fontFamily,
      ),
    );
  }
}

class _PrintInfoCard extends StatelessWidget {
  final Print print;
  final Map<String, dynamic>? filament;
  final double powerW;
  final double energyRate;
  final double energyCostPerHour;

  const _PrintInfoCard({
    required this.print,
    required this.filament,
    required this.powerW,
    required this.energyRate,
    required this.energyCostPerHour,
  });

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
        padding: const EdgeInsets.all(AppTheme.spacing4),
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
            const SizedBox(height: AppTheme.spacing5),
            // Energy Information
            _InfoRow(
              icon: Icons.bolt,
              label: 'Power consumption',
              value: '${powerW.toStringAsFixed(0)} W',
            ),
            const SizedBox(height: AppTheme.spacing3),
            _InfoRow(
              icon: Icons.attach_money,
              label: 'Energy rate',
              value: '\$${energyRate.toStringAsFixed(2)} / kWh',
            ),
            const SizedBox(height: AppTheme.spacing3),
            _InfoRow(
              icon: Icons.bolt,
              label: 'Energy cost / h',
              value: _formatCurrency(energyCostPerHour),
            ),
            // Material Information
            if (filament != null) ...[
              const SizedBox(height: AppTheme.spacing5),
              Divider(height: 1, color: AppTheme.slate200),
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
                value: '${filament!['brand'] ?? 'N/A'} ${filament!['materialName'] ?? 'N/A'}',
              ),
              if (filament!['color'] != null) ...[
                const SizedBox(height: AppTheme.spacing3),
                _InfoRow(
                  icon: Icons.color_lens,
                  label: 'Color',
                  value: filament!['color'] as String,
                ),
              ],
              const SizedBox(height: AppTheme.spacing3),
              _InfoRow(
                icon: Icons.attach_money,
                label: 'Spool price',
                value: _formatCurrency((filament!['spoolPrice'] as num?)?.toDouble() ?? 0.0),
              ),
              const SizedBox(height: AppTheme.spacing3),
              _InfoRow(
                icon: Icons.scale,
                label: 'Spool weight',
                value: '${((filament!['spoolWeight'] as num?)?.toDouble() ?? 0.0).toStringAsFixed(0)} g',
              ),
            ],
          ],
        ),
      ),
    );
  }

  String _formatCurrency(double amount) {
    return '\$${amount.toStringAsFixed(2)}';
  }
}

class _CostsCard extends StatelessWidget {
  final String title;
  final List<_CostItem> items;

  const _CostsCard({
    required this.title,
    required this.items,
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
        padding: const EdgeInsets.all(AppTheme.spacing5),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.account_balance_wallet, size: 16, color: AppTheme.slate500),
                const SizedBox(width: AppTheme.spacing2),
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.slate500,
                    fontFamily: AppTheme.fontFamily,
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppTheme.spacing4),
            ...items.map((item) {
              final isLast = items.last == item;
              return Padding(
                padding: EdgeInsets.only(bottom: isLast ? 0 : AppTheme.spacing3),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Row(
                            children: [
                              if (item.icon != null) ...[
                                Icon(item.icon, size: 16, color: AppTheme.slate400),
                                const SizedBox(width: AppTheme.spacing2),
                              ],
                              Flexible(
                                child: Text(
                                  item.label,
                                  style: TextStyle(
                                    fontSize: item.isTotal ? 15 : 14,
                                    fontWeight: item.isTotal ? FontWeight.bold : FontWeight.normal,
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
                            item.value,
                            style: TextStyle(
                              fontSize: item.isTotal ? 16 : 14,
                              fontWeight: FontWeight.bold,
                              color: item.isProfit
                                  ? (item.value.startsWith('-') ? AppTheme.red600 : AppTheme.green600)
                                  : (item.isTotal ? AppTheme.slate900 : AppTheme.slate700),
                              fontFamily: AppTheme.fontFamily,
                            ),
                            textAlign: TextAlign.end,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                    if (item.isTotal && !isLast)
                      Divider(
                        height: AppTheme.spacing4,
                        thickness: 1,
                        color: AppTheme.slate200,
                      ),
                  ],
                ),
              );
            }),
          ],
        ),
      ),
    );
  }
}

class _CostItem {
  final String label;
  final String value;
  final bool isProfit;
  final bool isTotal;
  final IconData? icon;

  _CostItem(this.label, this.value, {this.isProfit = false, this.isTotal = false, this.icon});
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
