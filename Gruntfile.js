'use strict';
require('grunt');
require('mocha');

var config = {
  targets: {
    test: ['test/**/*.js', '!test/acceptance.js'],
    bin: ['bin/*.js'],
    src: ['lib/**/*.js', '*.js', 'config/*.js']
  },
  timeout: 5000,
  require: ['should']
};
config.targets.all = config.targets.test.concat(config.targets.bin).concat(config.targets.src);

module.exports = function(grunt) {
  grunt.initConfig({
    mochaTest: {
      code: {
        options: {
          reporter: 'spec',
          timeout: config.timeout,
          require: config.require
        },
        src: config.targets.test
      },
      browser: {
        options: {
          reporter: 'spec',
          timeout: 7500,
          require: config.require
        },
        src: ['test/acceptance.js']
      }
    },
    uglify: {
      options: {
        mangle: true,
        preserveComments: false
      },
      app: {
        files: grunt.file.expandMapping('build/js/*.js', 'public/js/', {
          flatten: true,
          rename: (destBase, destPath) => {
            return destBase + destPath.replace('.js', '.min.js');
          }
        })
      }
    },
    less: {
      css: {
        options: {
          compress: true
        },
        files: {
          'public/css/AdminLTE.min.css': 'build/css/AdminLTE.less',
          'public/css/landingPage.min.css': 'build/css/landingPage.less',
          'public/css/hawkeye.min.css': 'build/css/hawkeye.less',
          'public/css/skins/skin-black.min.css': 'build/css/skins/skin-black.less'
        }
      }
    },
    /* jshint camelcase:false */
    mocha_istanbul: {
      test: {
        options: {
          reporter: 'mocha-jenkins-reporter',
          coverageFolder: 'reports',
          timeout: config.timeout,
          require: config.require,
          reportFormats: ['cobertura', 'lcov', 'html']
        },
        src: config.targets.test
      }
    },
    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      stdout: {
        src: config.targets.all,
      },
      checkstyle: {
        src: config.targets.all,
        options: {
          reporter: 'checkstyle',
          reporterOutput: 'reports/jshint-checkstyle-result.xml'
        }
      }
    },
    watch: {
      node: {
        files: config.targets.all,
        tasks: ['jshint:stdout', 'mochaTest:code']
      },
      js: {
        files: [
          'build/js/*.js'
        ],
        tasks: ['uglify']
      },
      assets: {
        files: [
          'build/css/*.less',
        ],
        tasks: ['less']
      }
    }
  });

  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-mocha-istanbul');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-notify');

  grunt.registerTask('assets', ['uglify', 'less']);
  grunt.registerTask('test', ['jshint:stdout', 'mochaTest:code']);
  grunt.registerTask('browser', ['mochaTest:browser']);
  grunt.registerTask('default', ['assets', 'test']);
};
