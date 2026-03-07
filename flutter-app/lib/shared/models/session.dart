import 'user.dart';

class Session {
  final User user;
  final SessionToken? session;
  final bool twoFactorRequired;

  const Session({
    required this.user,
    this.session,
    this.twoFactorRequired = false,
  });

  factory Session.fromJson(Map<String, dynamic> json) {
    return Session(
      user: User.fromJson(json['user'] as Map<String, dynamic>),
      session: json['session'] != null
          ? SessionToken.fromJson(json['session'] as Map<String, dynamic>)
          : null,
      twoFactorRequired: json['twoFactorRequired'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'user': user.toJson(),
      if (session != null) 'session': session!.toJson(),
      'twoFactorRequired': twoFactorRequired,
    };
  }
}

class SessionToken {
  final String token;
  final DateTime expiresAt;

  const SessionToken({
    required this.token,
    required this.expiresAt,
  });

  factory SessionToken.fromJson(Map<String, dynamic> json) {
    // Safely parse expiresAt - handle both String and DateTime
    DateTime parseExpiresAt(dynamic value) {
      if (value is DateTime) return value;
      if (value is String) {
        return DateTime.parse(value);
      }
      throw Exception('Invalid expiresAt format');
    }

    return SessionToken(
      token: json['token']?.toString() ?? '',
      expiresAt: parseExpiresAt(json['expiresAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'token': token,
      'expiresAt': expiresAt.toIso8601String(),
    };
  }
}
