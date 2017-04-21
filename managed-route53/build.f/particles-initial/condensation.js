var git = require('gulp-git'),
gulp = require('gulp'),
vfs = require('vinyl-fs'),
zip = require('gulp-zip'),
exec = require('child_process').exec;

module.exports.initialize = function(cb) {
  var child = exec('npm install', function(error, stdout, stderr) {
    if (error) return cb(error);
  });

  vfs.src(["managed-route53/index_*.js",  "managed-route53/json/*.json", "lib/flow_controller.js", "lib/aws/*.js"],{cwd:'../../..', base:'../../..'})
  .pipe(zip('managed-route53.zip'))
  .pipe(gulp.dest('./particles/assets'))
  .on('end', function(err, data) {
    vfs.src(['cloudformation/*.js'],{cwd:'../../..', base:'../../..'})
    .pipe(zip('cloudformation_builder.zip'))
    .pipe(gulp.dest('./particles/assets'))
      .on('end', cb);
  });
};
