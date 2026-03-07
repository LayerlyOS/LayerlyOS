class User {
  final String id;
  final String email;
  final String? name;
  final String? image;
  final bool isAdmin;
  final String? subscriptionTier;
  final bool? emailVerified;
  final String? role;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const User({
    required this.id,
    required this.email,
    this.name,
    this.image,
    this.isAdmin = false,
    this.subscriptionTier,
    this.emailVerified,
    this.role,
    this.createdAt,
    this.updatedAt,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    // Safely parse dates - handle both String and DateTime
    DateTime? parseDate(dynamic value) {
      if (value == null) return null;
      if (value is DateTime) return value;
      if (value is String) {
        try {
          return DateTime.parse(value);
        } catch (_) {
          return null;
        }
      }
      return null;
    }

    return User(
      id: json['id']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      name: json['name']?.toString(),
      image: json['image']?.toString(),
      isAdmin: json['isAdmin'] as bool? ?? false,
      subscriptionTier: json['subscriptionTier']?.toString(),
      emailVerified: json['emailVerified'] as bool?,
      role: json['role']?.toString(),
      createdAt: parseDate(json['createdAt']),
      updatedAt: parseDate(json['updatedAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      if (name != null) 'name': name,
      if (image != null) 'image': image,
      'isAdmin': isAdmin,
      if (subscriptionTier != null) 'subscriptionTier': subscriptionTier,
      if (emailVerified != null) 'emailVerified': emailVerified,
      if (role != null) 'role': role,
      if (createdAt != null) 'createdAt': createdAt!.toIso8601String(),
      if (updatedAt != null) 'updatedAt': updatedAt!.toIso8601String(),
    };
  }
}
