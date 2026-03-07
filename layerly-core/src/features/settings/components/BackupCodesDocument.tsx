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
    marginBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 20,
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
  content: {
    marginBottom: 20,
  },
  emailLabel: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 4,
  },
  emailValue: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  codesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  codeBox: {
    width: '48%', // 2 columns with gap
    backgroundColor: '#F8FAFC',
    padding: 15,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
    alignItems: 'center',
  },
  codeText: {
    fontFamily: 'Roboto', // Or Courier if we registered it, but Roboto is fine
    fontSize: 14,
    letterSpacing: 2,
    fontWeight: 'bold',
    color: '#0F172A',
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

interface BackupCodesDocumentProps {
  codes: string[];
  email: string;
}

const BackupCodesDocument: React.FC<BackupCodesDocumentProps> = ({ codes, email }) => {
  const dateStr = new Date().toLocaleDateString('en', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoSection}>
            <Svg width="28" height="28" viewBox="0 0 100 100">
              <Defs>
                <LinearGradient id="pdfBackupGrad" x1="0" y1="0" x2="1" y2="1">
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
                  fill="url(#pdfBackupGrad)"
                />
              </G>
            </Svg>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 10 }}>
              <Text style={styles.logoText}>Layerly</Text>
              <Text style={[styles.logoText, styles.logoDot]}>.</Text>
            </View>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.reportTitle}>TWO-FACTOR RECOVERY CODES</Text>
            <Text style={styles.reportDate}>
              Generated: {dateStr}
            </Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {email && (
            <View>
              <Text style={styles.emailLabel}>Account:</Text>
              <Text style={styles.emailValue}>{email}</Text>
            </View>
          )}

          <View style={styles.codesGrid}>
            {codes.map((code, index) => (
              <View key={index} style={styles.codeBox}>
                <Text style={styles.codeText}>{code}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Layerly • {dateStr}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default BackupCodesDocument;
