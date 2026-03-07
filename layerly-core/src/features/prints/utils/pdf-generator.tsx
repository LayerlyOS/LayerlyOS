import { pdf } from '@react-pdf/renderer';
import type { PrintEntry } from '@/types';
import PrintsReportDocument from '../components/PrintsReportDocument';

export const generatePrintsReportPDF = async (
  items: PrintEntry[]
) => {
  // Create PDF blob
  const blob = await pdf(<PrintsReportDocument items={items} />).toBlob();

  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;

  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `Prints_Report_${dateStr}.pdf`;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
