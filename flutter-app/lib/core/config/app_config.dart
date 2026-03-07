import 'dart:io';
import 'package:flutter/foundation.dart';

class AppConfig {
  // Base URL for API - change this to your production URL
  // For Android emulator: use 10.0.2.2 instead of localhost
  // For physical device: use your computer's local IP address (e.g., 192.168.1.100)
  static String get baseUrl {
    final envUrl = const String.fromEnvironment('API_BASE_URL');
    if (envUrl.isNotEmpty) {
      debugPrint('Using API_BASE_URL from environment: $envUrl');
      return envUrl;
    }
    
    // Dev URL for local testing
    // Android Emulator cannot access 'localhost', it uses '10.0.2.2' to access host machine
    final devUrl = (!kIsWeb && Platform.isAndroid) 
        ? 'http://10.0.2.2:3000/api' 
        : 'http://localhost:3000/api';
    
    // Force production URL when not explicitly overridden
    const productionUrl = 'https://layerly.cloud/api';
    
    final url = kDebugMode ? devUrl : productionUrl;

    debugPrint('=== API Configuration ===');
    debugPrint('Mode: ${kDebugMode ? "DEBUG" : "RELEASE"}');
    debugPrint('Platform: ${kIsWeb ? "Web" : Platform.operatingSystem}');
    debugPrint('Using API baseUrl: $url');
    debugPrint('==================================');
    return url;
  }

  // Deep link scheme
  static const String deepLinkScheme = 'layerly';

  // Check if running in debug mode
  static bool get isDebug {
    return kDebugMode;
  }
}
