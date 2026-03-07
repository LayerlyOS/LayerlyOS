import 'print.dart';

enum OrderStatus {
  quote,
  inProduction,
  ready,
  shipped;

  static OrderStatus fromString(String value) {
    switch (value.toUpperCase()) {
      case 'QUOTE':
        return OrderStatus.quote;
      case 'IN_PRODUCTION':
        return OrderStatus.inProduction;
      case 'READY':
        return OrderStatus.ready;
      case 'SHIPPED':
        return OrderStatus.shipped;
      default:
        return OrderStatus.quote;
    }
  }

  String toApiString() {
    switch (this) {
      case OrderStatus.quote:
        return 'QUOTE';
      case OrderStatus.inProduction:
        return 'IN_PRODUCTION';
      case OrderStatus.ready:
        return 'READY';
      case OrderStatus.shipped:
        return 'SHIPPED';
    }
  }

  String get displayName {
    switch (this) {
      case OrderStatus.quote:
        return 'Quote';
      case OrderStatus.inProduction:
        return 'In Production';
      case OrderStatus.ready:
        return 'Ready';
      case OrderStatus.shipped:
        return 'Shipped';
    }
  }
}

class Order {
  final String id;
  final String userId;
  final String? customerId;
  final String title;
  final String? customerName;
  final OrderStatus status;
  final String? shareToken;
  final DateTime? deadline;
  final String? notes;
  final DateTime createdAt;
  final DateTime updatedAt;
  final List<Print> printEntries;

  const Order({
    required this.id,
    required this.userId,
    this.customerId,
    required this.title,
    this.customerName,
    required this.status,
    this.shareToken,
    this.deadline,
    this.notes,
    required this.createdAt,
    required this.updatedAt,
    this.printEntries = const [],
  });

  factory Order.fromJson(Map<String, dynamic> json) {
    return Order(
      id: json['id'] as String? ?? '',
      userId: json['userId'] as String? ?? '',
      customerId: json['customerId'] as String?,
      title: json['title'] as String? ?? '',
      customerName: json['customerName'] as String?,
      status: OrderStatus.fromString(json['status'] as String? ?? 'QUOTE'),
      shareToken: json['shareToken'] as String?,
      deadline: json['deadline'] != null 
          ? (json['deadline'] is String 
              ? DateTime.parse(json['deadline'] as String)
              : DateTime.tryParse(json['deadline'].toString()))
          : null,
      notes: json['notes'] as String?,
      createdAt: json['createdAt'] != null
          ? (json['createdAt'] is String
              ? DateTime.parse(json['createdAt'] as String)
              : DateTime.now())
          : DateTime.now(),
      updatedAt: json['updatedAt'] != null
          ? (json['updatedAt'] is String
              ? DateTime.parse(json['updatedAt'] as String)
              : DateTime.now())
          : DateTime.now(),
      printEntries: (json['printEntries'] as List<dynamic>?)
              ?.map((e) {
                try {
                  return Print.fromJson(e as Map<String, dynamic>);
                } catch (err) {
                  // Skip invalid print entries
                  return null;
                }
              })
              .whereType<Print>()
              .toList() ??
          [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      if (customerId != null) 'customerId': customerId,
      'title': title,
      if (customerName != null) 'customerName': customerName,
      'status': status.toApiString(),
      if (shareToken != null) 'shareToken': shareToken,
      if (deadline != null) 'deadline': deadline!.toIso8601String(),
      if (notes != null) 'notes': notes,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'printEntries': printEntries.map((e) => e.toJson()).toList(),
    };
  }
}
