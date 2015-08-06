
var inherits = require('util').inherits;
var FlowController = require('./flow_controller');
var file_system = require('fs');
var archiver = require('archiver');

function Zipper() {

  FlowController.call(this);

  var me = this;

  me.findService = function(func, input) { };

  me.zip = function(input) {

    me.preRun(arguments.callee, input);

    var output = file_system.createWriteStream(input.zipFile);
    var archive = archiver('zip');

    output.on('close', function () {
        console.log(archive.pointer() + ' total bytes');
        console.log('archiver has been finalized and the output file descriptor has closed.');
        me.succeeded(input);
    });

    archive.on('error', function(err){
      console.log("Error in zip : " + err, err.stack);
      me.errored(err);
    });

    archive.pipe(output);
    archive.bulk([
        { expand: true, cwd: input.sourceFolder, src: input.src}
        //{ expand: true, cwd: sourceFolder, src: ['**/*'], dot: true}
    ]);
    archive.finalize();
  }
}

module.exports = Zipper
