import '../styles/index.css';
import {default as BarcodeDetectorPolyfill} from "barcode-detection";

const region = {
  left: 15,
  top: 25,
  right: 85,
  bottom: 60
};
updateViewerFinder(1280,720);
let barcodeDetector;
let decoding = false;
let localStream;
let interval;
let scannerContainer = document.querySelector(".scanner");
let home = document.querySelector(".home");
let startButton = document.querySelector("#startButton");
startButton.onclick = function() {
  scannerContainer.style.display = "";
  home.style.display = "none";
  loadDevicesAndPlay();
};
let fileInput = document.querySelector("#fileInput");
fileInput.onchange = function(event) {
  let file = event.target.files[0];
  let reader = new FileReader();
				
  reader.onload = function(e){
    let img = document.getElementById("selectedImg");
    img.src = e.target.result;
    img.onload = async function() {
      let detectedCodes = await barcodeDetector.detect(img);
      let json = JSON.stringify(detectedCodes, null, 2);
      console.log(json);
      alert(json);
    };
  };
		
  reader.onerror = function () {
    console.warn('oops, something went wrong.');
  };
		
	reader.readAsDataURL(file);	
};

let closeButton = document.querySelector("#closeButton");
closeButton.onclick = function() {
  stop();
  scannerContainer.style.display = "none";
  home.style.display = "";
};

let okayButton = document.querySelector("#okayButton");
okayButton.onclick = function() {
  console.log("okay clicked");
  let modal = document.getElementById("modal");
  modal.className = modal.className.replace("active", "");
  enablePolyfillAndInit();
};

document.getElementsByClassName("camera")[0].addEventListener('loadeddata',onPlayed, false);
document.getElementById("cameraSelect").onchange = onCameraChanged;
checkBarcodeDetector();


async function checkBarcodeDetector(){
  let barcodeDetectorUsable = false;
  if ('BarcodeDetector' in window) {
    let formats = await window.BarcodeDetector.getSupportedFormats();
    if (formats.length > 0) {
      barcodeDetectorUsable = true;
    }
  }

  if (barcodeDetectorUsable === true) {
    alert('Barcode Detector supported!');
    initBarcodeDetector();
  }else{
    document.getElementById("modal").className += " active";
  }
}

async function enablePolyfillAndInit(){
  let selectedEngine = document.getElementById("engineSelect").selectedOptions[0].value;
    
  console.log(selectedEngine);
  if (selectedEngine === "Dynamsoft Barcode Reader") {
    BarcodeDetectorPolyfill.engine = "DBR";
    BarcodeDetectorPolyfill.setDBRLicense("DLS2eyJoYW5kc2hha2VDb2RlIjoiMjAwMDAxLTE2NDk4Mjk3OTI2MzUiLCJvcmdhbml6YXRpb25JRCI6IjIwMDAwMSIsInNlc3Npb25QYXNzd29yZCI6IndTcGR6Vm05WDJrcEQ5YUoifQ==");
    let reader = await BarcodeDetectorPolyfill.initDBR();
    console.log("reader");
    console.log(reader); // You can modify the runtime settings of the reader instance.
  }else{
    BarcodeDetectorPolyfill.engine = "ZXing";
  }
  initBarcodeDetector();
}

function initBarcodeDetector(){
  window.BarcodeDetector = BarcodeDetectorPolyfill;
  barcodeDetector = new window.BarcodeDetector();
  fileInput.disabled = "";
  startButton.disabled = "";
  document.getElementById("status").innerHTML = "";
}

function loadDevicesAndPlay(){
  let constraints = {video: true, audio: false};
  navigator.mediaDevices.getUserMedia(constraints).then(stream => {
      localStream = stream;
      let cameraselect = document.getElementById("cameraSelect");
      cameraselect.innerHTML="";
      navigator.mediaDevices.enumerateDevices().then(function(devices) {
          let count = 0;
          let cameraDevices = [];
          let defaultIndex = 0;
          for (let i=0;i<devices.length;i++){
              let device = devices[i];
              if (device.kind == 'videoinput'){
                  cameraDevices.push(device);
                  let label = device.label || `Camera ${count++}`;
                  cameraselect.add(new Option(label,device.deviceId));
                  if (label.toLowerCase().indexOf("back") != -1) {
                    defaultIndex = cameraDevices.length - 1;
                  }
                  
              }
          }

          if (cameraDevices.length>0) {
            cameraselect.selectedIndex = defaultIndex;
            play(cameraDevices[defaultIndex].deviceId);
          }else{
            alert("No camera detected.");
          }
      });

  });
}

function play(deviceId) {
  stop();
  let constraints = {};

  if (deviceId){
      constraints = {
          video: {deviceId: deviceId},
          audio: false
      };
  }else{
      constraints = {
          video: true,
          audio: false
      };
  }

  navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
      localStream = stream;
      let camera = document.getElementsByClassName("camera")[0];
      // Attach local stream to video element
      camera.srcObject = stream;

  }).catch(function(err) {
      console.error('getUserMediaError', err, err.stack);
      alert(err.message);
  });
}

function stop(){
  stopDecoding();
  try{
      if (localStream){
          localStream.getTracks().forEach(track => track.stop());
      }
  } catch (e){
      alert(e.message);
  }
}

function onCameraChanged(){
  let cameraselect = document.getElementById("cameraSelect");
  let deviceId = cameraselect.selectedOptions[0].value;
  play(deviceId);
}

function onPlayed() {
  updateSVGViewBoxBasedOnVideoSize();
  let camera = document.getElementsByClassName("camera")[0];
  updateViewerFinder(camera.videoWidth,camera.videoHeight);
  startDecoding();
}

function updateViewerFinder(width,height){
  let viewFinder = document.querySelector("view-finder");
  viewFinder.width = width;
  viewFinder.height = height;
  viewFinder.left = viewFinder.width * region.left / 100;
  viewFinder.right = viewFinder.width * region.right / 100;
  viewFinder.top = viewFinder.height * region.top / 100;
  viewFinder.bottom = viewFinder.height * region.bottom / 100;
  viewFinder.style.display = "";

}

function updateSVGViewBoxBasedOnVideoSize(){
  let camera = document.getElementsByClassName("camera")[0];
  let svg = document.getElementsByTagName("svg")[0];
  svg.setAttribute("viewBox","0 0 "+camera.videoWidth+" "+camera.videoHeight);
}

function startDecoding(){
  stopDecoding();
  //1000/25=40
  interval = setInterval(decode, 200);
}

function stopDecoding() {
  clearInterval(interval);
}

async function decode(){
  if (decoding === false) {
    console.log("decoding");
    decoding = true;
    try {
      let video = document.getElementsByClassName("camera")[0];
      let barcodes;
      let canvas = document.getElementsByClassName("hiddenCVS")[0];
      let img = await captureFrame(video,canvas);
      barcodes = await barcodeDetector.detect(img);
      console.log(barcodes);
      drawOverlay(barcodes);
    } catch (error) {
      console.log(error);
    }
    decoding = false;
  }
}

function captureFrame(video,canvas){
  return new Promise(function (resolve) {
    let viewFinder = document.querySelector("view-finder");
    const left = viewFinder.left;
    const top = viewFinder.top;
    const width = viewFinder.right - viewFinder.left;
    const height = viewFinder.bottom - viewFinder.top;
    canvas.width  = width;
    canvas.height = height;
    let ctx = canvas.getContext('2d');
    ctx.drawImage(video, left, top, width, height, 0, 0, width, height);
    let img = document.getElementById("selectedImg");
    img.src = canvas.toDataURL();
    img.onload = function(){
      resolve(img);
    };
  });
}

function drawOverlay(barcodes){
  let svg = document.getElementsByTagName("svg")[0];
  let viewFinder = document.querySelector("view-finder");
  svg.innerHTML = "";
  let offsetX = viewFinder.left;
  let offsetY = viewFinder.top;
  for (let i=0;i<barcodes.length;i++) {
    let barcode = barcodes[i];
    let lr = {};
    lr.x1 = barcode.cornerPoints[0].x + offsetX;
    lr.x2 = barcode.cornerPoints[1].x + offsetX;
    lr.x3 = barcode.cornerPoints[2].x + offsetX;
    lr.x4 = barcode.cornerPoints[3].x + offsetX;
    lr.y1 = barcode.cornerPoints[0].y + offsetY;
    lr.y2 = barcode.cornerPoints[1].y + offsetY;
    lr.y3 = barcode.cornerPoints[2].y + offsetY;
    lr.y4 = barcode.cornerPoints[3].y + offsetY;
    let points = getPointsData(lr);
    let polygon = document.createElementNS("http://www.w3.org/2000/svg","polygon");
    polygon.setAttribute("points",points);
    polygon.setAttribute("class","barcode-polygon");
    let text = document.createElementNS("http://www.w3.org/2000/svg","text");
    text.innerHTML = barcode.rawValue;
    text.setAttribute("x",lr.x1);
    text.setAttribute("y",lr.y1);
    text.setAttribute("fill","red");
    text.setAttribute("font-size","25");
    svg.append(polygon);
    svg.append(text);
  }
}

function getPointsData(lr){
  let pointsData = lr.x1+","+lr.y1 + " ";
  pointsData = pointsData+ lr.x2+","+lr.y2 + " ";
  pointsData = pointsData+ lr.x3+","+lr.y3 + " ";
  pointsData = pointsData+ lr.x4+","+lr.y4;
  return pointsData;
}
