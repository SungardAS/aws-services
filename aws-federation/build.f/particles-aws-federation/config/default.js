var config = {
  s3: [
    {
      aws: {
        region: 'us-west-1',
        bucket: 'sgas.particles-aws-federation.622821376834.us-west-1'
      },
      clean: true,
      validate: true,
      create: true
    },
    {
      aws: {
        region: 'us-east-2',
        bucket: 'sgas.particles-aws-federation.622821376834.us-east-2'
      },
      clean: true,
      validate: true,
      create: true
    }
  ],
  dist: 'dist'
};

module.exports = config;
