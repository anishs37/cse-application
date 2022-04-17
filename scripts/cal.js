const electron = require('electron');
const {ipcRenderer} = electron;
const FRAMERATE = 2; 
let runningmid = 0;
const tf = require("@tensorflow/tfjs");
let segmodel, gzmodel;
tf.loadLayersModel("../segmentation_256/model.json").then((mod) => {segmodel = mod}).catch((e) => {console.log(e); return e});
tf.loadLayersModel("../tracking_3/model.json").then((mod) => {gzmodel = mod}).catch((e) => {console.log(e); return e});
/*
    top-left: tl
    top-right: tr
    bottom-left: bl
    bottom-right: br
    center-left: cl
    center-right: cr
    center-top: ct
    center-bottom: cb
    center: c
*/
let places = ["tl", "ct", "tr", "cr", "br", "cb", "bl", "cl"];
let locs = new Array();
function appear(place) {
    document.getElementById(place).style.visibility = "visible";
}
function disappear(place) {
    document.getElementById(place).style.visibility = "hidden";
}
let video;
navigator.getUserMedia({video: true, audio: false}, (localMediaStream) => {
    video = document.querySelector("#videoElement");
    video.srcObject = localMediaStream;
}, (error) => {console.log(error)});
var inst = document.getElementById("instructions");
setTimeout(()=>{
    inst.style.visibility = "hidden";
        // calibration code n stuff ig
        places.forEach((p, index) =>{
            setTimeout(() =>{
                appear(p);
                let intervalId;
                let tlocs = new Array();
                setTimeout(() =>{
                        intervalId = setInterval(() =>{
                            let tr = video.getBoundingClientRect();
                            let ofscanv = new OffscreenCanvas(tr.width, tr.height);
                            let ctx = ofscanv.getContext('2d');
                            ctx.drawImage(video, 0, 0, tr.width, tr.height);
                            let id = ctx.getImageData(0, 0, tr.width, tr.height);
                            let idcopy = new Uint8ClampedArray(id.data);
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
                                        left = Math.floor(left * xscale);
                                        right = Math.ceil(right * xscale);
                                        top = Math.floor(Math.floor(top/256) * yscale);
                                        bot = Math.ceil(Math.floor(bot/256) * yscale);
                                        let width = right - left + 1;
                                        let height = bot - top + 1;
                                        let midpoint = Math.floor((left + right) / 2);
                                        if(width / height > 2.8){
                                            console.log("Two Eyes Open");
                                            runningmid = midpoint;
                                            let rightofleft = midpoint - 25;
                                            let leftofright = midpoint + 25;
                                            let leftw = rightofleft - left + 1;
                                            let rightw = right - leftofright + 1;
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
                                            let id2r = new ImageData(new Uint8ClampedArray(rnar), rightw, height);
                                            let t2l = tf.browser.fromPixels(id2l, 3)
                                            .resizeNearestNeighbor([36, 60], true)
                                            .toFloat()
                                            .expandDims();
                                            let t2r = tf.browser.fromPixels(id2r, 3)
                                            .resizeNearestNeighbor([36, 60])
                                            .toFloat()
                                            .expandDims();
                                            gzmodel.predict([t2l, t2r]).data().then(pred => {
                                                tlocs[tlocs.length] = pred;
                                            });
                                        }
                                        else{
                                            console.log("One Eye Open");
                                            if(midpoint <= runningmid){console.log("Right Eye Open");}
                                            else{console.log("Left Eye Open");}
                                        }
                                    }
                                    else{console.log("Eyes Closed!");}
                            });
                        }, 1000/FRAMERATE);
                }, 2000);
                setTimeout(() => {
                    clearInterval(intervalId);
                    locs[locs.length] = tlocs;
                    disappear(p);
                }, 12000);
            }, index * 12000);
        });
        setTimeout(() =>{
            let olocs = {}
            for(let i = 0; i < locs.length; i++){
                ar = locs[i]
                let sumx = 0;
                let sumy = 0;
                ar.forEach((v) =>{
                    sumx += v[0];
                    sumy += v[1];
                });
                olocs[places[i]] = [sumx/ar.length, sumy/ar.length];
            }
            olocs["wmid"] = (olocs["ct"][0] + olocs["cb"][0])/2;
            olocs["lhmid"] = olocs["cl"][1];
            olocs["rhmid"] = olocs["cr"][1];
            console.log(olocs);
            require("fs").writeFileSync("caldata.json", JSON.stringify(olocs));
            inst.style.visibility = "visible";
            inst.innerText = "Finished. Thank you."
            setTimeout(()=>{
                ipcRenderer.send("close:cal")
            }, 5000);
        }, (places.length+0.3) * 12000);
}, 5000);