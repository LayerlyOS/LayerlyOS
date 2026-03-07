import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart' hide Session;
import '../../../shared/providers/auth_provider.dart';
import '../../../shared/widgets/buttons/outline_button.dart';
import '../../../shared/widgets/buttons/primary_button.dart';
import '../../../shared/widgets/common/error_banner.dart';
import '../../../shared/widgets/common/success_banner.dart';
import '../../../shared/widgets/common/logo.dart';
import '../../../shared/widgets/inputs/text_field.dart';
import '../../../shared/theme/app_theme.dart';
import '../../../shared/models/session.dart';
import '../services/auth_service.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _nameController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  bool _isLoginMode = true;
  bool _isLoading = false;
  String? _oauthLoading; // 'google' | 'github'
  String? _error;
  String? _success;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _nameController.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
      _error = null;
      _success = null;
    });

    try {
      final authService = ref.read(authServiceProvider);
      final authNotifier = ref.read(authProvider.notifier);

      Session session;
      if (_isLoginMode) {
        session = await authService.signIn(
          email: _emailController.text.trim(),
          password: _passwordController.text,
        );
      } else {
        if (_nameController.text.trim().isEmpty) {
          setState(() {
            _error = 'Please enter your name';
            _isLoading = false;
          });
          return;
        }
        session = await authService.signUp(
          email: _emailController.text.trim(),
          password: _passwordController.text,
          name: _nameController.text.trim(),
        );
      }

      await authNotifier.setSession(session);

      if (session.twoFactorRequired) {
        setState(() {
          _success = '✓ Signed in. Redirecting to 2FA...';
        });
        Future.delayed(const Duration(milliseconds: 500), () {
          if (mounted) {
            context.go('/two-factor');
          }
        });
      } else {
        setState(() {
          _success = '✓ Signed in. Redirecting...';
        });
        Future.delayed(const Duration(milliseconds: 500), () {
          if (mounted) {
            context.go('/dashboard');
          }
        });
      }
    } catch (e) {
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  Future<void> _handleOAuth(OAuthProvider provider) async {
    setState(() {
      _oauthLoading = provider.name;
      _error = null;
      _success = null;
    });

    try {
      final authService = ref.read(authServiceProvider);
      await authService.startOAuth(
        provider: provider,
        context: context,
      );
      // Supabase SDK automatically handles the redirect and session storage
      // We don't need to manually set session here as AuthStateChangeListener in app_router/auth_provider 
      // should pick it up. But showing some feedback is good.
      
      setState(() {
        _success = 'Opening browser...';
      });
    } catch (e) {
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
      });
    } finally {
      if (mounted) {
        setState(() {
          _oauthLoading = null;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppTheme.spacing8),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: AppTheme.spacing8),
                // Logo
                const Center(
                  child: Logo(
                    size: 120,
                    showFullName: false,
                  ),
                ),
                const SizedBox(height: AppTheme.spacing8),
                // Header
                Text(
                  _isLoginMode
                      ? 'Welcome back to Layerly.'
                      : 'Create your Layerly account.',
                  style: const TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.slate900,
                  ),
                ),
                const SizedBox(height: AppTheme.spacing2),
                Text(
                  _isLoginMode
                      ? 'Sign in to manage your 3D printing quotes.'
                      : 'Join thousands of creators optimized their workflow.',
                  style: const TextStyle(
                    fontSize: 16,
                    color: AppTheme.slate500,
                  ),
                ),
                const SizedBox(height: AppTheme.spacing8),
                // Name field (only for register)
                if (!_isLoginMode) ...[
                  AppTextField(
                    label: 'Full Name',
                    controller: _nameController,
                    hint: 'John Doe',
                    leftIcon: const Icon(
                      Icons.person_outline,
                      color: AppTheme.blue600,
                      size: 20,
                    ),
                  ),
                  const SizedBox(height: AppTheme.spacing5),
                ],
                // Email field
                AppTextField(
                  label: 'Email address',
                  controller: _emailController,
                  hint: 'Email',
                  keyboardType: TextInputType.emailAddress,
                  leftIcon: const Icon(
                    Icons.email_outlined,
                    color: AppTheme.blue600,
                    size: 20,
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter your email';
                    }
                    if (!value.contains('@')) {
                      return 'Please enter a valid email';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: AppTheme.spacing5),
                // Password field
                AppTextField(
                  label: 'Password',
                  controller: _passwordController,
                  hint: 'Password',
                  obscureText: true,
                  leftIcon: const Icon(
                    Icons.lock_outline,
                    color: AppTheme.blue600,
                    size: 20,
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter your password';
                    }
                    if (value.length < 6) {
                      return 'Password must be at least 6 characters';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: AppTheme.spacing5),
                // Error/Success messages
                if (_error != null) ...[
                  ErrorBanner(
                    message: _error!,
                    onDismiss: () => setState(() => _error = null),
                  ),
                  const SizedBox(height: AppTheme.spacing5),
                ],
                if (_success != null) ...[
                  SuccessBanner(message: _success!),
                  const SizedBox(height: AppTheme.spacing5),
                ],
                // Submit button
                PrimaryButton(
                  text: _isLoginMode ? 'Log in' : 'Create account',
                  onPressed: _handleSubmit,
                  isLoading: _isLoading,
                  fullWidth: true,
                ),
                if (_isLoginMode) ...[
                  const SizedBox(height: AppTheme.spacing5),
                  Row(
                    children: [
                      Expanded(child: Divider(color: AppTheme.slate200)),
                      const Padding(
                        padding: EdgeInsets.symmetric(horizontal: AppTheme.spacing3),
                        child: Text(
                          'or',
                          style: TextStyle(color: AppTheme.slate500),
                        ),
                      ),
                      Expanded(child: Divider(color: AppTheme.slate200)),
                    ],
                  ),
                  const SizedBox(height: AppTheme.spacing5),
                  OutlineButton(
                    text: 'Continue with Google',
                    icon: Icons.g_mobiledata,
                    onPressed: (_isLoading || _oauthLoading != null)
                        ? null
                        : () => _handleOAuth(OAuthProvider.google),
                    isLoading: _oauthLoading == OAuthProvider.google.name,
                    fullWidth: true,
                  ),
                  const SizedBox(height: AppTheme.spacing3),
                  OutlineButton(
                    text: 'Continue with GitHub',
                    icon: Icons.code,
                    onPressed: (_isLoading || _oauthLoading != null)
                        ? null
                        : () => _handleOAuth(OAuthProvider.github),
                    isLoading: _oauthLoading == OAuthProvider.github.name,
                    fullWidth: true,
                  ),
                ],
                const SizedBox(height: AppTheme.spacing6),
                // Toggle mode
                TextButton(
                  onPressed: _isLoading
                      ? null
                      : () {
                          setState(() {
                            _isLoginMode = !_isLoginMode;
                            _error = null;
                            _success = null;
                          });
                        },
                  child: Text(
                    _isLoginMode
                        ? "Don't have an account? Sign up"
                        : 'Already have an account? Sign in',
                    style: const TextStyle(
                      color: AppTheme.blue600,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
