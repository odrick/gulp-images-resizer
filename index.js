let through = require("through2");
let path = require("path");
let Jimp = require("jimp");
let appInfo = require('./package.json');
let tinify = require("tinify");

function fixPath(path) {
    return path.split("\\").join("/");
}

function getNameFromPath(path) {
	return fixPath(path).split("/").pop().split(".").shift();
}

function getPathFromPath(path) {
	var arr = fixPath(path).split("/");
	arr.pop();
	return arr.join("/");
}

function getExtFromPath(path) {
    return path.split(".").pop().toLowerCase();
}

function getErrorDescription(txt) {
    return appInfo.name + ": " + txt;
}

function getJimpFormat(format) {
    switch (format) {
        case "png": return Jimp.MIME_PNG;
        case "gif": return Jimp.MIME_GIF;
        case "bmp": return Jimp.MIME_BMP;
        default: return Jimp.MIME_JPEG;
    }
}

function tinifyImage(buffer, options, callback) {
    if(!options.tinify) {
        callback(buffer);
        return;
    }

    tinify.key = options.tinifyKey;

    tinify.fromBuffer(buffer).toBuffer(function(err, result) {
        if (err) throw err;
        callback(result);
    });
}

const SUPPORTED_EXT = ["png", "jpg", "jpeg", "gif", "bpm"];

module.exports = function(options = {}) {
    let firstFile = null;

    options.format = options.format || "*";
    options.format = options.format.toString().toLowerCase();
    if(SUPPORTED_EXT.indexOf(options.format) < 0) options.format = "*";
    
    options.width = options.width || Jimp.AUTO;
    options.height = options.height || Jimp.AUTO;
    
    options.quality = options.quality || 100;

    options.tinify = options.tinify || false;
    options.tinifyKey = options.tinifyKey || "";

    function bufferContents(file, enc, cb) {
        if (file.isNull()) {
            cb();
            return;
        }

        if (file.isStream()) {
            console.error(getErrorDescription("Streaming not supported"));
            cb();
            return;
        }

        if (!firstFile) firstFile = file;
		
		if(SUPPORTED_EXT.indexOf(getExtFromPath(file.relative)) < 0) {
			cb();
            return;
		}
		
		Jimp.read(file.contents, (err, image) => {
			if (err) {
				console.error(getErrorDescription("Error reading " + file.relative));
				cb();
				return;
			}
			
			let format, ext;

            if(options.format === "*") {
                ext = getExtFromPath(file.relative);
                format = getJimpFormat(ext);
            }
			else {
                ext = options.format;
                format = getJimpFormat(options.format);
            }
            
            let width = options.width;
            let height = options.height;
            
            if((typeof width === "string") && width.substr(width.length-1) === "%") {
                width = Math.floor(image.bitmap.width * (parseInt(width) / 100));
            }
            
            if((typeof height === "string") && height.substr(height.length-1) === "%") {
                height = Math.floor(image.bitmap.height * (parseInt(height) / 100));
            }
			
			image.resize(width, height).quality(options.quality);
            
            image.getBuffer(format, (err, buffer) => {
                if (err) {
                    console.error(getErrorDescription("Error getting buffer " + file.relative));
                    cb();
                    return;
                }

                tinifyImage(buffer, options, (resBuffer) => {
                    let nf = firstFile.clone({contents: false});
					
                    nf.path = path.join(file.base, getPathFromPath(file.relative) + "/" + getNameFromPath(file.relative) + "." + ext);
                    nf.contents = resBuffer;
                    this.push(nf);

                    cb();
                });
            });
		});
    }

    function endStream(cb) {
        cb();
    }

    return through.obj(bufferContents, endStream);
};