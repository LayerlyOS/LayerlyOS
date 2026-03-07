import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'core/config/deep_link_handler.dart';
import 'core/config/supabase_config.dart';
import 'core/router/app_router.dart';
import 'shared/theme/app_theme.dart';
import 'features/auth/services/auth_service.dart';

void main() async {
  runZonedGuarded(() async {
    WidgetsFlutterBinding.ensureInitialized();
    
    // Initialize Supabase
    await SupabaseConfig.initialize();
    
    runApp(
      const ProviderScope(
        child: LayerlyApp(),
      ),
    );
  }, (error, stack) {
    debugPrint('Unhandled error: $error');
    if (error is AuthApiException && error.statusCode == '401') {
      debugPrint('CRITICAL: Invalid API Key. Please check SupabaseConfig.anonKey');
    }
  });
}

class LayerlyApp extends ConsumerStatefulWidget {
  const LayerlyApp({super.key});

  @override
  ConsumerState<LayerlyApp> createState() => _LayerlyAppState();
}

class _LayerlyAppState extends ConsumerState<LayerlyApp> {
  @override
  void initState() {
    super.initState();
    // Initialize deep link handler
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(deepLinkHandlerProvider).initialize(ref);
    });
  }

  @override
  Widget build(BuildContext context) {
    final router = ref.watch(routerProvider);

    return Directionality(
      textDirection: TextDirection.ltr,
      child: Stack(
        children: [
          MaterialApp.router(
            title: 'Layerly',
            theme: AppTheme.lightTheme,
            routerConfig: router,
            debugShowCheckedModeBanner: false,
          ),
          if (kDebugMode)
            Positioned(
              bottom: 50,
              left: 20,
              child: FloatingActionButton(
                onPressed: () async {
                  debugPrint('Clearing all data...');
                  final authService = ref.read(authServiceProvider);
                  await authService.signOut();
                  // Trigger router refresh manually if needed, or rely on auth state listener
                  debugPrint('Data cleared & Signed out');
                  ScaffoldMessenger.of(router.routerDelegate.navigatorKey.currentContext!)
                      .showSnackBar(const SnackBar(content: Text('Data cleared & Signed out')));
                },
                backgroundColor: Colors.red,
                child: const Icon(Icons.delete_forever, color: Colors.white),
              ),
            ),
        ],
      ),
    );
  }
}
