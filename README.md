# barcode-detector-polyfill

Polyfill of the Barcode Detection API based on [Dynamsoft Barcode Reader](https://www.dynamsoft.com/barcode-reader/overview/).

[Online demo](https://627c7066caa03800ac213a59--extraordinary-taiyaki-4769a5.netlify.app/)

## Usage

```js
import BarcodeDetector from "barcode-detection"

//polyfill if the browser does not support the Barcode Detection API
if (!("BarcodeDetector" in window)) {
  window.BarcodeDetector = BarcodeDetector
}

async function decode(imgEl) {
  //create a barcodeDetector and specify the barcode format
  const barcodeDetector = new BarcodeDetector({ formats: ["qr_code"] })

  //initialize the Dynamsoft Barcode Reader with a license
  BarcodeDetector.setLicense("DLS2eyJoYW5kc2hha2VDb2RlIjoiMTAwMjI3NzYzLVRYbFhaV0pRY205cSIsIm9yZ2FuaXphdGlvbklEIjoiMTAwMjI3NzYzIn0=");
  await barcodeDetector.init();
  
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

