import { pdf } from '@react-pdf/renderer';
import BackupCodesDocument from '../components/BackupCodesDocument';

export const generateBackupCodesPDF = async (
  codes: string[],
  email: string
) => {
  // Create PDF blob
  const blob = await pdf(
    <BackupCodesDocument codes={codes} email={email} />
  ).toBlob();

  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;

  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `2fa_backup_codes_${dateStr}.pdf`;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
