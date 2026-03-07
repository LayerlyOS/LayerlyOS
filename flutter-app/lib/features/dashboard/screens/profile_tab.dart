import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:crypto/crypto.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'dart:convert';
import '../../../core/api/api_client.dart';
import '../../../shared/providers/auth_provider.dart';
import '../../../shared/theme/app_theme.dart';
import '../../../shared/widgets/buttons/primary_button.dart';
import '../../../shared/widgets/inputs/text_field.dart';
import '../../../shared/widgets/common/error_banner.dart';
import '../providers/settings_provider.dart';
import '../../../shared/widgets/common/success_banner.dart';

class ProfileTab extends ConsumerStatefulWidget {
  const ProfileTab({super.key});

  @override
  ConsumerState<ProfileTab> createState() => _ProfileTabState();
}

class _ProfileTabState extends ConsumerState<ProfileTab> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  bool _isLoading = false;
  bool _isSaving = false;
  String? _error;
  String? _success;
  bool _useGravatar = false;
  bool _nameChanged = false;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final user = ref.read(authProvider).user;
      if (user != null) {
        _nameController.text = user.name ?? '';
      }

      // Load settings using provider (delayed to avoid modifying during build)
      Future(() async {
        await ref.read(settingsProvider.notifier).loadSettings();
        final settingsAsync = ref.read(settingsProvider);
        if (mounted && settingsAsync.hasValue) {
          setState(() {
            _useGravatar = settingsAsync.value!.useGravatar;
          });
        }
      });
    } catch (e) {
      setState(() {
        _error = 'Failed to load profile data: ${e.toString()}';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _updateProfile() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _isSaving = true;
      _error = null;
      _success = null;
    });

    try {
      final dio = ref.read(apiClientProvider);
      final response = await dio.patch(
        '/user/update',
        data: {
          'name': _nameController.text.trim(),
        },
      );

      if (response.statusCode == 200) {
        // Update auth provider with new user data
        final updatedUser = response.data['user'];
        if (updatedUser != null) {
          // Refresh auth state
          await ref.read(authProvider.notifier).refreshUser();
        }

        setState(() {
          _success = 'Profile updated successfully';
          _nameChanged = false;
        });

        // Clear success message after 3 seconds
        Future.delayed(const Duration(seconds: 3), () {
          if (mounted) {
            setState(() {
              _success = null;
            });
          }
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Failed to update profile: ${e.toString()}';
      });
    } finally {
      setState(() {
        _isSaving = false;
      });
    }
  }

  Future<void> _toggleGravatar() async {
    // Immediately update UI before API call
    final newValue = !_useGravatar;
    setState(() {
      _isLoading = true;
      _error = null;
      _useGravatar = newValue;
    });

    try {
      await ref.read(settingsProvider.notifier).updateSettings(
            useGravatar: newValue,
          );
      // Update local state from provider
      final settingsAsync = ref.read(settingsProvider);
      if (settingsAsync.hasValue) {
        setState(() {
          _useGravatar = settingsAsync.value!.useGravatar;
        });
      }
    } catch (e) {
      // Revert on error
      setState(() {
        _useGravatar = !newValue;
        _error = 'Failed to update Gravatar settings: ${e.toString()}';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  String _getGravatarUrl(String email, {int size = 128}) {
    final emailBytes = utf8.encode(email.trim().toLowerCase());
    final md5Hash = md5.convert(emailBytes).toString();
    // Remove timestamp to allow proper caching - image will be cached by CachedNetworkImage
    return 'https://www.gravatar.com/avatar/$md5Hash?s=$size&d=identicon';
  }

  // Generate consistent color based on user ID/email (like GitHub)
  Color _getAvatarColor(String identifier) {
    // Use hash of identifier to generate consistent color
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
    final user = ref.read(authProvider).user;
    if (user == null) return AppTheme.blue600;
    // Use email if available, otherwise use ID
    final identifier = user.email.isNotEmpty ? user.email : user.id;
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

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    final settingsAsync = ref.watch(settingsProvider);
    
    // Update _useGravatar from provider if available (delayed to avoid modifying during build)
    if (settingsAsync.hasValue && settingsAsync.value!.useGravatar != _useGravatar) {
      Future(() {
        if (mounted) {
          setState(() {
            _useGravatar = settingsAsync.value!.useGravatar;
          });
        }
      });
    }

    if (user == null) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    final emailVerified = user.emailVerified ?? false;
    final isAdmin = user.isAdmin;
    final role = user.role ?? 'USER';

    return SingleChildScrollView(
      padding: const EdgeInsets.all(AppTheme.spacing4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Identity Card (Left Column equivalent)
          Card(
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(AppTheme.radiusXl),
              side: const BorderSide(color: AppTheme.slate200),
            ),
            child: Column(
              children: [
                // Avatar Section
                Container(
                  padding: const EdgeInsets.all(AppTheme.spacing8),
                  child: Column(
                    children: [
                      // Avatar
                      Stack(
                        clipBehavior: Clip.none,
                        children: [
                          Container(
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(
                                  color: AppTheme.slate200.withValues(alpha: 0.3),
                                  blurRadius: 16,
                                  offset: const Offset(0, 4),
                                ),
                              ],
                            ),
                            child: _useGravatar && user.email.isNotEmpty
                                ? CachedNetworkImage(
                                    imageUrl: _getGravatarUrl(user.email),
                                    width: 128,
                                    height: 128,
                                    fit: BoxFit.cover,
                                    imageBuilder: (context, imageProvider) => CircleAvatar(
                                      radius: 64,
                                      backgroundColor: _getUserAvatarColor(),
                                      backgroundImage: imageProvider,
                                    ),
                                    placeholder: (context, url) => CircleAvatar(
                                      radius: 64,
                                      backgroundColor: _getUserAvatarColor(),
                                      child: Text(
                                        (user.name?.isNotEmpty == true
                                                ? user.name!.substring(0, 1)
                                                : user.email.substring(0, 1))
                                            .toUpperCase(),
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 48,
                                          fontWeight: FontWeight.bold,
                                          fontFamily: AppTheme.fontFamily,
                                        ),
                                      ),
                                    ),
                                    errorWidget: (context, url, error) => _buildPlaceholderAvatar(
                                      _getUserAvatarColor(),
                                      (user.name?.isNotEmpty == true
                                              ? user.name!.substring(0, 1)
                                              : user.email.substring(0, 1))
                                          .toUpperCase(),
                                      64,
                                    ),
                                  )
                                : _buildPlaceholderAvatar(
                                    _getUserAvatarColor(),
                                    (user.name?.isNotEmpty == true
                                            ? user.name!.substring(0, 1)
                                            : user.email.substring(0, 1))
                                        .toUpperCase(),
                                    64,
                                  ),
                          ),
                          // Online status indicator
                          Positioned(
                            bottom: 4,
                            right: 4,
                            child: Container(
                              width: 24,
                              height: 24,
                              decoration: BoxDecoration(
                                color: AppTheme.green600,
                                shape: BoxShape.circle,
                                border: Border.all(color: Colors.white, width: 3),
                                boxShadow: [
                                  BoxShadow(
                                    color: AppTheme.green600.withValues(alpha: 0.3),
                                    blurRadius: 4,
                                    offset: const Offset(0, 2),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: AppTheme.spacing6),
                      // Name
                      Text(
                        user.name ?? 'User',
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.slate900,
                          fontFamily: AppTheme.fontFamily,
                        ),
                      ),
                      const SizedBox(height: AppTheme.spacing1),
                      // Email
                      Text(
                        user.email,
                        style: const TextStyle(
                          fontSize: 14,
                          color: AppTheme.slate500,
                          fontFamily: AppTheme.fontFamily,
                        ),
                      ),
                      const SizedBox(height: AppTheme.spacing4),
                      // Badges
                      Wrap(
                        spacing: AppTheme.spacing2,
                        runSpacing: AppTheme.spacing2,
                        alignment: WrapAlignment.center,
                        children: [
                          // Email Verified Badge
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: AppTheme.spacing3,
                              vertical: AppTheme.spacing1,
                            ),
                            decoration: BoxDecoration(
                              color: emailVerified ? AppTheme.green50 : AppTheme.red50,
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(
                                color: emailVerified ? AppTheme.green200 : AppTheme.red200,
                              ),
                            ),
                            child: Text(
                              emailVerified ? 'Verified' : 'Unverified',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: emailVerified ? AppTheme.green600 : AppTheme.red600,
                                fontFamily: AppTheme.fontFamily,
                              ),
                            ),
                          ),
                          // Role Badge
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: AppTheme.spacing3,
                              vertical: AppTheme.spacing1,
                            ),
                            decoration: BoxDecoration(
                              color: isAdmin || role == 'admin' || role == 'ADMIN'
                                  ? AppTheme.blue50
                                  : AppTheme.slate50,
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(
                                color: isAdmin || role == 'admin' || role == 'ADMIN'
                                    ? AppTheme.blue200
                                    : AppTheme.slate200,
                              ),
                            ),
                            child: Text(
                              isAdmin || role == 'admin' || role == 'ADMIN'
                                  ? 'Administrator'
                                  : 'User',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: isAdmin || role == 'admin' || role == 'ADMIN'
                                    ? AppTheme.blue700
                                    : AppTheme.slate700,
                                fontFamily: AppTheme.fontFamily,
                              ),
                            ),
                          ),
                          // Subscription Badge
                          if (user.subscriptionTier != null)
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: AppTheme.spacing3,
                                vertical: AppTheme.spacing1,
                              ),
                              decoration: BoxDecoration(
                                color: AppTheme.blue50,
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(color: AppTheme.blue200),
                              ),
                              child: Text(
                                user.subscriptionTier!,
                                style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  color: AppTheme.blue700,
                                  fontFamily: AppTheme.fontFamily,
                                ),
                              ),
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
                // Avatar Settings Section
                Padding(
                  padding: const EdgeInsets.all(AppTheme.spacing6),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'AVATAR SETTINGS',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.slate500,
                          letterSpacing: 1.2,
                          fontFamily: AppTheme.fontFamily,
                        ),
                      ),
                      const SizedBox(height: AppTheme.spacing4),
                      Container(
                        padding: const EdgeInsets.all(AppTheme.spacing4),
                        decoration: BoxDecoration(
                          color: AppTheme.slate50,
                          borderRadius: BorderRadius.circular(AppTheme.radiusXl),
                          border: Border.all(color: AppTheme.slate200),
                        ),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(AppTheme.spacing2),
                              decoration: BoxDecoration(
                                color: AppTheme.blue50,
                                borderRadius: BorderRadius.circular(AppTheme.radiusSm),
                              ),
                              child: const Icon(
                                Icons.account_circle,
                                color: AppTheme.blue600,
                                size: 24,
                              ),
                            ),
                            const SizedBox(width: AppTheme.spacing3),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    'Gravatar',
                                    style: TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w600,
                                      color: AppTheme.slate900,
                                      fontFamily: AppTheme.fontFamily,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    'Use global avatar',
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: AppTheme.slate500,
                                      fontFamily: AppTheme.fontFamily,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Switch(
                              value: _useGravatar,
                              onChanged: _isLoading
                                  ? null
                                  : (value) {
                                      _toggleGravatar();
                                    },
                              activeThumbColor: AppTheme.blue600,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppTheme.spacing6),
          // Basic Information Card (Right Column equivalent)
          Card(
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(AppTheme.radiusXl),
              side: const BorderSide(color: AppTheme.slate200),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header
                Container(
                  padding: const EdgeInsets.all(AppTheme.spacing6),
                  decoration: const BoxDecoration(
                    border: Border(
                      bottom: BorderSide(color: AppTheme.slate100),
                    ),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: AppTheme.blue50,
                          borderRadius: BorderRadius.circular(AppTheme.radiusLg),
                        ),
                        child: const Icon(
                          Icons.edit,
                          color: AppTheme.blue600,
                          size: 20,
                        ),
                      ),
                      const SizedBox(width: AppTheme.spacing3),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Basic Information',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: AppTheme.slate900,
                                fontFamily: AppTheme.fontFamily,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'Edit the information shown on your profile.',
                              style: TextStyle(
                                fontSize: 14,
                                color: AppTheme.slate500,
                                fontFamily: AppTheme.fontFamily,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                // Form
                Padding(
                  padding: const EdgeInsets.all(AppTheme.spacing8),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        if (_error != null) ...[
                          ErrorBanner(message: _error!),
                          const SizedBox(height: AppTheme.spacing4),
                        ],
                        if (_success != null) ...[
                          SuccessBanner(message: _success!),
                          const SizedBox(height: AppTheme.spacing4),
                        ],
                        // Name Field
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Full name',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: AppTheme.slate700,
                                fontFamily: AppTheme.fontFamily,
                              ),
                            ),
                            const SizedBox(height: AppTheme.spacing2),
                            AppTextField(
                              controller: _nameController,
                              hint: 'Enter your name',
                              leftIcon: const Icon(Icons.person),
                              validator: (value) {
                                if (value == null || value.trim().isEmpty) {
                                  return 'Name is required';
                                }
                                return null;
                              },
                              onChanged: (value) {
                                setState(() {
                                  _nameChanged = value != (user.name ?? '');
                                });
                              },
                            ),
                            const SizedBox(height: AppTheme.spacing2),
                            Text(
                              'This name will be visible to other users and in reports.',
                              style: TextStyle(
                                fontSize: 12,
                                color: AppTheme.slate500,
                                fontFamily: AppTheme.fontFamily,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: AppTheme.spacing6),
                        // Email Field (read-only)
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Email address',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: AppTheme.slate700,
                                fontFamily: AppTheme.fontFamily,
                              ),
                            ),
                            const SizedBox(height: AppTheme.spacing2),
                            AppTextField(
                              controller: TextEditingController(text: user.email),
                              hint: 'Email',
                              leftIcon: const Icon(Icons.email),
                              enabled: false,
                            ),
                            const SizedBox(height: AppTheme.spacing2),
                            Container(
                              padding: const EdgeInsets.all(AppTheme.spacing2),
                              decoration: BoxDecoration(
                                color: AppTheme.red50,
                                borderRadius: BorderRadius.circular(AppTheme.radiusSm),
                                border: Border.all(color: AppTheme.red200),
                              ),
                              child: Row(
                                children: [
                                  const Icon(
                                    Icons.info_outline,
                                    size: 16,
                                    color: AppTheme.red600,
                                  ),
                                  const SizedBox(width: AppTheme.spacing2),
                                  Expanded(
                                    child: Text(
                                      'For security reasons, the email address can only be changed by contacting the administrator.',
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: AppTheme.red600,
                                        fontFamily: AppTheme.fontFamily,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: AppTheme.spacing8),
                        // Save Button
                        PrimaryButton(
                          text: 'Save changes',
                          onPressed: _isSaving || !_nameChanged
                              ? null
                              : _updateProfile,
                          fullWidth: true,
                          isLoading: _isSaving,
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
