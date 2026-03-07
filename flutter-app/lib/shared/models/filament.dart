import 'dart:convert';

class Filament {
  final String id;
  final String userId;
  final String materialName;
  final String brand;
  final String color;
  final String? colorHex;
  final String? image;
  final String? materialType;
  final double spoolPrice;
  final double spoolWeight;
  final double? remainingWeight;
  final double? density;
  final double? diameter;
  final int? printTempMin;
  final int? printTempMax;
  final int? bedTemp;
  final int? printSpeed;
  final int? fanSpeed;
  final double? flowRatio;
  final Map<String, dynamic>? mechanicalProps;
  final List<String>? applications;
  final String? website;
  final DateTime createdAt;
  final DateTime? updatedAt;
  final DateTime? deletedAt;

  const Filament({
    required this.id,
    required this.userId,
    required this.materialName,
    required this.brand,
    required this.color,
    this.colorHex,
    this.image,
    this.materialType,
    required this.spoolPrice,
    required this.spoolWeight,
    this.remainingWeight,
    this.density,
    this.diameter,
    this.printTempMin,
    this.printTempMax,
    this.bedTemp,
    this.printSpeed,
    this.fanSpeed,
    this.flowRatio,
    this.mechanicalProps,
    this.applications,
    this.website,
    required this.createdAt,
    this.updatedAt,
    this.deletedAt,
  });

  factory Filament.fromJson(Map<String, dynamic> json) {
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

    return Filament(
      id: json['id'] as String,
      userId: json['userId'] as String? ?? '',
      materialName: json['materialName'] as String,
      brand: json['brand'] as String,
      color: json['color'] as String,
      colorHex: json['colorHex'] as String?,
      image: json['image'] as String?,
      materialType: json['materialType'] as String?,
      spoolPrice: (json['spoolPrice'] as num).toDouble(),
      spoolWeight: (json['spoolWeight'] as num).toDouble(),
      remainingWeight: json['remainingWeight'] != null ? (json['remainingWeight'] as num).toDouble() : null,
      density: json['density'] != null ? (json['density'] as num).toDouble() : null,
      diameter: json['diameter'] != null ? (json['diameter'] as num).toDouble() : null,
      printTempMin: json['printTempMin'] as int?,
      printTempMax: json['printTempMax'] as int?,
      bedTemp: json['bedTemp'] as int?,
      printSpeed: json['printSpeed'] as int?,
      fanSpeed: json['fanSpeed'] as int?,
      flowRatio: json['flowRatio'] != null ? (json['flowRatio'] as num).toDouble() : null,
      mechanicalProps: json['mechanicalProps'] as Map<String, dynamic>?,
      applications: json['applications'] != null ? List<String>.from(json['applications']) : null,
      website: json['website'] as String?,
      createdAt: parseDate(json['createdAt']) ?? DateTime.now(),
      updatedAt: parseDate(json['updatedAt']),
      deletedAt: parseDate(json['deletedAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'materialName': materialName,
      'brand': brand,
      'color': color,
      if (colorHex != null) 'colorHex': colorHex,
      if (image != null) 'image': image,
      if (materialType != null) 'materialType': materialType,
      'spoolPrice': spoolPrice,
      'spoolWeight': spoolWeight,
      if (remainingWeight != null) 'remainingWeight': remainingWeight,
      if (density != null) 'density': density,
      if (diameter != null) 'diameter': diameter,
      if (printTempMin != null) 'printTempMin': printTempMin,
      if (printTempMax != null) 'printTempMax': printTempMax,
      if (bedTemp != null) 'bedTemp': bedTemp,
      if (printSpeed != null) 'printSpeed': printSpeed,
      if (fanSpeed != null) 'fanSpeed': fanSpeed,
      if (flowRatio != null) 'flowRatio': flowRatio,
      if (mechanicalProps != null) 'mechanicalProps': mechanicalProps,
      if (applications != null) 'applications': applications,
      if (website != null) 'website': website,
      'createdAt': createdAt.toIso8601String(),
      if (updatedAt != null) 'updatedAt': updatedAt!.toIso8601String(),
      if (deletedAt != null) 'deletedAt': deletedAt!.toIso8601String(),
    };
  }
}

class GlobalFilament {
  final String id;
  final int? externalId;
  final String materialName;
  final String? materialType;
  final String brand;
  final String color;
  final String? colorHex;
  final double? spoolPrice;
  final double? spoolWeight;
  final double? density;
  final double? diameter;
  final int? printTempMin;
  final int? printTempMax;
  final int? bedTemp;
  final int? printSpeed;
  final int? fanSpeed;
  final double? flowRatio;
  final Map<String, dynamic>? mechanicalProps;
  final List<String>? applications;
  final String? website;
  final String? image;
  final DateTime createdAt;
  final DateTime? updatedAt;

  const GlobalFilament({
    required this.id,
    this.externalId,
    required this.materialName,
    this.materialType,
    required this.brand,
    required this.color,
    this.colorHex,
    this.spoolPrice,
    this.spoolWeight,
    this.density,
    this.diameter,
    this.printTempMin,
    this.printTempMax,
    this.bedTemp,
    this.printSpeed,
    this.fanSpeed,
    this.flowRatio,
    this.mechanicalProps,
    this.applications,
    this.website,
    this.image,
    required this.createdAt,
    this.updatedAt,
  });

  factory GlobalFilament.fromJson(Map<String, dynamic> json) {
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

    Map<String, dynamic>? parseMechanicalProps(dynamic value) {
      if (value == null) return null;
      if (value is Map<String, dynamic>) return value;
      if (value is String) {
        try {
          final decoded = jsonDecode(value) as Map<String, dynamic>;
          return decoded;
        } catch (_) {
          return null;
        }
      }
      return null;
    }

    List<String>? parseApplications(dynamic value) {
      if (value == null) return null;
      if (value is List) {
        try {
          return value.map((e) => e.toString()).toList();
        } catch (_) {
          return null;
        }
      }
      if (value is String) {
        try {
          final decoded = jsonDecode(value) as List;
          return decoded.map((e) => e.toString()).toList();
        } catch (_) {
          return null;
        }
      }
      return null;
    }

    return GlobalFilament(
      id: json['id'] as String,
      externalId: json['externalId'] as int?,
      materialName: json['materialName'] as String,
      materialType: json['materialType'] as String?,
      brand: json['brand'] as String,
      color: json['color'] as String,
      colorHex: json['colorHex'] as String?,
      spoolPrice: json['spoolPrice'] != null ? (json['spoolPrice'] as num).toDouble() : null,
      spoolWeight: json['spoolWeight'] != null ? (json['spoolWeight'] as num).toDouble() : null,
      density: json['density'] != null ? (json['density'] as num).toDouble() : null,
      diameter: json['diameter'] != null ? (json['diameter'] as num).toDouble() : null,
      printTempMin: json['printTempMin'] as int?,
      printTempMax: json['printTempMax'] as int?,
      bedTemp: json['bedTemp'] as int?,
      printSpeed: json['printSpeed'] as int?,
      fanSpeed: json['fanSpeed'] as int?,
      flowRatio: json['flowRatio'] != null ? (json['flowRatio'] as num).toDouble() : null,
      mechanicalProps: parseMechanicalProps(json['mechanicalProps']),
      applications: parseApplications(json['applications']),
      website: json['website'] as String?,
      image: json['image'] as String?,
      createdAt: parseDate(json['createdAt']) ?? DateTime.now(),
      updatedAt: parseDate(json['updatedAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      if (externalId != null) 'externalId': externalId,
      'materialName': materialName,
      if (materialType != null) 'materialType': materialType,
      'brand': brand,
      'color': color,
      if (colorHex != null) 'colorHex': colorHex,
      if (spoolPrice != null) 'spoolPrice': spoolPrice,
      if (spoolWeight != null) 'spoolWeight': spoolWeight,
      if (density != null) 'density': density,
      if (diameter != null) 'diameter': diameter,
      if (printTempMin != null) 'printTempMin': printTempMin,
      if (printTempMax != null) 'printTempMax': printTempMax,
      if (bedTemp != null) 'bedTemp': bedTemp,
      if (printSpeed != null) 'printSpeed': printSpeed,
      if (fanSpeed != null) 'fanSpeed': fanSpeed,
      if (flowRatio != null) 'flowRatio': flowRatio,
      if (mechanicalProps != null) 'mechanicalProps': mechanicalProps,
      if (applications != null) 'applications': applications,
      if (website != null) 'website': website,
      if (image != null) 'image': image,
      'createdAt': createdAt.toIso8601String(),
      if (updatedAt != null) 'updatedAt': updatedAt!.toIso8601String(),
    };
  }
}
