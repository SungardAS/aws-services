var git = require('gulp-git'),
gulp = require('gulp'),
vfs = require('vinyl-fs'),
zip = require('gulp-zip'),
exec = require('child_process').exec;

module.exports.initialize = function(cb) {
  var child = exec('npm install', function(error, stdout, stderr) {
    if (error) return cb(error);
  });

  vfs.src(['spotinst/*.js', 'spotinst/config/*.json', 'spotinst/node_modules/**/*'],{cwd:'../../..', base:'../../..'})
  .pipe(zip('spotinst.zip'))
  .pipe(gulp.dest('./particles/assets'))
  .on('end', cb);
};
