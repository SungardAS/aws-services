var config = {
  s3: [
    {
      aws: {
        region: 'us-east-1',
        bucket: 'sgas.particles-cfn-launch.442294194136.us-west-2'
      },
      clean: true,
      validate: true,
      create: true
    }
  ],
  dist: 'dist'
};

module.exports = config;
