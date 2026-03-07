import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/router/app_router.dart';
import '../../../shared/models/print.dart';
import '../../../shared/providers/auth_provider.dart';
import '../../../shared/theme/app_theme.dart';
import '../../../shared/utils/print_utils.dart';
import '../../../shared/widgets/common/error_banner.dart';
import '../providers/prints_provider.dart';

class DashboardTab extends ConsumerWidget {
  const DashboardTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final printsState = ref.watch(printsProvider);

    if (printsState.isLoading) {
      return const Center(
        child: CircularProgressIndicator(),
      );
    }

    if (printsState.error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(AppTheme.spacing6),
          child: ErrorBanner(
            message: printsState.error!,
            onDismiss: () {
              ref.read(printsProvider.notifier).loadPrints();
            },
          ),
        ),
      );
    }

    // Sort prints by date (newest first)
    final sortedPrints = List<Print>.from(printsState.prints)
      ..sort((a, b) => b.date.compareTo(a.date));
    
    // Calculate statistics - matching web app logic
    // profitTotal is already total profit, or profit is per item
    // totalCost is per item, need to multiply by qty
    // priceItem is per item, or price is total
    
    final totalPrints = sortedPrints.length; // Count of print entries, not qty
    final totalProfit = sortedPrints.fold<double>(0, (sum, p) => sum + getProfit(p));
    
    // For revenue and cost, we need to handle per-item vs total
    // Following web app logic from DashboardCharts.tsx:
    // unitCost = item.totalCost (per item)
    // totalCost = unitCost * qty
    // revenue = totalCost + profit (profit is already total)
    final totalCost = sortedPrints.fold<double>(0, (sum, p) {
      final unitCost = getCost(p);
      return sum + (unitCost * p.qty);
    });
    final totalRevenue = totalCost + totalProfit;
    final avgProfit = totalPrints > 0 ? totalProfit / totalPrints : 0.0;
    
    // Recent prints (last 5 - newest first)
    final recentPrints = sortedPrints.length > 5 
        ? sortedPrints.sublist(0, 5) 
        : sortedPrints;
    
    // Monthly stats - matching web app logic
    final now = DateTime.now();
    final thisMonthPrints = sortedPrints.where((p) {
      return p.date.year == now.year && p.date.month == now.month;
    }).toList();
    
    final monthlyProfit = thisMonthPrints.fold<double>(0, (sum, p) => sum + getProfit(p));
    final monthlyCost = thisMonthPrints.fold<double>(0, (sum, p) {
      final unitCost = getCost(p);
      return sum + (unitCost * p.qty);
    });
    final monthlyRevenue = monthlyCost + monthlyProfit;

    return RefreshIndicator(
      onRefresh: () => ref.read(printsProvider.notifier).loadPrints(),
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(AppTheme.spacing4),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Welcome Header
            _WelcomeHeader(),
            const SizedBox(height: AppTheme.spacing6),
            
            // Stats Cards Grid
            _StatsGrid(
              totalPrints: totalPrints,
              totalRevenue: totalRevenue,
              totalCost: totalCost,
              totalProfit: totalProfit,
              monthlyRevenue: monthlyRevenue,
              monthlyProfit: monthlyProfit,
              avgProfit: avgProfit,
            ),
            const SizedBox(height: AppTheme.spacing6),
            
            // Recent Activity
            if (recentPrints.isNotEmpty) ...[
              _SectionHeader(
                title: 'Recent Activity',
                icon: Icons.history,
                action: InkWell(
                  onTap: () {
                    final router = ref.read(routerProvider);
                    router.push('/prints');
                  },
                  borderRadius: BorderRadius.circular(AppTheme.radiusSm),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppTheme.spacing2,
                      vertical: AppTheme.spacing1,
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          'View All',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.blue600,
                            fontFamily: AppTheme.fontFamily,
                          ),
                        ),
                        const SizedBox(width: 4),
                        Icon(
                          Icons.arrow_forward_ios,
                          size: 12,
                          color: AppTheme.blue600,
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(height: AppTheme.spacing4),
              ...recentPrints.map((print) => _CompactPrintCard(print: print)),
            ] else ...[
              _EmptyState(),
            ],
          ],
        ),
      ),
    );
  }
}

class _WelcomeHeader extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;
    
    return Container(
      padding: const EdgeInsets.all(AppTheme.spacing6),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppTheme.blue600,
            AppTheme.blue700,
          ],
        ),
        borderRadius: BorderRadius.circular(AppTheme.radiusXl),
        boxShadow: [
          BoxShadow(
            color: AppTheme.blue600.withValues(alpha: 0.3),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Welcome back,',
                  style: TextStyle(
                    fontSize: 16,
                    color: Colors.white.withValues(alpha: 0.9),
                    fontFamily: AppTheme.fontFamily,
                  ),
                ),
                const SizedBox(height: AppTheme.spacing1),
                Text(
                  user?.name ?? 'User',
                  style: const TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                    fontFamily: AppTheme.fontFamily,
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.all(AppTheme.spacing3),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(AppTheme.radiusLg),
            ),
            child: const Icon(
              Icons.dashboard,
              color: Colors.white,
              size: 32,
            ),
          ),
        ],
      ),
    );
  }
}

class _StatsGrid extends StatelessWidget {
  final int totalPrints;
  final double totalRevenue;
  final double totalCost;
  final double totalProfit;
  final double monthlyRevenue;
  final double monthlyProfit;
  final double avgProfit;

  const _StatsGrid({
    required this.totalPrints,
    required this.totalRevenue,
    required this.totalCost,
    required this.totalProfit,
    required this.monthlyRevenue,
    required this.monthlyProfit,
    required this.avgProfit,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _StatCard(
                title: 'Total Prints',
                value: totalPrints.toString(),
                icon: Icons.print,
                color: AppTheme.blue600,
              ),
            ),
            const SizedBox(width: AppTheme.spacing4),
            Expanded(
              child: _StatCard(
                title: 'Total Revenue',
                value: '\$${totalRevenue.toStringAsFixed(2)}',
                icon: Icons.attach_money,
                color: AppTheme.green600,
              ),
            ),
          ],
        ),
        const SizedBox(height: AppTheme.spacing4),
        Row(
          children: [
            Expanded(
              child: _StatCard(
                title: 'Total Profit',
                value: '\$${totalProfit.toStringAsFixed(2)}',
                icon: Icons.trending_up,
                color: totalProfit >= 0 ? AppTheme.green600 : AppTheme.red600,
              ),
            ),
            const SizedBox(width: AppTheme.spacing4),
            Expanded(
              child: _StatCard(
                title: 'Avg Profit',
                value: '\$${avgProfit.toStringAsFixed(2)}',
                icon: Icons.analytics,
                color: AppTheme.blue500,
              ),
            ),
          ],
        ),
        const SizedBox(height: AppTheme.spacing4),
        Row(
          children: [
            Expanded(
              child: _StatCard(
                title: 'This Month',
                value: '\$${monthlyRevenue.toStringAsFixed(2)}',
                icon: Icons.calendar_today,
                color: AppTheme.slate600,
                subtitle: 'Revenue',
              ),
            ),
            const SizedBox(width: AppTheme.spacing4),
            Expanded(
              child: _StatCard(
                title: 'This Month',
                value: '\$${monthlyProfit.toStringAsFixed(2)}',
                icon: Icons.monetization_on,
                color: monthlyProfit >= 0 ? AppTheme.green600 : AppTheme.red600,
                subtitle: 'Profit',
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color color;
  final String? subtitle;

  const _StatCard({
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
    this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppTheme.spacing5),
      decoration: BoxDecoration(
        color: AppTheme.white,
        borderRadius: BorderRadius.circular(AppTheme.radiusLg),
        border: Border.all(color: AppTheme.slate200),
        boxShadow: [
          BoxShadow(
            color: AppTheme.slate200.withValues(alpha: 0.3),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(AppTheme.spacing2),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(AppTheme.radiusSm),
            ),
            child: Icon(
              icon,
              color: color,
              size: 20,
            ),
          ),
          const SizedBox(height: AppTheme.spacing3),
          Text(
            value,
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: AppTheme.slate900,
              fontFamily: AppTheme.fontFamily,
            ),
          ),
          const SizedBox(height: AppTheme.spacing1),
          Text(
            subtitle != null ? '$title - $subtitle' : title,
            style: TextStyle(
              fontSize: 12,
              color: AppTheme.slate500,
              fontFamily: AppTheme.fontFamily,
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  final IconData icon;
  final Widget? action;

  const _SectionHeader({
    required this.title,
    required this.icon,
    this.action,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            Icon(
              icon,
              color: AppTheme.blue600,
              size: 20,
            ),
            const SizedBox(width: AppTheme.spacing2),
            Text(
              title,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppTheme.slate900,
                fontFamily: AppTheme.fontFamily,
              ),
            ),
          ],
        ),
        ?action,
      ],
    );
  }
}

class _CompactPrintCard extends ConsumerWidget {
  final Print print;

  const _CompactPrintCard({required this.print});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Card(
      margin: const EdgeInsets.only(bottom: AppTheme.spacing3),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppTheme.radiusLg),
        side: const BorderSide(color: AppTheme.slate200),
      ),
      child: InkWell(
        onTap: () {
          final router = ref.read(routerProvider);
          router.push('/prints/${print.id}');
        },
        borderRadius: BorderRadius.circular(AppTheme.radiusLg),
        child: Padding(
        padding: const EdgeInsets.all(AppTheme.spacing4),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: getProfit(print) >= 0 ? AppTheme.green50 : AppTheme.red50,
                borderRadius: BorderRadius.circular(AppTheme.radiusMd),
              ),
              child: Icon(
                getProfit(print) >= 0 ? Icons.trending_up : Icons.trending_down,
                color: getProfit(print) >= 0 ? AppTheme.green600 : AppTheme.red600,
              ),
            ),
            const SizedBox(width: AppTheme.spacing4),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    print.name,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.slate900,
                      fontFamily: AppTheme.fontFamily,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${print.date.day}/${print.date.month}/${print.date.year}',
                    style: TextStyle(
                      fontSize: 12,
                      color: AppTheme.slate500,
                      fontFamily: AppTheme.fontFamily,
                    ),
                  ),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  '\$${getProfit(print).toStringAsFixed(2)}',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: getProfit(print) >= 0 ? AppTheme.green600 : AppTheme.red600,
                    fontFamily: AppTheme.fontFamily,
                  ),
                ),
                Text(
                  '\$${getPrice(print).toStringAsFixed(2)}',
                  style: TextStyle(
                    fontSize: 12,
                    color: AppTheme.slate500,
                    fontFamily: AppTheme.fontFamily,
                  ),
                ),
              ],
            ),
          ],
        ),
        ),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppTheme.spacing12),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(AppTheme.spacing6),
            decoration: BoxDecoration(
              color: AppTheme.blue50,
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.print_outlined,
              size: 64,
              color: AppTheme.blue600,
            ),
          ),
          const SizedBox(height: AppTheme.spacing6),
          const Text(
            'No prints yet',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: AppTheme.slate900,
              fontFamily: AppTheme.fontFamily,
            ),
          ),
          const SizedBox(height: AppTheme.spacing2),
          Text(
            'Create your first print in the Calculator tab',
            style: TextStyle(
              fontSize: 14,
              color: AppTheme.slate500,
              fontFamily: AppTheme.fontFamily,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
