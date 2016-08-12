#condensation-particle-tests
Utilities to test condensation particles

![condensation][condensation-image]

[![NPM][npm-image]][npm-url]
[![Gitter][gitter-image]][gitter-url]
[![Code Climate][codeclimate-image]][codeclimate-url]
[![Dependency Status][daviddm-image]][daviddm-url]

## Use

    var CondensationTests = require("condensation-particle-tests");
    var cTests = new CondensationTests();
    
    cTests.testParticle(
      "parameter",
      "base",
      require('./fixtures/parameter_base_output_1'),
      {logicalId: "BaseParameter"}
    );

### Constructor

@param `{Object}` [options] test configuration

@param `{Object}` [options.condensation] Condensation object to use for tests.

### testParticle
Compile and execute handlebars processing for a given particle

@param `{String}` particleType Name of the particle type

@param `{String}` particlePath Relative path to the particle

@param `{Object}` fixture A fixtue to compare the processed output to

@param `{Object}` [options] processing configuration

@param `{Object}` [options.logicalId] the Logical ID for the particle

@param `{Object}` [options.hArgs] Handlebars arguments to use for processing the particle

@param `{Boolean}` [options.validateJson=true] Whether to valide the output as valid JSON

@param `{String}` [options.assertType] How to assert against the fixture. If options.validateJson is true then assertType will be deepEqual. If false then equal

@return `{String}` The processed particle

## Sungard Availability Services | Labs
[![Sungard Availability Services | Labs][labs-image]][labs-github-url]

This project is maintained by the Labs team at [Sungard Availability
Services](http://sungardas.com)

GitHub: [https://sungardas.github.io][labs-github-url]

Blog: [http://blog.sungardas.com/CTOLabs/](http://blog.sungardas.com/CTOLabs/)


[labs-github-url]: https://sungardas.github.io
[labs-image]: https://raw.githubusercontent.com/SungardAS/repo-assets/master/images/logos/sungardas-labs-logo-small.png
[condensation-image]: https://raw.githubusercontent.com/SungardAS/condensation/master/docs/images/condensation_logo.png
[npm-image]: https://badge.fury.io/js/condensation-particle-tests.svg
[npm-url]: https://npmjs.org/package/condensation-particle-tests
[travis-image]: https://travis-ci.org/SungardAS/condensation-particle-tests.svg?branch=master
[travis-url]: https://travis-ci.org/SungardAS/condensation-particle-tests
[daviddm-image]: https://david-dm.org/SungardAS/condensation-particle-tests.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/SungardAS/condensation-particle-tests
[coveralls-image]: https://coveralls.io/repos/SungardAS/condensation-particle-tests/badge.svg
[coveralls-url]: https://coveralls.io/r/SungardAS/condensation-particle-tests
[codeclimate-image]: https://codeclimate.com/github/SungardAS/condensation-particle-tests/badges/gpa.svg
[codeclimate-url]: https://codeclimate.com/github/SungardAS/condensation-particle-tests
[gitter-image]: https://badges.gitter.im/Join%20Chat.svg
[gitter-url]: https://gitter.im/SungardAS/condensation?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge
