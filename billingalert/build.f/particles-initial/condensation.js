var git = require('gulp-git'),
gulp = require('gulp'),
vfs = require('vinyl-fs'),
zip = require('gulp-zip'),
exec = require('child_process').exec;

module.exports.initialize = function(cb) {
  var child = exec('npm install', function(error, stdout, stderr) {
    if (error) return cb(error);
  });

  vfs.src(["billingalert/index.js", "billingalert/index_saver.js", "billingalert/metrics.js", "billingalert/json/*.json", "lib/flow_controller.js", "lib/aws/*.js"],{cwd:'../../..', base:'../../..'})
  .pipe(zip('billingalert.zip'))
  .pipe(gulp.dest('./particles/assets'))
  .on('end', function(err, data) {
    vfs.src(['cloudformation/*.js'],{cwd:'../../..', base:'../../..'})
    .pipe(zip('cloudformation_builder.zip'))
    .pipe(gulp.dest('./particles/assets'))
    .on('end', function(err, data) {
      vfs.src(['lambda/index_alertmessages.js', "lib/flow_controller.js", "lib/aws/*.js"],{cwd:'../../..', base:'../../..'})
      .pipe(zip('index_alertmessages.zip'))
      .pipe(gulp.dest('./particles/assets'))
      .on('end', cb);
    });
  });
};
