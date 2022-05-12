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
  private formats: BarcodeFormat[];
  constructor (barcodeDetectorOptions? : BarcodeDetectorOptions) {
    // SPEC: A series of BarcodeFormats to search for in the subsequent detect() calls. If not present then the UA SHOULD 
    // search for all supported formats.

    this.formats = barcodeDetectorOptions?.formats ?? allSupportedFormats

    // SPEC: If barcodeDetectorOptions.formats is present and empty, then throw a new TypeError.
    if (this.formats.length === 0) {
      throw new TypeError("") // TODO pick message
    }

    // SPEC: If barcodeDetectorOptions.formats is present and contains unknown, then throw a new TypeError.
    if (this.formats.includes("unknown")) {
      throw new TypeError("") // TODO pick message
    }
  }

  static setLicense(license:string) {
    BarcodeReader.license = license;
  }
  
  static getLicense(license:string) : string {
    return BarcodeReader.license;
  }

  async init() : Promise<BarcodeReader> {
    this.reader = await BarcodeScanner.createInstance();
    if (this.formats.length != allSupportedFormats.length) {
      console.log("update runtime settings for formats");
      let settings = await this.reader.getRuntimeSettings();
      let ids:number;
      for (let index = 0; index < this.formats.length; index++) {
        if (index === 0) {
          ids = mapFormat.get(this.formats[index]);
        }else{
          ids = ids || mapFormat.get(this.formats[index]);
        }
      }
      settings.barcodeFormatIds = ids;
      await this.reader.updateRuntimeSettings(settings);
    }
    
    return this.reader;
  }

  static async getSupportedFormats() : Promise<BarcodeFormat[]> {
    return allSupportedFormats
  }

  async detect(image : ImageBitmapSource) : Promise<DetectedBarcode[]> {
    if (!this.reader) {
      throw new Error("Dynamsoft Barcode Reader has not been initialized.");
    }
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

    //set initial values
    minX = result.localizationResult.x1;
    minY = result.localizationResult.y1;
    maxX = result.localizationResult.x1;
    maxY = result.localizationResult.y1;
    
    for (let index = 1; index < 5; index++) {
      const x = result.localizationResult["x"+index];
      const y = result.localizationResult["y"+index];

      minX = Math.min(x,minX);
      minY = Math.min(y,minY);
      maxX = Math.max(x,maxX);
      maxY = Math.max(y,maxY);
      let point:Point2D = {x:x,y:y};
      cornerPoints.push(point);
    }

    let boundingBox = new DOMRectReadOnly(minX, minY, maxX - minX, maxY - minY);

    return { 
      boundingBox: boundingBox, 
      rawValue: result.barcodeText,
      format: mapFormatInv.get(result.barcodeFormat),
      cornerPoints
    };
  }
}