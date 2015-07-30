
function Zipper() {

  var file_system = require('fs');
  var archiver = require('archiver');

  var FC = require('./function_chain');
  var fc = new FC();

  var me = this;

  me.zip = function(input) {
    //var now = new Date;
    //var id = '.' + now.getFullYear() + now.getHours() + now.getMinutes() + now.getSeconds();
    //var zipFile = 'aws_account_services' + id + '.zip';
    //var zipFile = 'aws_services.zip';
    //var sourceFolder = '/Users/alex.ough/Projects/Node/aws-services';
    //var src = ['aws_config/**/*', 'cloudtrail/**/*', 'lib/**/*']
    //var destinationFolder = './zips';
    var output = file_system.createWriteStream(input.zipFile);
    var archive = archiver('zip');

    output.on('close', function () {
        console.log(archive.pointer() + ' total bytes');
        console.log('archiver has been finalized and the output file descriptor has closed.');
        fc.run_success_function(me.zip, input);
    });

    archive.on('error', function(err){
      console.log("Error in zip : " + err, err.stack);
      fc.run_error_function(me.zip, err);
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
