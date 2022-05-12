# barcode-detector-polyfill

Polyfill of the Barcode Detection API based on [Dynamsoft Barcode Reader](https://www.dynamsoft.com/barcode-reader/overview/).

[Online demo](https://627c7066caa03800ac213a59--extraordinary-taiyaki-4769a5.netlify.app/)

## Usage

```js
import {default as BarcodeDetectorPolyfill} from "barcode-detection"


let barcodeDetector;

async function init() {
  if ("BarcodeDetector" in window) {
    alert('Barcode Detector supported!');
    barcodeDetector = new window.BarcodeDetector({ formats: ["qr_code"] });
  }else{
    alert('Barcode Detector is not supported by this browser, using the Dynamsoft Barcode Reader polyfill.');
    barcodeDetector = new BarcodeDetectorPolyfill({ formats: ["qr_code"] });
    
    //initialize the Dynamsoft Barcode Reader with a license
    BarcodeDetectorPolyfill.setLicense("DLS2eyJoYW5kc2hha2VDb2RlIjoiMjAwMDAxLTE2NDk4Mjk3OTI2MzUiLCJvcmdhbml6YXRpb25JRCI6IjIwMDAwMSIsInNlc3Npb25QYXNzd29yZCI6IndTcGR6Vm05WDJrcEQ5YUoifQ==");
    await barcodeDetector.init();
  }
}

async function decode(imgEl) {
  //decode an image element
  let barcodes = await barcodeDetector.detect(imgEl);
}
```

## Supported Barcode Symbologies

* Code 11
* Code 39
* Code 93
* Code 128
* Codabar
* EAN-8
* EAN-13
* UPC-A
* UPC-E
* Interleaved 2 of 5 (ITF)
* Industrial 2 of 5 (Code 2 of 5 Industry, Standard 2 of 5, Code 2 of 5)
* ITF-14 
* QRCode
* DataMatrix
* PDF417
* GS1 DataBar
* Maxicode
* Micro PDF417
* Micro QR
* PatchCode
* GS1 Composite
* Postal Code
* Dot Code
* Pharmacode

