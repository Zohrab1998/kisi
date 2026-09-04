import QRCode from "qrcode";

export function tablePayUrl(baseUrl: string, qrToken: string): string {
  return `${baseUrl}/pay/${qrToken}`;
}

export async function tableQrPngDataUrl(baseUrl: string, qrToken: string): Promise<string> {
  return QRCode.toDataURL(tablePayUrl(baseUrl, qrToken), {
    width: 512,
    margin: 2,
  });
}
