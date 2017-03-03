var config = {
  s3: [
    {
      aws: {
        region: 'us-west-1',
        bucket: 'sgas.particles-managed-os.442294194136.us-west-1'
      },
      clean: true,
      validate: true,
      create: true
    }
  ],
  dist: 'dist'
};

module.exports = config;
