import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../shared/theme/app_theme.dart';
import '../../../shared/widgets/buttons/primary_button.dart';
import '../../../shared/widgets/inputs/text_field.dart';
import '../providers/prints_provider.dart';

class CalculatorTab extends ConsumerStatefulWidget {
  final VoidCallback? onPrintCreated;

  const CalculatorTab({
    super.key,
    this.onPrintCreated,
  });

  @override
  ConsumerState<CalculatorTab> createState() => _CalculatorTabState();
}

class _CalculatorTabState extends ConsumerState<CalculatorTab> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _weightController = TextEditingController();
  final _timeHController = TextEditingController();
  final _timeMController = TextEditingController();
  final _qtyController = TextEditingController(text: '1');
  final _priceController = TextEditingController();

  bool _isLoading = false;

  @override
  void dispose() {
    _nameController.dispose();
    _weightController.dispose();
    _timeHController.dispose();
    _timeMController.dispose();
    _qtyController.dispose();
    _priceController.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final weight = double.tryParse(_weightController.text) ?? 0;
      final timeH = int.tryParse(_timeHController.text) ?? 0;
      final timeM = int.tryParse(_timeMController.text) ?? 0;
      final qty = int.tryParse(_qtyController.text) ?? 1;
      final price = double.tryParse(_priceController.text) ?? 0;

      // Simple calculation (can be enhanced later)
      const energyRate = 1.15;
      const power = 200.0;
      final hours = timeH + (timeM / 60);
      final energyCost = (power / 1000) * hours * energyRate;
      final materialCost = weight * 0.03; // Placeholder
      final totalCost = energyCost + materialCost;
      final profit = price - totalCost;

      await ref.read(printsProvider.notifier).createPrint(
            name: _nameController.text.trim(),
            weight: weight,
            timeH: timeH,
            timeM: timeM,
            qty: qty,
            price: price,
            profit: profit,
            totalCost: totalCost,
          );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Print saved successfully')),
        );
        _formKey.currentState!.reset();
        _qtyController.text = '1';
        widget.onPrintCreated?.call();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${e.toString()}')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(AppTheme.spacing6),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            AppTextField(
              label: 'Print Name',
              controller: _nameController,
              hint: 'Enter print name',
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Please enter a name';
                }
                return null;
              },
            ),
            const SizedBox(height: AppTheme.spacing5),
            Row(
              children: [
                Expanded(
                  child: AppTextField(
                    label: 'Weight (g)',
                    controller: _weightController,
                    hint: '0',
                    keyboardType: TextInputType.number,
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Required';
                      }
                      if (double.tryParse(value) == null) {
                        return 'Invalid number';
                      }
                      return null;
                    },
                  ),
                ),
                const SizedBox(width: AppTheme.spacing4),
                Expanded(
                  child: AppTextField(
                    label: 'Quantity',
                    controller: _qtyController,
                    hint: '1',
                    keyboardType: TextInputType.number,
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Required';
                      }
                      if (int.tryParse(value) == null) {
                        return 'Invalid number';
                      }
                      return null;
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppTheme.spacing5),
            Row(
              children: [
                Expanded(
                  child: AppTextField(
                    label: 'Time (hours)',
                    controller: _timeHController,
                    hint: '0',
                    keyboardType: TextInputType.number,
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Required';
                      }
                      if (int.tryParse(value) == null) {
                        return 'Invalid number';
                      }
                      return null;
                    },
                  ),
                ),
                const SizedBox(width: AppTheme.spacing4),
                Expanded(
                  child: AppTextField(
                    label: 'Time (minutes)',
                    controller: _timeMController,
                    hint: '0',
                    keyboardType: TextInputType.number,
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Required';
                      }
                      if (int.tryParse(value) == null) {
                        return 'Invalid number';
                      }
                      return null;
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppTheme.spacing5),
            AppTextField(
              label: 'Price',
              controller: _priceController,
              hint: '0.00',
              keyboardType: TextInputType.number,
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Please enter a price';
                }
                if (double.tryParse(value) == null) {
                  return 'Invalid number';
                }
                return null;
              },
            ),
            const SizedBox(height: AppTheme.spacing8),
            PrimaryButton(
              text: 'Save Print',
              onPressed: _handleSubmit,
              isLoading: _isLoading,
              fullWidth: true,
            ),
          ],
        ),
      ),
    );
  }
}
