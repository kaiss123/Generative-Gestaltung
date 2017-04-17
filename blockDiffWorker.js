onmessage = function(e) {
  	console.log('Posting message back to main script');
	var data = e.data[0];
	var dataNew = e.data[1];
	var gBlockSize = e.data[2];
	var width = e.data[3];
	var height = e.data[4];
	var showBlocks = e.data[5];
	var showCam = e.data[6];
	changedBlock = [];
	//console.log(data, dataNew, gBlockSize, width, height);
	var blockArrayA = convertImageToBlocks(data,gBlockSize,width,height);
	//console.log(blockArrayA);
    var blockArrayB = convertImageToBlocks(dataNew,gBlockSize,width,height);
	//console.log(blockArrayB);
    var bkla = diffBlockImage(blockArrayA, blockArrayB, gBlockSize,data,showBlocks, showCam);
	//console.log(bkla);
    var flat = convertBlocksToImage(bkla,gBlockSize,width,height);
  	postMessage([flat, changedBlock]);
}

var changedBlock = [];
var diffBlockImage = function (imageBlocksA, imageBlocksB, depth, frame,showBlocks,showCam) {
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
        var makesureonlyonePixelisAdded = true;
        for (var z = 0; z < actBlock.length; z++) {
            for (var x = 0; x < actBlock.length; x++) {
                
                if (diffAll < depth) {
                	if(!showCam){
                    	tmp[i][z][x][0] = 255;
                    	tmp[i][z][x][1] = 255;
                    	tmp[i][z][x][2] = 255;
                	}else{
                		tmp[i][z][x][0] = imageBlocksB[i][z][x][0];
                    	tmp[i][z][x][1] = imageBlocksB[i][z][x][1];
                    	tmp[i][z][x][2] = imageBlocksB[i][z][x][2];
                	}
                } else {
                	if(showBlocks){
                    	tmp[i][z][x][0] = 0;
                    	tmp[i][z][x][1] = 0;
                    	tmp[i][z][x][2] = 0;
                	}else{
						tmp[i][z][x][0] = imageBlocksB[i][z][x][0];
						tmp[i][z][x][1] = imageBlocksB[i][z][x][1];
						tmp[i][z][x][2] = imageBlocksB[i][z][x][2];

                	}
					if(makesureonlyonePixelisAdded){
						var c = calcCoodfromBlock(tmp,depth,i,320);
						changedBlock.push(c);
						makesureonlyonePixelisAdded = false;
					}
                    //var p = new Particle(c[0],c[1], (Math.random()*2*speed-speed)/2, 0-Math.random()*2*speed);
                    //particles.push(p);
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
    return [x*blockSize,y*blockSize];
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