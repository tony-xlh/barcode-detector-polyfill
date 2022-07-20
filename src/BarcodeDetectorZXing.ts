import { BarcodeDetectorOptions, BarcodeFormat, DetectedBarcode, Point2D } from "./Definitions";
import * as ZXing from "@zxing/library"

const mapFormat = new Map<BarcodeFormat, ZXing.BarcodeFormat>([
  [ "aztec", ZXing.BarcodeFormat.AZTEC ],
  [ "code_39", ZXing.BarcodeFormat.CODE_39 ],
  [ "code_128", ZXing.BarcodeFormat.CODE_128 ],
  [ "data_matrix", ZXing.BarcodeFormat.DATA_MATRIX ],
  [ "ean_8", ZXing.BarcodeFormat.EAN_8 ],
  [ "ean_13", ZXing.BarcodeFormat.EAN_13 ],
  [ "itf", ZXing.BarcodeFormat.ITF ],
  [ "pdf417", ZXing.BarcodeFormat.PDF_417 ],
  [ "qr_code", ZXing.BarcodeFormat.QR_CODE ],
  [ "upc_a", ZXing.BarcodeFormat.UPC_A ],
  [ "upc_e", ZXing.BarcodeFormat.UPC_E ]
]) 

const mapFormatInv = new Map<ZXing.BarcodeFormat, BarcodeFormat>(
  Array.from(mapFormat).map(([key, val]) => [val, key])
)

const allSupportedFormats : BarcodeFormat[] = Array.from(mapFormat.keys())


export default class BarcodeDetectorZXing {
  private reader : ZXing.BrowserMultiFormatReader;
  constructor (barcodeDetectorOptions? : BarcodeDetectorOptions) {
    // SPEC: A series of BarcodeFormats to search for in the subsequent detect() calls. If not present then the UA SHOULD 
    // search for all supported formats.

    const formats = barcodeDetectorOptions?.formats ?? allSupportedFormats;

    // SPEC: If barcodeDetectorOptions.formats is present and empty, then throw a new TypeError.
    if (formats.length === 0) {
      throw new TypeError(""); // TODO pick message
    }

    // SPEC: If barcodeDetectorOptions.formats is present and contains unknown, then throw a new TypeError.
    if (formats.includes("unknown")) {
      throw new TypeError(""); // TODO pick message
    }

    const hints = new Map([
      [ ZXing.DecodeHintType.POSSIBLE_FORMATS, formats.map(format => mapFormat.get(format)) ]
    ]);
    console.log(hints);
    this.reader = new ZXing.BrowserMultiFormatReader(hints);
  }

  static async getSupportedFormats() : Promise<BarcodeFormat[]> {
    return allSupportedFormats
  }

  async detect(image : ImageBitmapSource) : Promise<DetectedBarcode[]> {
    let result:ZXing.Result;
    let detectedBarcodes:DetectedBarcode[] = [];

    try {
      result = this.reader.decode(image as any);
    } catch (error) {
      //not found or not supported image source
      return detectedBarcodes;
    }
    
    let detectedBarcode:DetectedBarcode = this.wrapResult(result);
    detectedBarcodes.push(detectedBarcode);
    return detectedBarcodes;
  }

  wrapResult(result:ZXing.Result):DetectedBarcode{
    let minX: number, minY: number, maxX: number, maxY: number;
    
    //set initial values
    let points = result.getResultPoints();
    minX = points[0].getX();
    minY = points[0].getY();
    maxX = points[0].getX();
    maxY = points[0].getY();

    points.forEach(point => {
      const x = point.getX();
      const y = point.getY();
      minX = Math.min(x,minX);
      minY = Math.min(y,minY);
      maxX = Math.max(x,maxX);
      maxY = Math.max(y,maxY);

    });
    
    let boundingBox = new DOMRectReadOnly(minX, minY, maxX - minX, maxY - minY);
    
    let p1:Point2D = {x:boundingBox.left,y:boundingBox.top};
    let p2:Point2D = {x:boundingBox.right,y:boundingBox.top};
    let p3:Point2D = {x:boundingBox.right,y:boundingBox.bottom};
    let p4:Point2D = {x:boundingBox.left,y:boundingBox.bottom};

    const cornerPoints = [p1, p2, p3, p4];

    let barcodeFormat = mapFormatInv.get(result.getBarcodeFormat());
    if (!barcodeFormat) {
      barcodeFormat = "unknown";
    }

    return { 
      boundingBox: boundingBox, 
      rawValue: result.getText(),
      format: barcodeFormat,
      cornerPoints: cornerPoints
    };
  }
}