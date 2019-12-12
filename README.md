# gulp-images-resizer

[![Stats](https://nodei.co/npm/gulp-images-resizer.png?downloads=true&stars=true)](https://www.npmjs.com/package/gulp-images-resizer) \
Images resizer for gulp

# Install
   
$ npm install gulp-images-resizer

# Usage

```js
let resizer = require('gulp-images-resizer');

gulp.task('resize', function() {
    return gulp.src('src/**/*.*')
	.pipe(resizer({
            format: "png",
            width: "50%"
        }))
	.pipe(gulp.dest('dest/'));
});
```

# Available options

* `verbose` - log file processing options, each image as processed. Default: **false**
* `format` - fromat of output files (png, jpg, gif, bmp or *). Default: *
* `width` - width of output images (fixed, percentage or -1 for auto). Default: **-1**
* `height` - height of output images (fixed, percentage or -1 for auto). Default: **-1**
* `noCrop` - disable the crop feature. If true it will choose the max size between height/width. Default: **false**
* `quality` - quality of output images (from 0 to 100). Default: **100**
* `tinify` - tinify images using [TinyPNG](https://tinypng.com/). Default: **false**
* `tinifyKey` - [TinyPNG key](https://tinypng.com/developers). Default: **""**
