var git = require('gulp-git'),
gulp = require('gulp'),
vfs = require('vinyl-fs'),
zip = require('gulp-zip'),
exec = require('child_process').exec;

module.exports.initialize = function(cb) {
  var child = exec('npm install', function(error, stdout, stderr) {
    if (error) return cb(error);
  });

  vfs.src(['managed-os/amilookup-win.js'],{cwd:'../../..', base:'../../..'})
  .pipe(zip('amilookup-win.zip'))
  .pipe(gulp.dest('./particles/assets'))
  .on('end', cb)
};

