window.onload = function() {
var video;
var canvas;
var canvasHidden;
var data;
var gBlockSize = 4;
var blockArrayA;
var blockArrayB;
var bkla;
var flat;
var startwaitFrameCount = 0;
var particles = [];
var max = 15;
var speed=3;
var size=4;
var myWorker = new Worker("blockDiffWorker.js");
var activateParticle = false;
var showBlocks = false;
var showCam = true;
var motionTrigger = 5000;
var keepPartAlive = false;
var gr0, gr1, gr2, gr3;
var timer = null;
var display = false;
var list = ['item-0', 'item-1', 'item-2', 'item-3', 'item-4', 'item-5', 'item-6', 'item-7', 'item-8', 'item-9', 'item-10', 'item-11', 'item-12'];
var list2 = ['item-0', 'item-1', 'item-2'];

var debug = document.getElementById('debug');

var callback = function(v){ debug.innerHTML = v; }

// init gui and define global callback
var ui = new UIL.Gui( { css:'top:0px; right:5%;', size:300, center:true, height:27 } ).onChange( callback );


function populate(){
    if(!display){
        ui.add('title',  { name:'The Burning Man', color:'N'}); 
        gr0 = ui.add('group', { name:'Particle Settings', height:36 });
        ui.add('bool',   { name:'Activate Particle', callback: function (flag) { activateParticle = flag; particles = [];} });
        gr0.add('slide',  { name:'particle LifeTime', min:5, max:60, value:15, precision:1, fontColor:'#B0CC99', height:20, callback: function (sliderValue) { max = sliderValue }});
        gr0.add('slide',  { name:'particle Speed', min:1, max:25, value:3, precision:1, fontColor:'#B0CC99', height:20, callback: function (sliderValue) { speed = sliderValue }}); 
        gr0.add('slide',  { name:'particle Size', min:1, max:10, value:2, precision:1, fontColor:'#B0CC99', height:20, callback: function (sliderValue) { size = sliderValue }}); 
        ui.add('bool',   { name:'Keep Particle alive', callback: function (flag) { keepPartAlive = flag} });
        
        gr0 = ui.add('group', { name:'Motion Settings', height:36 });
        ui.add('bool',   { name:'Show Blocks', callback: function (flag) { showBlocks = flag} });
        ui.add('color', { name:'Block Color', callback:callback, type:'rgba', value:[0,1,1,1]});
        ui.add('color', { name:'Background Color', callback:callback, type:'rgba', value:[0,1,1,1]});
        ui.add('bool',   { name:'Show Camera', callback: function (flag) { showCam = flag} });
        gr0.add('slide',  { name:'Block Size', min:1, max:3, value:2, precision:1, step:1, fontColor:'#B0CC99', height:20, callback: function (sliderValue) { gBlockSize = Math.pow(2, sliderValue) }});
        gr0.add('slide',  { name:'Motion Trigger', min:100, max:10000, value:5000, step:1, fontColor:'#B0CC99', height:20, callback: function (sliderValue) { motionTrigger = sliderValue }}); 
        gr0.open();
        display = true;
    } else {
        ui.clear();
        display = false;
    }
}

populate();





  // Normalize the various vendor prefixed versions of getUserMedia.
  navigator.getUserMedia = (navigator.getUserMedia ||
                            navigator.webkitGetUserMedia ||
                            navigator.mozGetUserMedia || 
                            navigator.msGetUserMedia);
// Check that the browser supports getUserMedia.
// If it doesn't show an alert, otherwise continue.
if (navigator.getUserMedia) {
  // Request the camera.
  navigator.getUserMedia(
    // Constraints
    {
      video: true
    },

    // Success Callback
    function(localMediaStream) {
      video = document.getElementById('camera-stream');
      canvas = document.getElementById('canvas');
      canvasHidden = document.getElementById('canvasHidden');
      video.src = window.URL.createObjectURL(localMediaStream);
      requestAnimationFrame(draw);
    },

    // Error Callback
    function(err) {
      // Log the error to the console.
      console.log('The following error occurred when trying to use getUserMedia: ' + err);
    }
  );

} else {
  alert('Sorry, your browser does not support getUserMedia');
}

function draw(){
        startwaitFrameCount++;
      
      var ctx = canvas.getContext('2d');  
      var ctxHidden = canvasHidden.getContext('2d');      
      ctxHidden.drawImage(video,0,0, 320, 240);
      if(data === undefined){
        data = ctxHidden.getImageData(0,0,canvasHidden.width,canvasHidden.height);

      requestAnimationFrame(draw);
      }else{
        var dataNew = ctxHidden.getImageData(0,0,canvas.width,canvas.height);
        //var blockArrayA = convertImageToBlocks(data,gBlockSize,canvas.width,canvas.height);
        //var blockArrayB = convertImageToBlocks(dataNew,gBlockSize,canvas.width,canvas.height);
        //var bkla = diffBlockImage(blockArrayA, blockArrayB, gBlockSize,data);
        //var flat = convertBlocksToImage(bkla,gBlockSize,canvas.width,canvas.height);
        //var old = diffImage(dataNew, data, 8);
        //ctx.putImageData(old.image,0,0, 0, 0, 640, 480);
        
        //handleImage2Block(data,gBlockSize,canvas.width,canvas.height, false);
        //handleImage2Block(dataNew,gBlockSize,canvas.width,canvas.height, true);
        

        handleDiff(data, dataNew,gBlockSize,canvas.width,canvas.height, ctx);
         
        data = dataNew;
        //set the data back    
        //if(flat !== undefined){
        //    var palette = ctx.getImageData(0,0,320,240);
        //    palette.data.set(new Uint8ClampedArray(flat));
        //    ctx.putImageData(palette,0,0);
        //}

      }
      
}

var handleDiff = function (dataA, dataB, blockSize, w, h, ctx){
    if (window.Worker) {
        myWorker.postMessage([dataA, dataB, blockSize, w, h, showBlocks, showCam]);
        myWorker.onmessage = function(e) {
            //console.log('Message received from worker', e);
            var flat = e.data[0];
            var changedBlocks = e.data[1];
            if(changedBlocks.length < motionTrigger){
                for (var i = 0; i < changedBlocks.length; i++) {
                var p = new Particle(changedBlocks[i][0],changedBlocks[i][1], (Math.random()*2*speed-speed)/2, 0-Math.random()*2*speed);
                particles.push(p);
                
                }
            }

            if(flat !== undefined){
                var palette = ctx.getImageData(0,0,320,240);
                palette.data.set(new Uint8ClampedArray(flat));
                ctx.putImageData(palette,0,0);
                requestAnimationFrame(draw);
            }           
            if(activateParticle){
                handleAni(ctx);
            }
        }
    }
}
var handleAni = function(ctx){
    ctx.globalCompositeOperation="lighter";
for (var i=0; i<particles.length; i++) {
        ctx.fillStyle = "rgba("+(260-(particles[i].life*2))+","+((particles[i].life*2)+50)+","+(particles[i].life*2)+","+(((max-particles[i].life)/max)*0.4)+")";
        ctx.beginPath();
        ctx.arc(particles[i].x,particles[i].y,(max-particles[i].life)/max*(size/2)+(size/2),0,2*Math.PI);
        ctx.fill();
        particles[i].x+=particles[i].xs;
        particles[i].y+=particles[i].ys;

        particles[i].life++;
        if (particles[i].life >= max) {
            particles.splice(i, 1);
            i--;
        }
    }
}

var Particle = function(x, y, xs, ys) {
    this.x=x;
    this.y=y;
    this.xs=xs;
    this.ys=ys;
    this.life=0;
}

var diffBlockImage = function (imageBlocksA, imageBlocksB, depth, frame) {
    var length = imageBlocksB.length;
    var result = {
        frame: frame
    };
    markedPixel = [];
    var tmp = imageBlocksB;
    for (var i = 0; i < length; i++) {
        //cache frameblock of both images
        var actBlock = imageBlocksB[i];
        var cachedBlock = imageBlocksA[i];
        var blockASumR = 0, blockASumG = 0, blockASumB = 0;
        var blockBSumR = 0, blockBSumG = 0, blockBSumB = 0;
        for (var j = 0; j < actBlock.length; j++) {
            for (var k = 0; k < actBlock.length; k++) {
                blockASumR = blockASumR + actBlock[j][k][0];
                blockASumG = blockASumG + actBlock[j][k][1];
                blockASumB = blockASumB + actBlock[j][k][2];
                blockBSumR = blockBSumR + cachedBlock[j][k][0];
                blockBSumG = blockBSumG + cachedBlock[j][k][1];
                blockBSumB = blockBSumB + cachedBlock[j][k][2];
            }
        }
        //normalizise
        blockASumR = blockASumR / 64;
        blockASumG = blockASumG / 64;
        blockASumB = blockASumB / 64;
        blockBSumR = blockBSumR / 64;
        blockBSumG = blockBSumG / 64;
        blockBSumB = blockBSumB / 64;
        var diffAllR = Math.abs(blockBSumR - blockASumR);
        var diffAllG = Math.abs(blockBSumG - blockASumG);
        var diffAllB = Math.abs(blockBSumB - blockASumB);
        var diffAll = Math.abs(greyscale(diffAllR, diffAllG, diffAllB));
        diffAll = Math.round(diffAll);
        for (var z = 0; z < actBlock.length; z++) {
            for (var x = 0; x < actBlock.length; x++) {
                
                if (diffAll < depth) {
                   // tmp[i][z][x][0] = 255;
                    //tmp[i][z][x][1] = 255;
                    //tmp[i][z][x][2] = 255;

                    tmp[i][z][x][0] = imageBlocksB[i][z][x][0];
                    tmp[i][z][x][1] = imageBlocksB[i][z][x][1];
                    tmp[i][z][x][2] = imageBlocksB[i][z][x][2];
                } else {
                    tmp[i][z][x][0] = 0;
                    tmp[i][z][x][1] = 0;
                    tmp[i][z][x][2] = 0;
                    
                    var c = calcCoodfromBlock(tmp,depth,i,320);
                    var p = new Particle(c[0],c[1], (Math.random()*2*speed-speed)/2, 0-Math.random()*2*speed);
                    particles.push(p);
                }
            }
        } 

    }

    return tmp;
};
var calcCoodfromBlock = function(blocks, blockSize, index, width){
    var wB = width/blockSize;
    var y = Math.floor(index / wB);
    var x = Math.floor(index % wB);
    return [x,y];
}
var convertBlocksToImage = function (blockData, blockSize, width, height) {
    var res = [];
    var length = blockData.length;
    var w = width / blockSize;
    var h = height / blockSize;


    //console.log(blockData);
    for (var y = 0; y < h; y++) {
        var blockRow = [];
        for (var x = 0; x < w; x++) {
            var block = blockData[y * w + x];
            blockRow.push(block);
        }

        for (var j = 0; j < blockSize; j++) {
            for (var k = 0; k < blockRow.length; k++) {
                var block = blockRow[k];
                for (var m = 0; m < blockSize; m++) {
                    var pixel = block[m][j];
                    for (var p = 0; p < 4; p++) {
                        res.push(pixel[p]);
                    }
                };

            }
        }
    }
    return res;
}
var convertImageToBlocks = function (imageData, blockSize, width, height) {
    var length = imageData.data.length / 4,
        pixels = [],
        blocks = [],
        currentBlock = [];

    for (var i = 0; i < length; i++) {
        var pixel = [];

        pixel.push(imageData.data[i * 4 + 0]);
        pixel.push(imageData.data[i * 4 + 1]);
        pixel.push(imageData.data[i * 4 + 2]);
        pixel.push(imageData.data[i * 4 + 3]);

        pixels.push(pixel);
    }

    for (var y = 0; y < height; y += blockSize) {
        for (var x = 0; x < width; x += blockSize) {
            currentBlock = [];
            for (var j = 0; j < blockSize; j++) {
                currentBlock[j] = [];
                for (var k = 0; k < blockSize; k++) {
                    currentBlock[j][k] = pixels[((y + k) * width) + (x + j)];
                }
            }
            blocks.push(currentBlock);
        }
    }
    return blocks;
};

var greyscale = function (r, g, b) {
        return  0.3 * r + 0.6 * g + 0.1 * b;
};
    var diffImage = function (imageA, imageB, depth) {
        var length = imageB.data.length / 4;
        var result = {
            image: imageB,
            cut: false
        };

        for (var i = 0; i < length; i++) {
            var r = imageB.data[i * 4 + 0];
            var g = imageB.data[i * 4 + 1];
            var b = imageB.data[i * 4 + 2];

            var prevR = imageA.data[i * 4 + 0];
            var prevG = imageA.data[i * 4 + 1];
            var prevB = imageA.data[i * 4 + 2];

            // Math.abs() returns the absolute value of a number.
            var diffR = Math.abs(r - prevR);
            var diffG = Math.abs(g - prevG);
            var diffB = Math.abs(b - prevB);

            // 'diffAll' contains the absolute sum of each colorchannel.
            var diffAll = Math.abs(greyscale(diffR, diffG, diffB));

            if (diffAll < depth) {
                result.image.data[i * 4 + 0] = 1;
                result.image.data[i * 4 + 1] = 128;
                result.image.data[i * 4 + 2] = 128;

            } else {
                // 'diffAll' might also be replaced with zeros to get
                // a black Pixel for each difference.
                result.image.data[i * 4 + 0] = diffAll;
                result.image.data[i * 4 + 1] = diffAll;
                result.image.data[i * 4 + 2] = diffAll;

            }
        }
        return result;
    };
}
