
var git = require('gulp-git'),
gulp = require('gulp'),
vfs = require('vinyl-fs'),
zip = require('gulp-zip'),
exec = require('child_process').exec;

vfs.src(['volume/index.js', 'volume/json/*', 'volume/node_modules/mysql/**/*', 'lib/flow_controller.js', 'lib/aws/*.js'],{cwd:'../..', base:'../..'})
.pipe(zip('volume.zip'))
.pipe(gulp.dest('.'))
.on('end', function(err, data) {
});
