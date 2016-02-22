var gulp = require('gulp');
var typescript = require('gulp-tsc');
var less = require('gulp-less');
var path = require('path');

var config = {
    paths: {
        ts: 'src/**/*.ts',
        views: 'src/views/**/*',
        less: 'src/less/**/*.less'
    }
}

gulp.task('compile', function(){
    gulp.src(config.paths.ts)
        .pipe(typescript({
            //out: 'bundle.js',
            module: 'commonjs',
            declaration: true,
            emitError: false
        }))
        .pipe(gulp.dest('build/'))
});
gulp.task('views', function(){
    gulp.src(config.paths.views)
        .pipe(gulp.dest('build/views'));
})
gulp.task('less', function(){
    gulp.src(config.paths.less)
        .pipe(less({
            paths: [ path.join(__dirname, 'less', 'includes') ]
        }))
        .pipe(gulp.dest('build/css'));
})

gulp.task('watch', function (cb) {
    gulp.watch(config.paths.ts, ['compile']);
    gulp.watch(config.paths.views, ['views']);
    gulp.watch(config.paths.less, ['less']);
});

gulp.task('default', ['compile','watch','views','less']);