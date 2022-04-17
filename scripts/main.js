const electron = require('electron');
const {ipcRenderer} = electron;
const FRAMERATE = 0.5;
const button = document.getElementById('arrow-button');
const tf = require("@tensorflow/tfjs");
//var toWav = require('audiobuffer-to-wav')
//var mergeBuffers = require('merge-audio-buffers')
//var anchor = document.createElement('a')
//document.body.appendChild(anchor)
//anchor.style = 'display: none'
// var recorder;
// var blobs = [];

// const desktopCapturer = {
//     getSources: (opts) => ipcRenderer.invoke('DESKTOP_CAPTURER_GET_SOURCES', opts)
// }

// function startRecording() {
//     console.log("Started Recording");
//     desktopCapturer.getSources({ types: ['window', 'screen'] }, function(error, sources) {
//         if (error) throw error;
//         console.log("its passing");
        
//         navigator.webkitGetUserMedia({
//             audio: true,
//             video: false
//         }, handleStream, handleUserMediaError);
//         return;
//     });
// }

// function handleStream(stream) {
//     console.log("here")
//     recorder = new MediaRecorder(stream);
//     blobs = [];
//     recorder.ondataavailable = function(event) {
//         blobs.push(event.data);
//     };
//     recorder.start();
// }

// function stopRecording() {
//     var save = function() {
//         console.log(blobs);
//         toArrayBuffer(new Blob(blobs, {type: 'audio/wav'}), function(ab) {
//             console.log(ab);
//             var buffer = toBuffer(ab);
//             var file = `./example.wav`;
//             fs.writeFile(file, buffer, function(err) {
//                 if (err) {
//                     console.error('Failed to save video ' + err);
//                 } else {
//                     console.log('Saved video: ' + file);
//                 }
//             });
//         });
//     };
//     recorder.onstop = save;
//     recorder.stop();
// }

// function handleUserMediaError(e) {
//     console.error('handleUserMediaError', e);
// }

// function toArrayBuffer(blob, cb) {
//     let fileReader = new FileReader();
//     fileReader.onload = function() {
//         let arrayBuffer = this.result;
//         cb(arrayBuffer);
//     };
//     fileReader.readAsArrayBuffer(blob);
// }

// function toBuffer(ab) {
//     let buffer = new Buffer(ab.byteLength);
//     let arr = new Uint8Array(ab);
//     for (let i = 0; i < arr.byteLength; i++) {
//         buffer[i] = arr[i];
//     }
//     return buffer;
// }
let segmodel, gzmodel;
let tims = new Array();
let runningmid = 0;
tf.loadLayersModel("../segmentation_256/model.json").then((mod) => {segmodel = mod}).catch((e) => {console.log(e); return e});
button.addEventListener('click', function() {
    if(button.innerText.toUpperCase() == "Enable".toUpperCase()){
        //ipcRenderer.send('listener:start');
        button.innerText = "Disable";
        // startRecording();
        // setTimeout(function() { stopRecording() }, 2000);
        //const handleSuccess = function(stream) {
        //    const context = new AudioContext();
        //    const source = context.createMediaStreamSource(stream);
        //    const processor = context.createScriptProcessor(1024, 1, 1);
        //    var arrayOfBlobs = []
        //    source.connect(processor);
        //    processor.connect(context.destination);
        //    processor.onaudioprocess = function(e) {
        //    // Do something with the data, e.g. convert it to WAV
        //    //console.log(e.inputBuffer);
        //    var wav = toWav(e.inputBuffer)
        //    //console.log(wav)
        //    arrayOfBlobs.push(new Blob([wav]))
        //    if(arrayOfBlobs.length > 500) {
        //        const tracks = stream.getTracks();
        //        tracks.forEach(function(track) {
        //            track.stop();
        //        });
        //        // var url = window.URL.createObjectURL(blob)
        //        // console.log(url);
        //        ConcatenateBlobs(arrayOfBlobs, 'audio/wav', function(resultingBlob) {
        //            console.log(arrayOfBlobs[0])
        //            anchor.href = URL.createObjectURL(resultingBlob);
        //            anchor.download = 'audio.wav'
        //            anchor.click()
        //        });
        //        arrayOfBlobs = []
        //        // window.URL.revokeObjectURL(url)
        //        // return;
        //    }
        //}
        //}
        //navigator.mediaDevices
        //    .getUserMedia({audio: true, video: false})
        //    .then(handleSuccess);
    }
    else{
        //ipcRenderer.send('listener:stop');
        button.innerText = "Enable";
    }
});
tf.loadLayersModel("../tracking_3/model.json").then((mod) => {gzmodel = mod}).catch((e) => {console.log(e); return e});
const button2 = document.querySelector("#eye-button");
let intervalId;
let time = Date.now();
button2.addEventListener("click", ()=>{
    //sumtim = tims.reduce((a, b) => a + b, 0);
    //console.log(sumtim/tims.length)
    if(button2.innerText == "Wait just a moment") return;
    let dnow = Date.now();
    if(dnow - time < 1500){
        let oldtxt = button2.innerText;
        button2.innerText = "Wait just a moment";
        setTimeout(() =>{
            button2.innerText = oldtxt;
        }, time + 1500 - dnow);
    }
    else{
        time = dnow;
        if (button2.innerText.toUpperCase() == "See Yourself! Enable Camera".toUpperCase()){
            navigator.getUserMedia({video: true, audio: false}, (localMediaStream) => {
                const video = document.querySelector("#videoElement");
                video.srcObject = localMediaStream;
                ipcRenderer.send("setvid", video)
                intervalId = setInterval(() =>{
                    let ttim = Date.now();
                    let tr = video.getBoundingClientRect();
                    let ofscanv = new OffscreenCanvas(tr.width, tr.height);
                    let ctx = ofscanv.getContext('2d');
                    ctx.drawImage(video, 0, 0, tr.width, tr.height);
                    let id = ctx.getImageData(0, 0, tr.width, tr.height);
                    let idcopy = new Uint8ClampedArray(id.data);
                    //let imgdatcopy = id.data.slice();
                    for(let i = 0; i < id.data.length; i = i + 4){
                        let nd = 0.2989 * id.data[i] + 0.5870 * id.data[i+1] + 0.1140 * id.data[i+2];
                        id.data[i] = nd;
                        id.data[i+1] = nd;
                        id.data[i+2] = nd;
                    }
                    let t = tf.browser.fromPixels(id, 1)
                    .resizeNearestNeighbor([256, 256])
                    .toFloat()
                    .expandDims();
                    segmodel.predict(t).data().then((pred)=>{
                        //t.data().then((imgdat) =>{
                            let top = 256*256;
                            let bot = 0;
                            let left = 256*256;
                            let right = 0;
                            for(let i = 0; i < pred.length; i++){
                                if(pred[i] > 0.6){
                                    if(i < top){top = i}
                                    if(i > bot){bot = i}
                                    if(i%256 < left){left = i%256}
                                    if(i%256 > right){right = i%256}
                                }
                            }
                            if(top != 256*256){
                                if(left < 4){left = 0}
                                else{left -= 4}
                                if(right > 251){right = 255}
                                else{right += 4}
                                if(top < 3*256){top = 0}
                                else{top -= 3*256}
                                if(bot > 256*256 - 256*3 - 1){bot = 256*256-1}
                                else{bot += 256*3}
                                let xscale = id.width / 256;
                                let yscale = id.height / 256;
                                //console.log([xscale, yscale, id, width, height, top, bot, left, right]);
                                left = Math.floor(left * xscale);
                                right = Math.ceil(right * xscale);
                                top = Math.floor(Math.floor(top/256) * yscale);
                                bot = Math.ceil(Math.floor(bot/256) * yscale);
                                let width = right - left + 1;
                                let height = bot - top + 1;
                                let midpoint = Math.floor((left + right) / 2);
                                //console.log([width, height])
                                if(width / height > 2.8){
                                    console.log("Two Eyes Open");
                                    runningmid = midpoint;
                                    let rightofleft = midpoint - 25;
                                    let leftofright = midpoint + 25;
                                    let leftw = rightofleft - left + 1;
                                    let rightw = right - leftofright + 1;
                                    //console.log([left, right, midpoint, rightofleft, leftofright, leftw, rightw])
                                    while(leftw < rightw){
                                        rightofleft += 1;
                                        leftw = rightofleft - left + 1;
                                    }
                                    while(leftw > rightw){
                                        leftofright -= 1;
                                        rightw = right - leftofright + 1; 
                                    }
                                    let lnar = new Array();
                                    let rnar = new Array();
                                    let lc = 0;
                                    let rc = 0;
                                    for(let i = top*id.width; i < (bot+1)*id.width; i++){
                                        if(i%id.width >= left && i%id.width <= rightofleft){
                                            lnar[lc++] = idcopy[i*4];
                                            lnar[lc++] = idcopy[i*4+1];
                                            lnar[lc++] = idcopy[i*4+2];
                                            lnar[lc++] = idcopy[i*4+3];
                                        }
                                        if(i%id.width >= leftofright && i%id.width <= right){
                                            rnar[rc++] = idcopy[i*4];
                                            rnar[rc++] = idcopy[i*4+1];
                                            rnar[rc++] = idcopy[i*4+2];
                                            rnar[rc++] = idcopy[i*4+3];
                                        }
                                    }
                                    let id2l = new ImageData(new Uint8ClampedArray(lnar), leftw, height);
                                    //console.log([leftw, height]);
                                    //require("fs").writeFileSync("testl.txt", id2l.data.toString());
                                    let id2r = new ImageData(new Uint8ClampedArray(rnar), rightw, height);
                                    //console.log([rightw, height]);
                                    //require("fs").writeFileSync("testr.txt", id2r.data.toString());
                                    let t2l = tf.browser.fromPixels(id2l, 3)
                                    .resizeNearestNeighbor([36, 60], true)
                                    .toFloat()
                                    .expandDims();
                                    //require("fs").writeFileSync("testl2.txt", t2l.dataSync().toString());
                                    let t2r = tf.browser.fromPixels(id2r, 3)
                                    .resizeNearestNeighbor([36, 60])
                                    .toFloat()
                                    .expandDims();
                                    //require("fs").writeFileSync("testr2.txt", t2r.dataSync().toString());
                                    //let t2c = tf.stack([t2l, t2r]);
                                    //console.log(t2c)
                                    gzmodel.predict([t2l, t2r]).data().then(pred => {
                                        //console.log(pred[0]);
                                        //console.log(pred[1]);
                                        //let xc = pred[0] * 316.8;
                                        //let yc = pred[1] * 115.7;
                                        //console.log(xc);
                                        //console.log(yc);
                                        ipcRenderer.send("mm", pred[0], pred[1]);
                                    });
                                }
                                else{
                                    console.log("One Eye Open");
                                    if(midpoint <= runningmid){
                                        console.log("Right Eye Open");
                                        ipcRenderer.send("lc");
                                    }
                                    else{
                                        console.log("Left Eye Open");
                                        ipcRenderer.send("rc")
                                    }
                                }
                                //tims[tims.length] = (Date.now()-ttim)/1000;
                                //require("fs").writeFileSync("test.txt", t2.dataSync().toString());
                            }
                            else{
                                console.log("Eyes Closed!");
                            }
                        //});
                    });
                }, 1000/FRAMERATE);
            }, (error) => {console.log(error)})
            button2.innerText = "Disable Camera";
        }
        else {
            const video = document.querySelector("#videoElement");
            let stream = video.srcObject;
            let tracks = stream.getTracks();
            tracks.forEach(tr => {
                tr.stop();
            });
            video.srcObject = null;
            clearInterval(intervalId);
            button2.innerText = "See Yourself! Enable Camera";
        }
    }
});