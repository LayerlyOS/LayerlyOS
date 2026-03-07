import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';

class Logo extends StatelessWidget {
  final double? size;
  final bool showFullName;
  final Color? textColor;

  const Logo({
    super.key,
    this.size,
    this.showFullName = false,
    this.textColor,
  });

  @override
  Widget build(BuildContext context) {
    final logoSize = size ?? 120.0;
    final color = textColor ?? AppTheme.slate900;

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Logo symbol (diamonds)
        SizedBox(
          width: logoSize,
          height: logoSize * 0.6,
          child: CustomPaint(
            painter: _LogoPainter(),
          ),
        ),
        const SizedBox(height: 16),
        // Text with Outfit font (matching web)
        Text(
          showFullName ? 'Layerly.cloud' : 'Layerly',
          style: TextStyle(
            fontSize: showFullName ? 28 : 32,
            fontWeight: FontWeight.w700,
            color: color,
            letterSpacing: -1,
            fontFamily: AppTheme.fontFamilyBold, // Outfit
          ),
        ),
      ],
    );
  }
}

class _LogoPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..style = PaintingStyle.fill;
    final strokePaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1
      ..color = const Color(0xFF4F46E5).withValues(alpha: 0.3);

    // Center the logo
    final centerX = size.width / 2;
    final centerY = size.height / 2;
    final diamondSize = size.width * 0.3;

    // Bottom diamond (slate)
    final bottomPath = Path()
      ..moveTo(centerX - diamondSize, centerY + diamondSize * 0.4)
      ..lineTo(centerX, centerY + diamondSize * 0.8)
      ..lineTo(centerX + diamondSize, centerY + diamondSize * 0.4)
      ..lineTo(centerX, centerY)
      ..close();
    paint.color = const Color(0xFF94A3B8);
    canvas.drawPath(bottomPath, paint);

    // Middle diamond (indigo with opacity)
    final middlePath = Path()
      ..moveTo(centerX - diamondSize, centerY)
      ..lineTo(centerX, centerY + diamondSize * 0.4)
      ..lineTo(centerX + diamondSize, centerY)
      ..lineTo(centerX, centerY - diamondSize * 0.4)
      ..close();
    paint.color = const Color(0xFF6366F1).withValues(alpha: 0.8);
    canvas.drawPath(middlePath, paint);

    // Top diamond (indigo)
    final topPath = Path()
      ..moveTo(centerX - diamondSize, centerY - diamondSize * 0.4)
      ..lineTo(centerX, centerY - diamondSize * 0.8)
      ..lineTo(centerX + diamondSize, centerY - diamondSize * 0.4)
      ..lineTo(centerX, centerY)
      ..close();
    paint.color = const Color(0xFF6366F1);
    canvas.drawPath(topPath, paint);

    // Vertical line
    canvas.drawLine(
      Offset(centerX, centerY),
      Offset(centerX, centerY + diamondSize * 0.8),
      strokePaint,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

// Logo for AppBar (horizontal layout)
class LogoAppBar extends StatelessWidget {
  final Color? textColor;

  const LogoAppBar({
    super.key,
    this.textColor,
  });

  @override
  Widget build(BuildContext context) {
    final color = textColor ?? AppTheme.slate900;

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Logo symbol
        SizedBox(
          width: 40,
          height: 24,
          child: CustomPaint(
            painter: _LogoPainter(),
          ),
        ),
        const SizedBox(width: 12),
        // Text with Outfit font (matching web)
        Text(
          'Layerly',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w700,
            color: color,
            letterSpacing: -0.5,
            fontFamily: AppTheme.fontFamilyBold, // Outfit
          ),
        ),
        Text(
          '.cloud',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w700,
            color: const Color(0xFF6366F1),
            letterSpacing: -0.5,
            fontFamily: AppTheme.fontFamilyBold, // Outfit
          ),
        ),
      ],
    );
  }
}
