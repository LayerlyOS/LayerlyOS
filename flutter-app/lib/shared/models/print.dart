class Print {
  final String id;
  final String userId;
  final String printerId;
  final String? filamentId;
  final String? orderId;
  final String name;
  final String? brand;
  final String? color;
  final double weight;
  final int timeH;
  final int timeM;
  final int qty;
  final double price;
  final double profit;
  final double totalCost;
  final double? priceItem;
  final double? profitTotal;
  final double? costItem;
  final double? extraCost;
  final double? manualPrice;
  final Map<String, dynamic>? advancedSettings;
  final DateTime date;
  final DateTime createdAt;
  final DateTime? updatedAt;
  // Relations
  final Map<String, dynamic>? printer;
  final Map<String, dynamic>? filament;
  final Map<String, dynamic>? order;

  const Print({
    required this.id,
    required this.userId,
    required this.printerId,
    this.filamentId,
    this.orderId,
    required this.name,
    this.brand,
    this.color,
    required this.weight,
    required this.timeH,
    required this.timeM,
    required this.qty,
    required this.price,
    required this.profit,
    required this.totalCost,
    this.priceItem,
    this.profitTotal,
    this.costItem,
    this.extraCost,
    this.manualPrice,
    this.advancedSettings,
    required this.date,
    required this.createdAt,
    this.updatedAt,
    this.printer,
    this.filament,
    this.order,
  });

  factory Print.fromJson(Map<String, dynamic> json) {
    return Print(
      id: json['id'] as String? ?? '',
      userId: json['userId'] as String? ?? '',
      printerId: json['printerId'] as String? ?? '',
      filamentId: json['filamentId'] as String?,
      orderId: json['orderId'] as String?,
      name: json['name'] as String? ?? '',
      brand: json['brand'] as String?,
      color: json['color'] as String?,
      weight: (json['weight'] as num?)?.toDouble() ?? 0.0,
      timeH: (json['timeH'] as num?)?.toInt() ?? 0,
      timeM: (json['timeM'] as num?)?.toInt() ?? 0,
      qty: (json['qty'] as num?)?.toInt() ?? 1,
      price: (json['price'] as num?)?.toDouble() ?? 0.0,
      profit: (json['profit'] as num?)?.toDouble() ?? 0.0,
      totalCost: (json['totalCost'] as num?)?.toDouble() ?? 0.0,
      priceItem: json['priceItem'] != null ? (json['priceItem'] as num?)?.toDouble() : null,
      profitTotal: json['profitTotal'] != null ? (json['profitTotal'] as num?)?.toDouble() : null,
      costItem: json['costItem'] != null ? (json['costItem'] as num?)?.toDouble() : null,
      extraCost: json['extraCost'] != null ? (json['extraCost'] as num?)?.toDouble() : null,
      manualPrice: json['manualPrice'] != null ? (json['manualPrice'] as num?)?.toDouble() : null,
      advancedSettings: json['advancedSettings'] as Map<String, dynamic>?,
      date: json['date'] != null
          ? (json['date'] is String
              ? DateTime.parse(json['date'] as String)
              : DateTime.tryParse(json['date'].toString()) ?? DateTime.now())
          : DateTime.now(),
      createdAt: json['createdAt'] != null
          ? (json['createdAt'] is String
              ? DateTime.parse(json['createdAt'] as String)
              : DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now())
          : DateTime.now(),
      updatedAt: json['updatedAt'] != null
          ? (json['updatedAt'] is String
              ? DateTime.tryParse(json['updatedAt'] as String)
              : DateTime.tryParse(json['updatedAt'].toString()))
          : null,
      printer: json['printer'] as Map<String, dynamic>?,
      filament: json['filament'] as Map<String, dynamic>?,
      order: json['order'] as Map<String, dynamic>?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'printerId': printerId,
      if (filamentId != null) 'filamentId': filamentId,
      if (orderId != null) 'orderId': orderId,
      'name': name,
      if (brand != null) 'brand': brand,
      if (color != null) 'color': color,
      'weight': weight,
      'timeH': timeH,
      'timeM': timeM,
      'qty': qty,
      'price': price,
      'profit': profit,
      'totalCost': totalCost,
      if (priceItem != null) 'priceItem': priceItem,
      if (profitTotal != null) 'profitTotal': profitTotal,
      if (costItem != null) 'costItem': costItem,
      if (extraCost != null) 'extraCost': extraCost,
      if (manualPrice != null) 'manualPrice': manualPrice,
      if (advancedSettings != null) 'advancedSettings': advancedSettings,
      'date': date.toIso8601String(),
      'createdAt': createdAt.toIso8601String(),
      if (updatedAt != null) 'updatedAt': updatedAt!.toIso8601String(),
    };
  }
}
