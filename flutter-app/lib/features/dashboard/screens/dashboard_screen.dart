import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/router/app_router.dart';
import '../../../features/auth/services/auth_service.dart';
import '../../../shared/providers/auth_provider.dart';
import '../../../shared/theme/app_theme.dart';
import '../providers/prints_provider.dart';
import 'calculator_tab.dart';
import 'dashboard_tab.dart';

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  int _selectedTab = 0;

  @override
  void initState() {
    super.initState();
    // Load prints when dashboard opens
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(printsProvider.notifier).loadPrints();
    });
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;

    return Scaffold(
      appBar: AppBar(
        title: Text('Welcome, ${user?.name ?? user?.email ?? 'User'}'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              try {
                // Sign out from server
                final authService = AuthService(ref.read(apiClientProvider));
                await authService.signOut();
              } catch (e) {
                // Ignore errors on sign out
              }
              
              // Clear local state
              final authNotifier = ref.read(authProvider.notifier);
              await authNotifier.logout();
              
              // Navigate to login using router from provider
              if (!mounted) return;
              final router = ref.read(routerProvider);
              router.go('/login');
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Tab switcher (like web mobile)
          Container(
            decoration: const BoxDecoration(
              color: AppTheme.white,
              border: Border(
                bottom: BorderSide(color: AppTheme.slate200),
              ),
            ),
            child: Row(
              children: [
                Expanded(
                  child: _TabButton(
                    text: 'Calculator',
                    icon: Icons.calculate,
                    isSelected: _selectedTab == 0,
                    onTap: () => setState(() => _selectedTab = 0),
                  ),
                ),
                Expanded(
                  child: _TabButton(
                    text: 'Dashboard',
                    icon: Icons.dashboard,
                    isSelected: _selectedTab == 1,
                    onTap: () => setState(() => _selectedTab = 1),
                  ),
                ),
              ],
            ),
          ),
          // Content
          Expanded(
            child: IndexedStack(
              index: _selectedTab,
              children: [
                CalculatorTab(
                  onPrintCreated: () {
                    ref.read(printsProvider.notifier).loadPrints();
                    setState(() => _selectedTab = 1);
                  },
                ),
                const DashboardTab(),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _TabButton extends StatelessWidget {
  final String text;
  final IconData icon;
  final bool isSelected;
  final VoidCallback onTap;

  const _TabButton({
    required this.text,
    required this.icon,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: AppTheme.spacing3),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.blue50 : Colors.transparent,
          border: Border(
            bottom: BorderSide(
              color: isSelected ? AppTheme.blue600 : Colors.transparent,
              width: 2,
            ),
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 18,
              color: isSelected ? AppTheme.blue600 : AppTheme.slate500,
            ),
            const SizedBox(width: AppTheme.spacing2),
            Text(
              text,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: isSelected ? AppTheme.blue600 : AppTheme.slate500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
