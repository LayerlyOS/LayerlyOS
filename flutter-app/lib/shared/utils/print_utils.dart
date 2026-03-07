import '../models/print.dart';

// Helper functions matching web app's utils.ts
double getCost(Print item) {
  return item.costItem ?? item.totalCost;
}

double getPrice(Print item) {
  return item.priceItem ?? item.price;
}

double getProfit(Print item) {
  return item.profitTotal ?? item.profit;
}
