import { BarcodeReader } from 'dynamsoft-javascript-barcode';
import BarcodeDetectorDBR from './BarcodeDetectorDBR';
import BarcodeDetectorZXing from './BarcodeDetectorZXing';
import { BarcodeDetectorOptions, BarcodeFormat, DetectedBarcode, Point2D } from './Definitions';

export * from './BarcodeDetectorDBR';
export * from './BarcodeDetectorZXing';
export * from './Definitions';
export type Engine
  = "DBR"
  | "ZXing"

export default class BarcodeDetector {
  static engine:Engine = "DBR";
  private reader : BarcodeDetectorZXing|BarcodeDetectorDBR;
  constructor (barcodeDetectorOptions? : BarcodeDetectorOptions) {
    if (BarcodeDetector.engine === "DBR") {
      this.reader = new BarcodeDetectorDBR(barcodeDetectorOptions);
    }else{
      this.reader = new BarcodeDetectorZXing(barcodeDetectorOptions);
    }
  }

  static async getSupportedFormats() : Promise<BarcodeFormat[]> {
    if (BarcodeDetector.engine === "DBR") {
      return BarcodeDetectorDBR.getSupportedFormats();
    }else{
      return BarcodeDetectorZXing.getSupportedFormats();
    }
  }

  async detect(image : ImageBitmapSource) : Promise<DetectedBarcode[]> {
    return await this.reader.detect(image);
  }

  static setDBREngineResourcePath(path:string) {
    BarcodeDetectorDBR.setEngineResourcePath(path);
  }

  static setDBRLicense(license:string) {
    BarcodeDetectorDBR.setLicense(license);
  }
  
  static getDBRLicense(license:string) : string {
    return BarcodeDetectorDBR.getLicense();
  }

  static async initDBR() : Promise<BarcodeReader> {
    return await BarcodeDetectorDBR.init();
  }
}