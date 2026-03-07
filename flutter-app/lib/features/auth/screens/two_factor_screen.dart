import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../shared/providers/auth_provider.dart';
import '../../../shared/widgets/buttons/primary_button.dart';
import '../../../shared/widgets/common/error_banner.dart';
import '../../../shared/widgets/common/success_banner.dart';
import '../../../shared/widgets/inputs/text_field.dart';
import '../../../shared/theme/app_theme.dart';
import '../../../shared/models/session.dart';
import '../services/auth_service.dart';

class TwoFactorScreen extends ConsumerStatefulWidget {
  const TwoFactorScreen({super.key});

  @override
  ConsumerState<TwoFactorScreen> createState() => _TwoFactorScreenState();
}

class _TwoFactorScreenState extends ConsumerState<TwoFactorScreen> {
  final _codeController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  bool _isTotpMode = true;
  bool _isLoading = false;
  bool _trustDevice = true;
  String? _error;
  String? _success;

  @override
  void dispose() {
    _codeController.dispose();
    super.dispose();
  }

  Future<void> _handleVerify() async {
    if (!_formKey.currentState!.validate()) return;

    final code = _codeController.text.trim();
    if (_isTotpMode && code.replaceAll(RegExp(r'\D'), '').length < 6) {
      setState(() {
        _error = 'Enter 6 digits';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
      _success = null;
    });

    try {
      final authService = ref.read(authServiceProvider);
      final authNotifier = ref.read(authProvider.notifier);

      Session session;
      if (_isTotpMode) {
        session = await authService.verifyTotp(
          code: code,
          trustDevice: _trustDevice,
        );
      } else {
        session = await authService.verifyBackupCode(
          code: code,
          trustDevice: _trustDevice,
        );
      }

      await authNotifier.setSession(session);

      setState(() {
        _success = '✓ Verified. Redirecting...';
      });

      Future.delayed(const Duration(milliseconds: 500), () {
        if (mounted) {
          context.go('/dashboard');
        }
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
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppTheme.spacing8),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: AppTheme.spacing12),
                // Logo placeholder
                const Text(
                  'Layerly',
                  style: TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.slate900,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: AppTheme.spacing12),
                // Header
                const Text(
                  '2FA verification',
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.slate900,
                  ),
                ),
                const SizedBox(height: AppTheme.spacing2),
                const Text(
                  'Your account is protected. Enter the code to continue.',
                  style: TextStyle(
                    fontSize: 16,
                    color: AppTheme.slate500,
                  ),
                ),
                const SizedBox(height: AppTheme.spacing8),
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
                // Mode selector
                Container(
                  padding: const EdgeInsets.all(AppTheme.spacing1),
                  decoration: BoxDecoration(
                    color: AppTheme.slate50,
                    borderRadius: BorderRadius.circular(AppTheme.radiusLg),
                    border: Border.all(color: AppTheme.slate200),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: _ModeButton(
                          text: '2FA code',
                          isSelected: _isTotpMode,
                          onTap: () {
                            setState(() {
                              _isTotpMode = true;
                              _codeController.clear();
                              _error = null;
                            });
                          },
                        ),
                      ),
                      // Backup codes not supported yet
                      // Expanded(
                      //   child: _ModeButton(
                      //     text: 'Backup code',
                      //     isSelected: !_isTotpMode,
                      //     onTap: () {
                      //       setState(() {
                      //         _isTotpMode = false;
                      //         _codeController.clear();
                      //         _error = null;
                      //       });
                      //     },
                      //   ),
                      // ),
                    ],
                  ),
                ),
                const SizedBox(height: AppTheme.spacing5),
                // Code input
                if (_isTotpMode)
                  _OtpInput(
                    controller: _codeController,
                    onComplete: _handleVerify,
                  )
                else
                  AppTextField(
                    label: 'Backup code',
                    controller: _codeController,
                    hint: 'ABCD-EFGH',
                    leftIcon: const Icon(
                      Icons.key_outlined,
                      color: AppTheme.blue600,
                      size: 20,
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Enter the backup code';
                      }
                      return null;
                    },
                  ),
                const SizedBox(height: AppTheme.spacing5),
                // Trust device checkbox
                CheckboxListTile(
                  value: _trustDevice,
                  onChanged: (value) {
                    setState(() {
                      _trustDevice = value ?? true;
                    });
                  },
                  title: const Text(
                    'Trust this device (30 days)',
                    style: TextStyle(
                      fontSize: 14,
                      color: AppTheme.slate600,
                    ),
                  ),
                  contentPadding: EdgeInsets.zero,
                  controlAffinity: ListTileControlAffinity.leading,
                ),
                const SizedBox(height: AppTheme.spacing5),
                // Verify button
                PrimaryButton(
                  text: 'Verify',
                  onPressed: _handleVerify,
                  isLoading: _isLoading,
                  fullWidth: true,
                ),
                const SizedBox(height: AppTheme.spacing4),
                // Back to login
                TextButton(
                  onPressed: _isLoading
                      ? null
                      : () => context.go('/login'),
                  child: const Text(
                    'Back to login',
                    style: TextStyle(
                      color: AppTheme.slate500,
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

class _ModeButton extends StatelessWidget {
  final String text;
  final bool isSelected;
  final VoidCallback onTap;

  const _ModeButton({
    required this.text,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: AppTheme.spacing2),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.white : Colors.transparent,
          borderRadius: BorderRadius.circular(AppTheme.radiusMd),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.05),
                    blurRadius: 4,
                    offset: const Offset(0, 1),
                  ),
                ]
              : null,
        ),
        child: Text(
          text,
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: isSelected ? AppTheme.blue600 : AppTheme.slate500,
          ),
        ),
      ),
    );
  }
}

class _OtpInput extends StatefulWidget {
  final TextEditingController controller;
  final VoidCallback onComplete;

  const _OtpInput({
    required this.controller,
    required this.onComplete,
  });

  @override
  State<_OtpInput> createState() => _OtpInputState();
}

class _OtpInputState extends State<_OtpInput> {
  final List<TextEditingController> _controllers =
      List.generate(6, (_) => TextEditingController());
  final List<FocusNode> _focusNodes = List.generate(6, (_) => FocusNode());

  @override
  void dispose() {
    for (var controller in _controllers) {
      controller.dispose();
    }
    for (var node in _focusNodes) {
      node.dispose();
    }
    super.dispose();
  }

  void _onChanged(int index, String value) {
    if (value.length == 1) {
      // Update main controller
      String currentCode = '';
      for (int i = 0; i < 6; i++) {
        if (i == index) {
          currentCode += value;
        } else {
          currentCode += _controllers[i].text;
        }
      }
      widget.controller.text = currentCode;

      if (index < 5) {
        _focusNodes[index + 1].requestFocus();
      } else {
        _focusNodes[index].unfocus();
        if (widget.controller.text.length == 6) {
          widget.onComplete();
        }
      }
    } else if (value.isEmpty && index > 0) {
      // Handle backspace
      _focusNodes[index - 1].requestFocus();
      // Update main controller
       String currentCode = '';
      for (int i = 0; i < 6; i++) {
        if (i == index) {
           // empty
        } else {
          currentCode += _controllers[i].text;
        }
      }
      widget.controller.text = currentCode;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: List.generate(
        6,
        (index) => SizedBox(
          width: 50,
          child: TextField(
            controller: _controllers[index],
            focusNode: _focusNodes[index],
            textAlign: TextAlign.center,
            keyboardType: TextInputType.number,
            maxLength: 1,
            inputFormatters: [FilteringTextInputFormatter.digitsOnly],
            onChanged: (value) => _onChanged(index, value),
            decoration: InputDecoration(
              counterText: '',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(AppTheme.radiusMd),
                borderSide: const BorderSide(color: AppTheme.slate200),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(AppTheme.radiusMd),
                borderSide: const BorderSide(
                  color: AppTheme.blue600,
                  width: 2,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
