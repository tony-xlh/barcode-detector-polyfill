import { BarcodeReader, BarcodeScanner, EnumBarcodeFormat, EnumBarcodeFormat_2, TextResult } from "dynamsoft-javascript-barcode";
import { BarcodeDetectorOptions, BarcodeFormat, DetectedBarcode, Point2D } from "./Definitions";

BarcodeReader.engineResourcePath = "https://cdn.jsdelivr.net/npm/dynamsoft-javascript-barcode@9.0.2/dist/";

const mapFormat = new Map<BarcodeFormat, EnumBarcodeFormat>([
  [ "aztec", EnumBarcodeFormat.BF_AZTEC ],
  [ "codabar", EnumBarcodeFormat.BF_CODABAR],
  [ "code_11", EnumBarcodeFormat.BF_CODE_11 ],
  [ "code_39", EnumBarcodeFormat.BF_CODE_39 ],
  [ "code_93", EnumBarcodeFormat.BF_CODE_93 ],
  [ "code_128", EnumBarcodeFormat.BF_CODE_128 ],
  [ "data_matrix", EnumBarcodeFormat.BF_DATAMATRIX],
  [ "ean_8", EnumBarcodeFormat.BF_EAN_8 ],
  [ "ean_13", EnumBarcodeFormat.BF_EAN_13 ],
  [ "itf", EnumBarcodeFormat.BF_ITF ],
  [ "pdf417", EnumBarcodeFormat.BF_PDF417 ],
  [ "qr_code", EnumBarcodeFormat.BF_QR_CODE ],
  [ "micro_qr_code", EnumBarcodeFormat.BF_MICRO_QR ],
  [ "gs1_composite", EnumBarcodeFormat.BF_GS1_COMPOSITE],
  [ "gs1_databar", EnumBarcodeFormat.BF_GS1_DATABAR],
  [ "gs1_databar_expanded", EnumBarcodeFormat.BF_GS1_DATABAR_EXPANDED],
  [ "gs1_databar_expanded_stacked", EnumBarcodeFormat.BF_GS1_DATABAR_EXPANDED_STACKED],
  [ "gs1_databar_limited", EnumBarcodeFormat.BF_GS1_DATABAR_LIMITED],
  [ "gs1_databar_omnidirectional", EnumBarcodeFormat.BF_GS1_DATABAR_OMNIDIRECTIONAL],
  [ "gs1_databar_stacked", EnumBarcodeFormat.BF_GS1_DATABAR_STACKED],
  [ "gs1_databar_stacked_omnidirectional", EnumBarcodeFormat.BF_GS1_DATABAR_STACKED_OMNIDIRECTIONAL],
  [ "gs1_databar_truncated", EnumBarcodeFormat.BF_GS1_DATABAR_TRUNCATED],
  [ "maxi_code", EnumBarcodeFormat.BF_MAXICODE ],
  [ "upc_a", EnumBarcodeFormat.BF_UPC_A ],
  [ "upc_e", EnumBarcodeFormat.BF_UPC_E ]
]) 

const mapFormatInv = new Map<EnumBarcodeFormat, BarcodeFormat>(
  Array.from(mapFormat).map(([key, val]) => [val, key])
)

const allSupportedFormats : BarcodeFormat[] = Array.from(mapFormat.keys())

export default class BarcodeDetector {
  private reader: BarcodeReader;
  constructor (barcodeDetectorOptions? : BarcodeDetectorOptions) {
    // SPEC: A series of BarcodeFormats to search for in the subsequent detect() calls. If not present then the UA SHOULD 
    // search for all supported formats.
    const formats = barcodeDetectorOptions?.formats ?? allSupportedFormats

    // SPEC: If barcodeDetectorOptions.formats is present and empty, then throw a new TypeError.
    if (formats.length === 0) {
      throw new TypeError("") // TODO pick message
    }

    // SPEC: If barcodeDetectorOptions.formats is present and contains unknown, then throw a new TypeError.
    if (formats.includes("unknown")) {
      throw new TypeError("") // TODO pick message
    }
    if (barcodeDetectorOptions) {
      this.initDBR(formats);
    }else{
      this.initDBR();
    }
    
  }
  
  static setLicense(license:string) {
    BarcodeReader.license = license;
  }
  
  static getLicense(license:string) : string {
    return BarcodeReader.license;
  }

  async initDBR(formats?:BarcodeFormat[]){
    this.reader = await BarcodeScanner.createInstance();
    if (formats) {
      let settings = await this.reader.getRuntimeSettings();
      let ids:number;

      for (let index = 0; index < formats.length; index++) {
        if (index === 0) {
          ids = mapFormat.get(formats[index]);
        }else{
          ids = ids || mapFormat.get(formats[index]);
        }
      }
      
      settings.barcodeFormatIds = ids;
      await this.reader.updateRuntimeSettings(settings);
    }
  }

  static async getSupportedFormats() : Promise<BarcodeFormat[]> {
    return allSupportedFormats
  }

  async detect(image : ImageBitmapSource) : Promise<DetectedBarcode[]> {
    let results:TextResult[] = await this.reader.decode(image as any);
    let detectedBarcodes:DetectedBarcode[] = [];
    results.forEach(result => {
      let detectedBarcode:DetectedBarcode = this.wrapResult(result);
      detectedBarcodes.push(detectedBarcode);
    });
    return detectedBarcodes;
  }

  wrapResult(result:TextResult):DetectedBarcode{
    const cornerPoints = [];

    let minX: number, minY: number, maxX: number, maxY: number;

    minX = result.localizationResult.x1;
    minY = result.localizationResult.y1;
    console.log(result);
    console.log(result.localizationResult.x1);
    console.log(result.barcodeText);
    for (let index = 1; index < 5; index++) {
      const x = result.localizationResult["x"+index];
      const y = result.localizationResult["y"+index];
      minX = Math.min(x,minX);
      minY = Math.min(y,minY);
      maxX = Math.max(x,maxX);
      maxY = Math.max(y,maxY);
      let point:Point2D;
      point.x = x;
      point.y = y;
      cornerPoints.push(point);
    }

    return { 
      boundingBox: DOMRectReadOnly.fromRect({
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
      }), 
      rawValue: result.barcodeText,
      format: mapFormatInv.get(result.barcodeFormat),
      cornerPoints
    };
  } 
}