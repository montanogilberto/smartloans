import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import type { jsPDF } from 'jspdf';

/**
 * Hands a generated PDF to the user.
 *   - Web: a normal browser download (`doc.save`).
 *   - iOS / Android: `doc.save` does nothing inside the WebView, so the PDF is
 *     written to the app's cache and opened in the share sheet, where the user
 *     can save it to Files / Drive or send it.
 */
export async function savePdf(doc: jsPDF, fileName: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    doc.save(fileName);
    return;
  }
  const base64 = doc.output('datauristring').split(',')[1];
  const { uri } = await Filesystem.writeFile({
    path: fileName,
    data: base64,
    directory: Directory.Cache,
  });
  try {
    await Share.share({ title: fileName, files: [uri] });
  } catch (err) {
    // Closing the share sheet without choosing an app is not an error.
    if (!/cancel/i.test(String((err as Error)?.message ?? err))) throw err;
  }
}
