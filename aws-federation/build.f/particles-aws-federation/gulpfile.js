var gulp = require('gulp'),
config = require('config');

// Will add necessary gulp tasks to build, compile and validate
// CloudFormation templates

require('condensation').buildTasks(gulp,config);
