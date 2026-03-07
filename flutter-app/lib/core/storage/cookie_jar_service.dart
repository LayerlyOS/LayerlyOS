import 'dart:io';

import 'package:cookie_jar/cookie_jar.dart';
import 'package:flutter/foundation.dart';
import 'package:path_provider/path_provider.dart';

/// Cookie storage for Better Auth session cookies.
///
/// We persist cookies so the user stays signed in across app restarts.
class CookieJarService {
  CookieJarService._();

  static PersistCookieJar? _jar;

  static Future<PersistCookieJar> getJar() async {
    final existing = _jar;
    if (existing != null) return existing;

    final Directory dir = await getApplicationSupportDirectory();
    final Directory cookieDir = Directory('${dir.path}/cookies');
    if (!await cookieDir.exists()) {
      await cookieDir.create(recursive: true);
    }

    final jar = PersistCookieJar(
      storage: FileStorage(cookieDir.path),
      // ignoreExpires keeps cookies around; server-side expiry still matters.
      ignoreExpires: false,
    );
    _jar = jar;
    debugPrint('Cookie jar initialized at: ${cookieDir.path}');
    return jar;
  }

  static Future<void> clear() async {
    final jar = _jar;
    if (jar == null) {
      // If not yet initialized, still try to init and clear persisted data.
      final initialized = await getJar();
      await initialized.deleteAll();
      return;
    }
    await jar.deleteAll();
  }
}

