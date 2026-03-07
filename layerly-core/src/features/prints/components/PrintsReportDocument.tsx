import {
  Document,
  Defs,
  Font,
  G,
  LinearGradient,
  Page,
  Path,
  Stop,
  StyleSheet,
  Svg,
  Text,
  View,
} from '@react-pdf/renderer';
import type React from 'react';
import { getCost, getPrice, getProfit } from '@/features/prints/utils';
import { formatCurrency } from '@/lib/format';
import type { PrintEntry } from '@/types';

// Register fonts with extended character support
Font.register({
  family: 'Roboto',
  fonts: [
    { src: '/fonts/Roboto-Regular.ttf' },
    { src: '/fonts/Roboto-Bold.ttf', fontWeight: 'bold' },
  ],
});

Font.register({
  family: 'Outfit',
  fonts: [{ src: '/fonts/Outfit-Bold.ttf', fontWeight: 'bold' }],
});

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontFamily: 'Roboto',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 10,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Outfit',
    color: '#131522',
    marginLeft: 10,
  },
  logoDot: {
    color: '#5C3DE6',
  },
  headerInfo: {
    alignItems: 'flex-end',
  },
  reportTitle: {
    fontSize: 10,
    color: '#64748B', // Slate 500
    textTransform: 'uppercase',
  },
  reportDate: {
    fontSize: 10,
    color: '#64748B', // Slate 500
    marginTop: 4,
  },
  summarySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#F8FAFC', // Slate 50
    borderRadius: 4,
    padding: 10,
  },
  summaryCardHighlight: {
    flex: 1,
    backgroundColor: '#F0FDF4', // Green 50
    borderRadius: 4,
    padding: 10,
  },
  summaryLabel: {
    fontSize: 8,
    color: '#64748B', // Slate 500
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A', // Slate 900
  },
  summaryValueHighlight: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#15803D', // Green 700
  },
  table: {
    width: '100%',
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC', // Slate 50
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  colDate: { width: '15%' },
  colProject: { width: '25%' },
  colBrand: { width: '20%' },
  colCost: { width: '12%', textAlign: 'right' },
  colPrice: { width: '12%', textAlign: 'right' },
  colQty: { width: '6%', textAlign: 'center' },
  colProfit: { width: '10%', textAlign: 'right' },

  tableHeaderText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#64748B', // Slate 500
  },
  tableCellText: {
    fontSize: 9,
    color: '#334155', // Slate 700
  },
  tableCellProfit: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#16A34A', // Green 600
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 10,
  },
  footerText: {
    fontSize: 8,
    color: '#94A3B8',
  },
});

interface PrintsReportDocumentProps {
  items: PrintEntry[];
}

const PrintsReportDocument: React.FC<PrintsReportDocumentProps> = ({ items }) => {
  // Calculations
  const totalPrints = items.length;
  const totalWeight = items.reduce((acc, item) => acc + item.weight, 0) / 1000;
  const totalCost = items.reduce((acc, item) => acc + getCost(item), 0);
  const totalProfit = items.reduce((acc, item) => acc + getProfit(item), 0);

  const dateStr = new Date().toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoSection}>
            <Svg width="28" height="28" viewBox="0 0 100 100">
              <Defs>
                <LinearGradient id="pdfReportGrad" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0%" stopColor="#B282FF" />
                  <Stop offset="100%" stopColor="#7C41FF" />
                </LinearGradient>
              </Defs>
              <G transform="translate(20, 20)">
                <Path
                  d="M 10 50 L 45 66 L 80 50 L 80 64 L 45 80 L 10 64 Z"
                  fill="#351C75"
                />
                <Path
                  d="M 10 31 L 45 47 L 80 31 L 80 45 L 45 61 L 10 45 Z"
                  fill="#6A36DF"
                />
                <Path
                  d="M 45 10 L 80 26 L 45 42 L 10 26 Z"
                  fill="url(#pdfReportGrad)"
                />
              </G>
            </Svg>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 10 }}>
              <Text style={styles.logoText}>Layerly</Text>
              <Text style={[styles.logoText, styles.logoDot]}>.</Text>
            </View>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.reportTitle}>PRINTS REPORT</Text>
            <Text style={styles.reportDate}>
              Generated on: {dateStr}
            </Text>
          </View>
        </View>

        {/* Summary Cards */}
        <View style={styles.summarySection}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>TOTAL PRINTS</Text>
            <Text style={styles.summaryValue}>{totalPrints}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>TOTAL WEIGHT (KG)</Text>
            <Text style={styles.summaryValue}>{totalWeight.toFixed(2)} kg</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>TOTAL COST</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totalCost)}</Text>
          </View>
          <View style={styles.summaryCardHighlight}>
            <Text style={styles.summaryLabel}>TOTAL PROFIT</Text>
            <Text style={styles.summaryValueHighlight}>
              {formatCurrency(totalProfit)}
            </Text>
          </View>
        </View>

        {/* Table Header */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colDate]}>
              DATE
            </Text>
            <Text style={[styles.tableHeaderText, styles.colProject]}>
              PROJECT
            </Text>
            <Text style={[styles.tableHeaderText, styles.colBrand]}>
              BRAND
            </Text>
            <Text style={[styles.tableHeaderText, styles.colCost]}>
              COST
            </Text>
            <Text style={[styles.tableHeaderText, styles.colPrice]}>
              PRICE
            </Text>
            <Text style={[styles.tableHeaderText, styles.colQty]}>
              QTY
            </Text>
            <Text style={[styles.tableHeaderText, styles.colProfit]}>
              PROFIT
            </Text>
          </View>

          {/* Table Rows */}
          {items.map((item) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={[styles.tableCellText, styles.colDate]}>
                {new Date(item.date).toLocaleDateString('en-GB')}
              </Text>
              <Text style={[styles.tableCellText, styles.colProject]}>{item.name}</Text>
              <Text style={[styles.tableCellText, styles.colBrand]}>
                {item.brand || item.filament?.brand || '-'}
              </Text>
              <Text style={[styles.tableCellText, styles.colCost]}>
                {formatCurrency(getCost(item))}
              </Text>
              <Text style={[styles.tableCellText, styles.colPrice]}>
                {formatCurrency(getPrice(item))}
              </Text>
              <Text style={[styles.tableCellText, styles.colQty]}>{item.qty || 1}</Text>
              <Text style={[styles.tableCellProfit, styles.colProfit]}>
                {formatCurrency(getProfit(item))}
              </Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Generated by Layerly • {dateStr}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default PrintsReportDocument;
