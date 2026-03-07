import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:crypto/crypto.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'dart:convert';
import '../../../core/api/api_client.dart';
import '../../../core/router/app_router.dart';
import '../../../features/auth/services/auth_service.dart';
import '../../../shared/providers/auth_provider.dart';
import '../../../shared/theme/app_theme.dart';
import '../../../shared/widgets/common/logo.dart';
import 'calculator_tab.dart';
import 'dashboard_tab.dart';
import 'filaments_tab.dart';
import 'settings_tab.dart';
import '../providers/prints_provider.dart';
import '../providers/settings_provider.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  int _selectedIndex = 0;

  @override
  void initState() {
    super.initState();
    // Load prints when home opens
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(printsProvider.notifier).loadPrints();
    });
  }

  void _changeTab(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    final printsState = ref.watch(printsProvider);
    final printsCount = printsState.prints.length;

    return Scaffold(
      appBar: AppBar(
        title: const LogoAppBar(),
        elevation: 0,
        backgroundColor: AppTheme.white,
        foregroundColor: AppTheme.slate900,
        leading: Builder(
          builder: (context) => IconButton(
            icon: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppTheme.blue50,
                borderRadius: BorderRadius.circular(AppTheme.radiusMd),
              ),
              child: const Icon(
                Icons.menu,
                color: AppTheme.blue600,
                size: 20,
              ),
            ),
            onPressed: () => Scaffold.of(context).openDrawer(),
          ),
        ),
        actions: [
          // User avatar with dropdown menu
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppTheme.spacing3),
            child: _UserAvatarMenu(
              user: user,
              onTabChange: _changeTab,
            ),
          ),
        ],
      ),
      drawer: _AwesomeDrawer(
        user: user,
        selectedIndex: _selectedIndex,
        onItemSelected: (index) {
          setState(() => _selectedIndex = index);
          Navigator.pop(context);
        },
        printsCount: printsCount,
      ),
      body: Stack(
        children: [
          IndexedStack(
            index: _selectedIndex,
            children: [
              const DashboardTab(),
              CalculatorTab(
                onPrintCreated: () {
                  ref.read(printsProvider.notifier).loadPrints();
                  setState(() => _selectedIndex = 0); // Switch to dashboard
                },
              ),
              const FilamentsTab(),
              const SettingsTab(),
            ],
          ),
          _QuickActionsBar(
            onNewPrint: () {
              setState(() => _selectedIndex = 1); // Switch to calculator
            },
            onOrders: () {
              final router = ref.read(routerProvider);
              router.push('/orders');
            },
          ),
        ],
      ),
    );
  }
}

class _UserAvatarMenu extends ConsumerStatefulWidget {
  final dynamic user;
  final Function(int) onTabChange;

  const _UserAvatarMenu({
    required this.user,
    required this.onTabChange,
  });

  @override
  ConsumerState<_UserAvatarMenu> createState() => _UserAvatarMenuState();
}

class _UserAvatarMenuState extends ConsumerState<_UserAvatarMenu> {
  bool? _cachedUseGravatar;

  String _getInitials() {
    if (widget.user?.name != null && widget.user.name.isNotEmpty) {
      return widget.user.name.substring(0, 1).toUpperCase();
    }
    if (widget.user?.email != null && widget.user.email.isNotEmpty) {
      return widget.user.email.substring(0, 1).toUpperCase();
    }
    return 'U';
  }

  String _getGravatarUrl(String email, {int size = 128}) {
    final emailBytes = utf8.encode(email.trim().toLowerCase());
    final md5Hash = md5.convert(emailBytes).toString();
    // Remove timestamp to allow proper caching - image will be cached by CachedNetworkImage
    return 'https://www.gravatar.com/avatar/$md5Hash?s=$size&d=identicon';
  }

  Color _getAvatarColor(String identifier) {
    final hash = identifier.hashCode;
    final colors = [
      AppTheme.blue600,
      AppTheme.blue700,
      AppTheme.green600,
      AppTheme.green700,
      const Color(0xFF9333EA), // purple600
      const Color(0xFF7E22CE), // purple700
      const Color(0xFFEA580C), // orange600
      const Color(0xFFC2410C), // orange700
      AppTheme.red600,
      const Color(0xFF991B1B), // red700
      const Color(0xFF0D9488), // teal600
      const Color(0xFF0F766E), // teal700
      const Color(0xFF4F46E5), // indigo600
      const Color(0xFF4338CA), // indigo700
      const Color(0xFFDB2777), // pink600
      const Color(0xFFBE185D), // pink700
    ];
    return colors[hash.abs() % colors.length];
  }

  Color _getUserAvatarColor() {
    if (widget.user == null) return AppTheme.blue600;
    final identifier = widget.user.email.isNotEmpty ? widget.user.email : widget.user.id;
    return _getAvatarColor(identifier);
  }

  Widget _buildPlaceholderAvatar(Color color, String text, double radius) {
    return CircleAvatar(
      radius: radius,
      backgroundColor: color,
      child: Text(
        text,
        style: TextStyle(
          color: Colors.white,
          fontSize: radius * 0.75,
          fontWeight: FontWeight.bold,
          fontFamily: AppTheme.fontFamily,
        ),
      ),
    );
  }

  void _showMenu(BuildContext context) {
    final RenderBox button = context.findRenderObject() as RenderBox;
    final RenderBox overlay = Overlay.of(context).context.findRenderObject() as RenderBox;
    final Offset position = button.localToGlobal(Offset.zero);

    showMenu(
      context: context,
      position: RelativeRect.fromLTRB(
        position.dx + button.size.width - 280,
        position.dy + button.size.height + 8,
        overlay.size.width - position.dx - button.size.width + 280,
        overlay.size.height - position.dy - button.size.height - 8,
      ),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppTheme.radiusXl),
      ),
      elevation: 16,
      color: Colors.transparent,
      items: [
        PopupMenuItem(
          padding: EdgeInsets.zero,
          child: Container(
            width: 260,
            decoration: BoxDecoration(
              color: AppTheme.white,
              borderRadius: BorderRadius.circular(AppTheme.radiusLg),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.1),
                  blurRadius: 20,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            clipBehavior: Clip.antiAlias,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Simple white header - like drawer
                Container(
                  padding: const EdgeInsets.all(AppTheme.spacing4),
                  decoration: BoxDecoration(
                    color: AppTheme.white,
                    border: Border(
                      bottom: BorderSide(
                        color: AppTheme.slate200,
                        width: 1,
                      ),
                    ),
                  ),
                  child: Row(
                    children: [
                      Builder(
                        builder: (context) {
                          final settingsAsync = ref.watch(settingsProvider);
                          bool useGravatar;
                          if (settingsAsync.hasValue) {
                            useGravatar = settingsAsync.value!.useGravatar;
                            if (_cachedUseGravatar != useGravatar) {
                              Future(() {
                                if (mounted) {
                                  setState(() {
                                    _cachedUseGravatar = useGravatar;
                                  });
                                }
                              });
                            }
                          } else {
                            useGravatar = _cachedUseGravatar ?? false;
                          }
                          
                          final user = widget.user;
                          
                          if (user == null) {
                            return CircleAvatar(
                              radius: 20,
                              backgroundColor: AppTheme.blue600,
                              child: Text(
                                'U',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 16,
                                  fontFamily: AppTheme.fontFamily,
                                ),
                              ),
                            );
                          }

                          final showGravatar = useGravatar && user.email.isNotEmpty;
                          final avatarColor = _getUserAvatarColor();
                          
                          if (showGravatar) {
                            return CachedNetworkImage(
                              imageUrl: _getGravatarUrl(user.email, size: 40),
                              width: 40,
                              height: 40,
                              fit: BoxFit.cover,
                              imageBuilder: (context, imageProvider) => CircleAvatar(
                                radius: 20,
                                backgroundColor: avatarColor,
                                backgroundImage: imageProvider,
                              ),
                              placeholder: (context, url) => CircleAvatar(
                                radius: 20,
                                backgroundColor: avatarColor,
                                child: Text(
                                  _getInitials(),
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 16,
                                    fontFamily: AppTheme.fontFamily,
                                  ),
                                ),
                              ),
                              errorWidget: (context, url, error) => _buildPlaceholderAvatar(
                                avatarColor,
                                _getInitials(),
                                20,
                              ),
                            );
                          }
                          
                          return _buildPlaceholderAvatar(avatarColor, _getInitials(), 20);
                        },
                      ),
                      const SizedBox(width: AppTheme.spacing3),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              widget.user?.name ?? 'User',
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: AppTheme.slate900,
                                fontFamily: AppTheme.fontFamily,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 2),
                            Text(
                              widget.user?.email ?? '',
                              style: TextStyle(
                                fontSize: 12,
                                color: AppTheme.slate600,
                                fontFamily: AppTheme.fontFamily,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                // Simple menu items - like drawer
                Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    _SimpleMenuItem(
                      icon: Icons.person_outline,
                      label: 'View Profile',
                      onTap: () {
                        Navigator.pop(context);
                        final router = ref.read(routerProvider);
                        router.push('/profile');
                      },
                    ),
                    _SimpleMenuItem(
                      icon: Icons.settings_outlined,
                      label: 'Settings',
                      onTap: () {
                        Navigator.pop(context);
                        widget.onTabChange(3);
                      },
                    ),
                    _SimpleMenuItem(
                      icon: Icons.logout,
                      label: 'Logout',
                      iconColor: AppTheme.red600,
                      textColor: AppTheme.red600,
                      onTap: () async {
                        Navigator.pop(context);
                        
                        try {
                          final authService = AuthService(ref.read(apiClientProvider));
                          await authService.signOut();
                        } catch (e) {
                          // Ignore errors on sign out
                        }

                        final authNotifier = ref.read(authProvider.notifier);
                        await authNotifier.logout();

                        if (mounted) {
                          final router = ref.read(routerProvider);
                          router.go('/login');
                        }
                      },
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => _showMenu(context),
      child: Container(
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: Border.all(
            color: AppTheme.slate200,
            width: 2,
          ),
        ),
        child: Builder(
          builder: (context) {
            final settingsAsync = ref.watch(settingsProvider);
            // Use cached value if available, otherwise use current value
            bool useGravatar;
            if (settingsAsync.hasValue) {
              useGravatar = settingsAsync.value!.useGravatar;
              // Update cache asynchronously
              if (_cachedUseGravatar != useGravatar) {
                Future(() {
                  if (mounted) {
                    setState(() {
                      _cachedUseGravatar = useGravatar;
                    });
                  }
                });
              }
            } else {
              useGravatar = _cachedUseGravatar ?? false;
            }
            
            final user = widget.user;
            
            if (user == null) {
              return CircleAvatar(
                radius: 18,
                backgroundColor: AppTheme.blue600,
                child: Text(
                  'U',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                    fontFamily: AppTheme.fontFamily,
                  ),
                ),
              );
            }

            final showGravatar = useGravatar && user.email.isNotEmpty;
            final avatarColor = _getUserAvatarColor();
            
            if (showGravatar) {
              return CachedNetworkImage(
                imageUrl: _getGravatarUrl(user.email, size: 36),
                width: 36,
                height: 36,
                fit: BoxFit.cover,
                imageBuilder: (context, imageProvider) => CircleAvatar(
                  radius: 18,
                  backgroundColor: avatarColor,
                  backgroundImage: imageProvider,
                ),
                placeholder: (context, url) => CircleAvatar(
                  radius: 18,
                  backgroundColor: avatarColor,
                  child: Text(
                    _getInitials(),
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                      fontFamily: AppTheme.fontFamily,
                    ),
                  ),
                ),
                errorWidget: (context, url, error) => _buildPlaceholderAvatar(avatarColor, _getInitials(), 18),
              );
            }
            
            return _buildPlaceholderAvatar(avatarColor, _getInitials(), 18);
          },
        ),
      ),
    );
  }
}

class _SimpleMenuItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final Color? iconColor;
  final Color? textColor;

  const _SimpleMenuItem({
    required this.icon,
    required this.label,
    required this.onTap,
    this.iconColor,
    this.textColor,
  });

  @override
  Widget build(BuildContext context) {
    final finalIconColor = iconColor ?? AppTheme.slate600;
    final finalTextColor = textColor ?? AppTheme.slate700;
    
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppTheme.radiusMd),
        child: Container(
          margin: const EdgeInsets.symmetric(
            horizontal: AppTheme.spacing2,
            vertical: 2,
          ),
          padding: const EdgeInsets.symmetric(
            horizontal: AppTheme.spacing4,
            vertical: AppTheme.spacing3,
          ),
          child: Row(
            children: [
              Icon(
                icon,
                color: finalIconColor,
                size: 22,
              ),
              const SizedBox(width: AppTheme.spacing3),
              Expanded(
                child: Text(
                  label,
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w500,
                    color: finalTextColor,
                    fontFamily: AppTheme.fontFamily,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// Modern Minimalist Drawer
class _AwesomeDrawer extends ConsumerStatefulWidget {
  final dynamic user;
  final int selectedIndex;
  final Function(int) onItemSelected;
  final int printsCount;

  const _AwesomeDrawer({
    required this.user,
    required this.selectedIndex,
    required this.onItemSelected,
    required this.printsCount,
  });

  @override
  ConsumerState<_AwesomeDrawer> createState() => _AwesomeDrawerState();
}

class _AwesomeDrawerState extends ConsumerState<_AwesomeDrawer> {

  String _getInitials() {
    if (widget.user?.name != null && widget.user.name.isNotEmpty) {
      return widget.user.name.substring(0, 1).toUpperCase();
    }
    if (widget.user?.email != null && widget.user.email.isNotEmpty) {
      return widget.user.email.substring(0, 1).toUpperCase();
    }
    return 'U';
  }

  String _getGravatarUrl(String email, {int size = 128}) {
    final emailBytes = utf8.encode(email.trim().toLowerCase());
    final md5Hash = md5.convert(emailBytes).toString();
    // Remove timestamp to allow proper caching - image will be cached by CachedNetworkImage
    return 'https://www.gravatar.com/avatar/$md5Hash?s=$size&d=identicon';
  }

  Color _getAvatarColor(String identifier) {
    final hash = identifier.hashCode;
    final colors = [
      AppTheme.blue600,
      AppTheme.blue700,
      AppTheme.green600,
      AppTheme.green700,
      const Color(0xFF9333EA),
      const Color(0xFF7E22CE),
      const Color(0xFFEA580C),
      const Color(0xFFC2410C),
      AppTheme.red600,
      const Color(0xFF991B1B),
      const Color(0xFF0D9488),
      const Color(0xFF0F766E),
      const Color(0xFF4F46E5),
      const Color(0xFF4338CA),
      const Color(0xFFDB2777),
      const Color(0xFFBE185D),
    ];
    return colors[hash.abs() % colors.length];
  }

  Color _getUserAvatarColor() {
    if (widget.user == null) return AppTheme.blue600;
    final identifier = widget.user.email.isNotEmpty ? widget.user.email : widget.user.id;
    return _getAvatarColor(identifier);
  }

  @override
  Widget build(BuildContext context) {
    final settingsAsync = ref.watch(settingsProvider);
    final useGravatar = settingsAsync.value?.useGravatar ?? false;
    final user = widget.user;

    return Drawer(
      width: MediaQuery.of(context).size.width * 0.8,
      backgroundColor: AppTheme.white,
      child: SafeArea(
        child: Column(
          children: [
            // Header - simple and clean
            Container(
              padding: const EdgeInsets.all(AppTheme.spacing5),
              decoration: BoxDecoration(
                color: AppTheme.white,
                border: Border(
                  bottom: BorderSide(
                    color: AppTheme.slate200,
                    width: 1,
                  ),
                ),
              ),
              child: Row(
                children: [
                  useGravatar && user?.email.isNotEmpty == true
                      ? ClipOval(
                          child: CachedNetworkImage(
                            imageUrl: _getGravatarUrl(user.email),
                            width: 56,
                            height: 56,
                            fit: BoxFit.cover,
                            imageBuilder: (context, imageProvider) => CircleAvatar(
                              radius: 28,
                              backgroundColor: _getUserAvatarColor(),
                              backgroundImage: imageProvider,
                            ),
                            placeholder: (context, url) => CircleAvatar(
                              radius: 28,
                              backgroundColor: _getUserAvatarColor(),
                              child: Text(
                                _getInitials(),
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 24,
                                  fontWeight: FontWeight.bold,
                                  fontFamily: AppTheme.fontFamily,
                                ),
                              ),
                            ),
                            errorWidget: (context, url, error) => CircleAvatar(
                              radius: 28,
                              backgroundColor: _getUserAvatarColor(),
                              child: Text(
                                _getInitials(),
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 24,
                                  fontWeight: FontWeight.bold,
                                  fontFamily: AppTheme.fontFamily,
                                ),
                              ),
                            ),
                          ),
                        )
                      : CircleAvatar(
                          radius: 28,
                          backgroundColor: _getUserAvatarColor(),
                          child: Text(
                            _getInitials(),
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                              fontFamily: AppTheme.fontFamily,
                            ),
                          ),
                        ),
                  const SizedBox(width: AppTheme.spacing3),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          user?.name ?? 'User',
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.slate900,
                            fontFamily: AppTheme.fontFamily,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          user?.email ?? '',
                          style: TextStyle(
                            fontSize: 13,
                            color: AppTheme.slate600,
                            fontFamily: AppTheme.fontFamily,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            // Menu items
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(vertical: AppTheme.spacing2),
                children: [
                  _DrawerMenuItem(
                    icon: Icons.dashboard_outlined,
                    selectedIcon: Icons.dashboard,
                    label: 'Dashboard',
                    isSelected: widget.selectedIndex == 0,
                    badge: widget.printsCount > 0 ? widget.printsCount.toString() : null,
                    onTap: () => widget.onItemSelected(0),
                  ),
                  _DrawerMenuItem(
                    icon: Icons.calculate_outlined,
                    selectedIcon: Icons.calculate,
                    label: 'Calculator',
                    isSelected: widget.selectedIndex == 1,
                    onTap: () => widget.onItemSelected(1),
                  ),
                  _DrawerMenuItem(
                    icon: Icons.inventory_2_outlined,
                    selectedIcon: Icons.inventory_2,
                    label: 'Filaments',
                    isSelected: widget.selectedIndex == 2,
                    onTap: () => widget.onItemSelected(2),
                  ),
                  _DrawerMenuItem(
                    icon: Icons.settings_outlined,
                    selectedIcon: Icons.settings,
                    label: 'Settings',
                    isSelected: widget.selectedIndex == 3,
                    onTap: () => widget.onItemSelected(3),
                  ),
                  // Subtle separator
                  const SizedBox(height: AppTheme.spacing2),
                  Container(
                    margin: const EdgeInsets.symmetric(horizontal: AppTheme.spacing4),
                    height: 1,
                    color: AppTheme.slate100,
                  ),
                  const SizedBox(height: AppTheme.spacing2),
                  _DrawerMenuItem(
                    icon: Icons.person_outline,
                    selectedIcon: Icons.person,
                    label: 'Profile',
                    isSelected: false,
                    onTap: () {
                      Navigator.pop(context);
                      final router = ref.read(routerProvider);
                      router.push('/profile');
                    },
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _DrawerMenuItem extends StatelessWidget {
  final IconData icon;
  final IconData selectedIcon;
  final String label;
  final bool isSelected;
  final VoidCallback onTap;
  final String? badge;

  const _DrawerMenuItem({
    required this.icon,
    required this.selectedIcon,
    required this.label,
    required this.isSelected,
    required this.onTap,
    this.badge,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppTheme.radiusMd),
        child: Container(
          margin: const EdgeInsets.symmetric(
            horizontal: AppTheme.spacing2,
            vertical: 2,
          ),
          padding: const EdgeInsets.symmetric(
            horizontal: AppTheme.spacing4,
            vertical: AppTheme.spacing3,
          ),
          decoration: BoxDecoration(
            color: isSelected ? AppTheme.blue50 : Colors.transparent,
            borderRadius: BorderRadius.circular(AppTheme.radiusMd),
          ),
          child: Row(
            children: [
              Icon(
                isSelected ? selectedIcon : icon,
                color: isSelected ? AppTheme.blue600 : AppTheme.slate600,
                size: 22,
              ),
              const SizedBox(width: AppTheme.spacing3),
              Expanded(
                child: Text(
                  label,
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                    color: isSelected ? AppTheme.blue700 : AppTheme.slate700,
                    fontFamily: AppTheme.fontFamily,
                  ),
                ),
              ),
              if (badge != null)
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 7,
                    vertical: 3,
                  ),
                  decoration: BoxDecoration(
                    color: AppTheme.blue600,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    badge!,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

// Floating Action Button with Options
class _QuickActionsBar extends ConsumerStatefulWidget {
  final VoidCallback onNewPrint;
  final VoidCallback onOrders;

  const _QuickActionsBar({
    required this.onNewPrint,
    required this.onOrders,
  });

  @override
  ConsumerState<_QuickActionsBar> createState() => _QuickActionsBarState();
}

class _QuickActionsBarState extends ConsumerState<_QuickActionsBar>
    with SingleTickerProviderStateMixin {
  bool _isExpanded = false;
  late AnimationController _controller;
  late Animation<double> _rotationAnimation;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 200),
    );
    _rotationAnimation = Tween<double>(begin: 0.0, end: 0.125).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
    _scaleAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _toggleMenu() {
    setState(() {
      _isExpanded = !_isExpanded;
      if (_isExpanded) {
        _controller.forward();
      } else {
        _controller.reverse();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        // Background overlay when expanded
        if (_isExpanded)
          Positioned.fill(
            child: GestureDetector(
              onTap: _toggleMenu,
              child: Container(
                color: Colors.black.withValues(alpha: 0.3),
              ),
            ),
          ),
        // Main FAB
        Positioned(
          right: 16,
          bottom: 16,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              // Option buttons
              if (_isExpanded) ...[
                _FloatingActionOption(
                  icon: Icons.receipt_long,
                  label: 'Orders',
                  onTap: () {
                    _toggleMenu();
                    widget.onOrders();
                  },
                  animation: _scaleAnimation,
                  delay: 0,
                ),
                const SizedBox(height: 12),
                _FloatingActionOption(
                  icon: Icons.add,
                  label: 'New Print',
                  onTap: () {
                    _toggleMenu();
                    widget.onNewPrint();
                  },
                  animation: _scaleAnimation,
                  delay: 50,
                ),
                const SizedBox(height: 12),
              ],
              // Main FAB
              AnimatedBuilder(
                animation: _rotationAnimation,
                builder: (context, child) {
                  return Transform.rotate(
                    angle: _rotationAnimation.value * 3.14159,
                    child: FloatingActionButton(
                      onPressed: _toggleMenu,
                      backgroundColor: AppTheme.blue600,
                      child: Icon(
                        _isExpanded ? Icons.close : Icons.add,
                        color: Colors.white,
                      ),
                    ),
                  );
                },
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _FloatingActionOption extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final Animation<double> animation;
  final int delay;

  const _FloatingActionOption({
    required this.icon,
    required this.label,
    required this.onTap,
    required this.animation,
    this.delay = 0,
  });

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: animation,
      builder: (context, child) {
        return Transform.scale(
          scale: animation.value,
          child: Opacity(
            opacity: animation.value,
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 8,
                  ),
                  decoration: BoxDecoration(
                    color: AppTheme.white,
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.1),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Text(
                    label,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.slate700,
                      fontFamily: AppTheme.fontFamily,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                FloatingActionButton(
                  mini: true,
                  onPressed: onTap,
                  backgroundColor: AppTheme.white,
                  child: Icon(
                    icon,
                    color: AppTheme.blue600,
                    size: 20,
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
