var config = {
  s3: [
    {
      aws: {
        region: process.env.AWS_REGION,
        bucket: `sgas.particles-awsconfigrules.${process.env.ACCOUNT}.${process.env.AWS_REGION}`
      },
      clean: true,
      validate: true,
      create: true
    }
  ],
  dist: 'dist'
};

module.exports = config;
