import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';

class SuccessBanner extends StatelessWidget {
  final String message;

  const SuccessBanner({
    super.key,
    required this.message,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppTheme.spacing3),
      decoration: BoxDecoration(
        color: AppTheme.green50,
        border: Border.all(color: AppTheme.green200),
        borderRadius: BorderRadius.circular(AppTheme.radiusLg),
      ),
      child: Row(
        children: [
          const Icon(
            Icons.check_circle_outline,
            color: AppTheme.green600,
            size: 20,
          ),
          const SizedBox(width: AppTheme.spacing2),
          Expanded(
            child: Text(
              message,
              style: const TextStyle(
                color: AppTheme.green600,
                fontSize: 14,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
