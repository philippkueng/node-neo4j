'use strict';

/*global module:false*/
module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        jshint: {
            'node-neo4j': ['*.js', 'Grunfile.js', 'lib/*.js', 'test/**/*.js'],
            options: {
                node: true,
                curly: true,
                eqeqeq: true,
                immed: true,
                newcap: true,
                noarg: true,
                sub: true,
                undef: true,
                unused: false,
                boss: true,
                eqnull: true,
                devel: true,
                trailing: true,
                white:  false,
                maxcomplexity: 6,
                multistr: true,
                strict: 0,
                globals   : {
                    /* MOCHA */
                    describe   : false,
                    it         : false,
                    before     : false,
                    beforeEach : false,
                    after      : false,
                    afterEach  : false
                }
            }
        }
    });

    // Load plugins
    grunt.loadNpmTasks('grunt-contrib-jshint');

    // Default task.
    grunt.registerTask('default', 'jshint:node-neo4j');

    // Linting task.
    grunt.registerTask('lint', 'jshint:node-neo4j');
};
