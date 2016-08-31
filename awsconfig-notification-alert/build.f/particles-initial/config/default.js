var config = {
  s3: [
    {
      aws: {
        region: 'us-west-2',
        bucket: 'sgas.particles-notificationalert.442294194136.us-west-2'
      },
      clean: true,
      validate: true,
      create: true
    }
  ],
  dist: 'dist'
};

module.exports = config;
