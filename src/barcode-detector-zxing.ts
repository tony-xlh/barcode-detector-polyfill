import {
  BinaryBitmap,
  HybridBinarizer,
  RGBLuminanceSource,
  BarcodeFormat as ZXBFormat,
  Result as ZXResult,
  DecodeHintType,
} from "@zxing/library";
import { BrowserMultiFormatReader } from "@zxing/browser";
import {
  BarcodeDetectorAbs,
  IBarcodeOptions,
  BarcodeFormat,
  DetectedBarcode,
} from "./barcode-api.js";

type ZXBarcodeFormat =
  | BarcodeFormat
  | "aztec"
  | "code_39"
  | "code_128"
  | "data_matrix"
  | "ean_8"
  | "ean_13"
  | "itf"
  | "pdf417"
  | "qr_code"
  | "upc_a"
  | "upc_e";

const mapFormat = new Map<ZXBarcodeFormat, ZXBFormat>([
  ["aztec", ZXBFormat.AZTEC],
  ["code_39", ZXBFormat.CODE_39],
  ["code_128", ZXBFormat.CODE_128],
  ["data_matrix", ZXBFormat.DATA_MATRIX],
  ["ean_8", ZXBFormat.EAN_8],
  ["ean_13", ZXBFormat.EAN_13],
  ["itf", ZXBFormat.ITF],
  ["pdf417", ZXBFormat.PDF_417],
  ["qr_code", ZXBFormat.QR_CODE],
  ["upc_a", ZXBFormat.UPC_A],
  ["upc_e", ZXBFormat.UPC_E],
]);

const mapFormatInv = new Map<ZXBFormat, ZXBarcodeFormat>(
  Array.from(mapFormat).map(([key, val]) => [val, key])
);

const allSupportedFormats: ZXBarcodeFormat[] = Array.from(mapFormat.keys());

/**
 * This code was originally copied from here:
 *   https://github.com/zxing-js/browser/blob/d4c22f735f5304b16f2f3d9497a8c82683f5cf68/src/common/HTMLCanvasElementLuminanceSource.ts#L19-L42
 *
 * @param imageBuffer
 * @param width
 * @param height
 * @returns
 */
function toGrayscaleBuffer(
  imageBuffer: Uint8ClampedArray,
  width: number,
  height: number
): Uint8ClampedArray {
  const grayscaleBuffer = new Uint8ClampedArray(width * height);
  for (let i = 0, j = 0, length = imageBuffer.length; i < length; i += 4, j++) {
    let gray;
    const alpha = imageBuffer[i + 3];
    // The color of fully-transparent pixels is irrelevant. They are often, technically, fully-transparent
    // black (0 alpha, and then 0 RGB). They are often used, of course as the "white" area in a
    // barcode image. Force any such pixel to be white:
    if (alpha === 0) {
      gray = 0xff;
    } else {
      const pixelR = imageBuffer[i];
      const pixelG = imageBuffer[i + 1];
      const pixelB = imageBuffer[i + 2];
      // .299R + 0.587G + 0.114B (YUV/YIQ for PAL and NTSC),
      // (306*R) >> 10 is approximately equal to R*0.299, and so on.
      // 0x200 >> 10 is 0.5, it implements rounding.
      // tslint:disable-next-line:no-bitwise
      gray = (306 * pixelR + 601 * pixelG + 117 * pixelB + 0x200) >> 10;
    }
    grayscaleBuffer[j] = gray;
  }
  return grayscaleBuffer;
}

export class BarcodeDetectorZXing extends BarcodeDetectorAbs<ZXBarcodeFormat> {
  private reader: BrowserMultiFormatReader;
  constructor(barcodeDetectorOptions?: IBarcodeOptions<ZXBarcodeFormat>) {
    super();

    // SPEC: A series of BarcodeFormats to search for in the subsequent detect() calls. If not present then the UA SHOULD
    // search for all supported formats.
    const formats = barcodeDetectorOptions?.formats ?? allSupportedFormats;

    // SPEC: If barcodeDetectorOptions.formats is present and empty, then throw a new TypeError.
    // SPEC: If barcodeDetectorOptions.formats is present and contains unknown, then throw a new TypeError.
    if (formats.length === 0 || formats.includes("unknown")) {
      throw new TypeError(""); // TODO pick message
    }

    const hints = new Map([
      [
        DecodeHintType.POSSIBLE_FORMATS,
        formats.map((format) => mapFormat.get(format)),
      ],
    ]);
    this.reader = new BrowserMultiFormatReader(hints);
  }

  public static getSupportedFormats(): Promise<ZXBarcodeFormat[]> {
    return Promise.resolve([...allSupportedFormats]);
  }

  public detect(image: ImageBitmapSource): Promise<DetectedBarcode[]> {
    const detectedBarcodes: DetectedBarcode[] = [];

    try {
      const source = this.decodeImage(image);
      const detectedBarcode = BarcodeDetectorZXing.wrapResult(source);
      detectedBarcodes.push(detectedBarcode);
    } catch (error) {
      //not found or not supported image source
      // TODO: add logger here
    }

    return Promise.resolve(detectedBarcodes);
  }

  private decodeImage(image: ImageBitmapSource): ZXResult {
    if (image instanceof HTMLCanvasElement) {
      return this.reader.decodeFromCanvas(image);
    } else if (image instanceof ImageData) {
      const source = new RGBLuminanceSource(
        toGrayscaleBuffer(image.data, image.width, image.height),
        image.width,
        image.height
      );
      const binarizer = new HybridBinarizer(source);
      const bitmap = new BinaryBitmap(binarizer);
      return this.reader.decodeBitmap(bitmap);
    } else if (image instanceof Blob) {
      throw new Error("Blob is currently not supported");
    }

    throw new Error("Cannot parse image provided");
  }

  private static wrapResult(result: ZXResult): DetectedBarcode {
    //set initial values
    const points = result.getResultPoints();
    let minX = points[0].getX();
    let minY = points[0].getY();
    let maxX = points[0].getX();
    let maxY = points[0].getY();

    points.forEach((point) => {
      const x = point.getX();
      const y = point.getY();
      minX = Math.min(x, minX);
      minY = Math.min(y, minY);
      maxX = Math.max(x, maxX);
      maxY = Math.max(y, maxY);
    });

    let boundingBox = new DOMRectReadOnly(minX, minY, maxX - minX, maxY - minY);

    const p1 = { x: boundingBox.left, y: boundingBox.top };
    const p2 = { x: boundingBox.right, y: boundingBox.top };
    const p3 = { x: boundingBox.right, y: boundingBox.bottom };
    const p4 = { x: boundingBox.left, y: boundingBox.bottom };

    const cornerPoints = [p1, p2, p3, p4];

    let barcodeFormat = mapFormatInv.get(result.getBarcodeFormat());
    if (!barcodeFormat) {
      barcodeFormat = "unknown";
    }

    return {
      boundingBox: boundingBox,
      rawValue: result.getText(),
      format: barcodeFormat,
      cornerPoints: cornerPoints,
    };
  }
}
