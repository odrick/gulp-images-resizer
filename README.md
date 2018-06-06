# gulp-images-resizer

> Images resizer for gulp

# Install
   
$ npm install gulp-images-resizer

# Basic usage
```js
let resizer = require('gulp-images-resizer');

gulp.task('resize', function() {
    return gulp.src('src/**/*.*')
		.pipe(resizer())
		.pipe(gulp.dest('dest/'));
});
```

# Advanced usage

Use resizer options object

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

* `format` - fromat of output files (png, jpg, gif, bmp or *). Default: *
* `width` - width of output images (fixed, percentage or -1 for auto). Default: **-1**
* `height` - height of output images (fixed, percentage or -1 for auto). Default: **-1**
* `tinify` - tinify images using [TinyPNG](https://tinypng.com/). Default: **false**
* `tinifyKey` - [TinyPNG key](https://tinypng.com/developers). Default: **""**