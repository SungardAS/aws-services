var config = {
  s3: [
    {
      aws: {
        region: 'us-east-1',
        bucket: 'sgas.particles-awsconfig.266593598212.us-east-1'
      },
      clean: true,
      validate: true,
      create: true
    },
    {
      aws: {
        region: 'us-west-2',
        bucket: 'sgas.particles-awsconfig.266593598212.us-west-2'
      },
      clean: true,
      validate: true,
      create: true
    }
  ],
  dist: 'dist'
};

module.exports = config;
