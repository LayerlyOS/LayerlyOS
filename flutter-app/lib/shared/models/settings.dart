class Settings {
  final String id;
  final String userId;
  final double energyRate;
  final String? defaultPrinterId;
  final bool useGravatar;
  final String language;

  const Settings({
    required this.id,
    required this.userId,
    required this.energyRate,
    this.defaultPrinterId,
    required this.useGravatar,
    required this.language,
  });

  factory Settings.fromJson(Map<String, dynamic> json) {
    return Settings(
      id: json['id'] as String,
      userId: json['userId'] as String,
      energyRate: (json['energyRate'] as num).toDouble(),
      defaultPrinterId: json['defaultPrinterId'] as String?,
      useGravatar: json['useGravatar'] as bool? ?? true,
      language: json['language'] as String? ?? 'en',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'energyRate': energyRate,
      if (defaultPrinterId != null) 'defaultPrinterId': defaultPrinterId,
      'useGravatar': useGravatar,
      'language': language,
    };
  }
}
