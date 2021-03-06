'use strict';

var jsonSchemaTest = require('json-schema-test')
  , Promise = require('./promise')
  , getAjvInstances = require('./ajv_async_instances')
  , assert = require('./chai').assert;


var instances = getAjvInstances({ v5: true });

instances.forEach(addAsyncFormatsAndKeywords);


jsonSchemaTest(instances, {
  description: 'asynchronous schemas tests of ' + instances.length + ' ajv instances with different options',
  suites: testSuites(),
  async: true,
  assert: require('./chai').assert,
  Promise: Promise,
  afterError: function (res) {
    console.log('ajv options:', res.validator._opts);
  },
  // afterEach: function (res) {
  //   console.log(res.errors);
  // },
  cwd: __dirname,
  hideFolder: 'async/',
  timeout: 90000
});


function testSuites() {
  if (typeof window == 'object') {
    var suites = {
      'async schemas': require('./async/{**/,}*.json', {mode: 'list'})
    };
    for (var suiteName in suites) {
      suites[suiteName].forEach(function (suite) {
        suite.test = suite.module;
      });
    }
  } else {
    var suites = {
      'async schemas': './async/{**/,}*.json'
    }
  }
  return suites;
}


function addAsyncFormatsAndKeywords (ajv) {
  ajv.addFormat('english_word', {
    async: true,
    validate: checkWordOnServer
  });

  ajv.addKeyword('idExists', {
    async: true,
    type: 'number',
    validate: checkIdExists
  });

  ajv.addKeyword('idExistsCompiled', {
    async: true,
    type: 'number',
    compile: compileCheckIdExists
  });
}


function checkWordOnServer(str) {
  return str == 'tomorrow' ? Promise.resolve(true)
          : str == 'manana' ? Promise.resolve(false)
          : Promise.reject(new Error('unknown word'));
}


function checkIdExists(schema, data) {
  switch (schema.table) {
    case 'users': return check([1, 5, 8]);
    case 'posts': return check([21, 25, 28]);
    default: throw new Error('no such table');
  }

  function check(IDs) {
    return Promise.resolve(IDs.indexOf(data) >= 0);
  }
}


function compileCheckIdExists(schema) {
  switch (schema.table) {
    case 'users': return compileCheck([1, 5, 8]);
    case 'posts': return compileCheck([21, 25, 28]);
    default: throw new Error('no such table');
  }

  function compileCheck(IDs) {
    return function (data) {
      return Promise.resolve(IDs.indexOf(data) >= 0);
    };
  }
}
