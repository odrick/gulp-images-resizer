let through = require("through2");
let path = require("path");
let Jimp = require("jimp");
let appInfo = require("./package.json");
let tinify = require("tinify");

function fixPath(path) {
  return path.split("\\").join("/");
}

function getNameFromPath(path) {
  let filename = fixPath(path).split("/").pop();
  let index = filename.lastIndexOf('.');

  return filename.substring(0, index);
}

function getPathFromPath(path) {
  var arr = fixPath(path).split("/");
  arr.pop();
  return arr.join("/");
}

function getExtFromPath(path) {
  let index = path.lastIndexOf('.');
  return path.substring(index + 1);
}

function getErrorDescription(txt) {
  return appInfo.name + ": " + txt;
}

function getJimpFormat(format) {
  switch (format) {
    case "png":
      return Jimp.MIME_PNG;
    case "gif":
      return Jimp.MIME_GIF;
    case "bmp":
      return Jimp.MIME_BMP;
    default:
      return Jimp.MIME_JPEG;
  }
}

function tinifyImage(buffer, options, callback) {
  if (!options.tinify) {
    callback(buffer);
    return;
  }

  tinify.key = options.tinifyKey;

  tinify.fromBuffer(buffer).toBuffer(function(err, result) {
    if (err) throw err;
    callback(result);
  });
}

const SUPPORTED_EXT = ["png", "jpg", "jpeg", "gif", "bmp"];

module.exports = function(options = {}) {
  let firstFile = null;

  options.format = options.format || "*";
  options.format = options.format.toString().toLowerCase();
  if (SUPPORTED_EXT.indexOf(options.format) < 0) options.format = "*";

  options.width = options.width || Jimp.AUTO;
  options.height = options.height || Jimp.AUTO;

  options.noCrop = options.noCrop || false;

  options.quality = options.quality || 100;

  options.tinify = options.tinify || false;
  options.tinifyKey = options.tinifyKey || "";

  if (options.verbose) {
    console.log("gulp-images-resizer starting with options ", JSON.stringify(options));
  }

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

    if (SUPPORTED_EXT.indexOf(getExtFromPath(file.relative)) < 0) {
      cb();
      return;
    }

    Jimp.read(file.contents, (err, image) => {
      if (options.verbose) {
        console.log("Processing image", file.relative);
      }

      if (err) {
        console.error(getErrorDescription("Error reading " + file.relative));
        cb();
        return;
      }

      let format, ext;

      if (options.format === "*") {
        ext = getExtFromPath(file.relative);
        format = getJimpFormat(ext);
      } else {
        ext = options.format;
        format = getJimpFormat(options.format);
      }

      let width = options.width;
      let height = options.height;

      let width_aspect = false;
      let height_aspect = false;

      if (options.noCrop && image.bitmap.width !== image.bitmap.height) {
        let isWidthMax = image.bitmap.width > image.bitmap.height;
        if (isWidthMax) {
          height = Jimp.AUTO;
        } else {
          width = Jimp.AUTO;
        }
      } else {

        if (
          typeof width === "string" &&
          width.substr(width.length - 1) === "%"
        ) {
          width = Math.round(image.bitmap.width * (parseFloat(width) / 100))
        } 
        
        // If width is set get the aspect (Jimp auto returns -1).
        if ( width >= 1 ) {
          width_aspect = image.bitmap.width / width;
        }

        if (
          typeof height === "string" &&
          height.substr(height.length - 1) === "%"
        ) {
          height = Math.round(image.bitmap.height * (parseFloat(height) / 100))
        }
        
        // If height is set get the aspect (Jimp auto returns -1).
        if ( height >= 1 ) {
          height_aspect = image.bitmap.height / height;
        }

      }

      // If image would need cropping to avoid stretching.
      if ( height_aspect && width_aspect && height_aspect != width_aspect ) {

        // If height is more we'll trim the width
        if (height_aspect < width_aspect) {

          // Resize the width based on the height_aspect.
          var adjust = image.bitmap.width / height_aspect;

          image
            .resize(adjust, height)
            // Centre the image so we can crop to required height.
            .crop( ( adjust - width ) / 2 , 0, width, height)
            .quality(options.quality);

        } else {
          // Else we'll trim the height

          // Resize the height based on the width_aspect.
          var adjust = image.bitmap.height / width_aspect;

          image
            .resize(width, adjust)
            // Centre the image so we can crop to required width.
            .crop(0, ( adjust - height ) / 2 , width, height)
            .quality(options.quality);

        }

      } else {
        // Crop not needed as it would not be stretched.
        image.resize(width, height).quality(options.quality);

      }

      image.getBuffer(format, (err, buffer) => {
        if (err) {
          console.error(
            getErrorDescription("Error getting buffer " + file.relative)
          );
          cb();
          return;
        }

        tinifyImage(buffer, options, resBuffer => {
          let nf = firstFile.clone({ contents: false });

          nf.path = path.join(
            file.base,
            getPathFromPath(file.relative) +
              "/" +
              getNameFromPath(file.relative) +
              "." +
              ext
          );
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
