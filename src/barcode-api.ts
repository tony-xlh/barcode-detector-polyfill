/**
 * This interface is to implement barcode API as specified here:
 * https://developer.mozilla.org/en-US/docs/Web/API/BarcodeDetector
 */

export type BarcodeFormat =
  | "aztec"
  | "code_128"
  | "code_39"
  | "code_93"
  | "codabar"
  | "data_matrix"
  | "ean_13"
  | "ean_8"
  | "itf"
  | "pdf417"
  | "qr_code"
  | "upc_a"
  | "upc_e"
  | "unknown";

export interface IBarcodeOptions<BFormat = BarcodeFormat> {
  formats: BFormat[];
}

export interface DetectedBarcode {
  boundingBox: DOMRectReadOnly;
  cornerPoints: { x: number; y: number }[];
  format: string;
  rawValue: string;
}

export interface IBarcodeDetector {
  detect(image: ImageBitmapSource): Promise<DetectedBarcode[]>;
}

export abstract class BarcodeDetectorAbs<BFormat = BarcodeFormat>
  implements IBarcodeDetector
{
  public constructor(private options?: IBarcodeOptions<BFormat>) {}
  public abstract detect(image: ImageBitmapSource): Promise<DetectedBarcode[]>;

  public static getSupportedFormats(): Promise<BarcodeFormat[]> {
    return Promise.resolve<BarcodeFormat[]>(["unknown"]);
  }
}
