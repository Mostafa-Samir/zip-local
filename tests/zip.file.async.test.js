var fs = require('fs');
var expect = require('chai').expect;
var zipper = require('../main.js');
var JSZip = require('jszip');

var localMemory = {}; // used for passing variables between tests

describe("Zipping files asynchrnously", function () {

    /* Test 1 : zipping a file in memory asynchrnously without errors */
    it("should zip a file in memory without any errors", function (done) {
        
        zipper.zip("./tests/assets/hello-world", function (zipped) {

            localMemory.T1ZippedBuffer = zipped.memory();
             
            done();
        });
    });

    /* Test 2: making sure that the zipped buffer from Test 1 contains correct data */
    it("checks if the zipped buffer contains correct data (using JSZip)", function () {

        var zipped = new JSZip(localMemory.T1ZippedBuffer);

        expect(zipped.files).to.have.property("hello-world") &&
        expect(zipped.file("hello-world").asText()).to.equal("Hello World.");

    });

    /* Test 3: zipping a file to disk asynchrnously without errors */
    it("should zip a file to disk without any errors", function (done) {

        zipper.zip("./tests/assets/hello-world", function (zipped) {

            zipped.save("./tests/assets/files.async.T3Pack.zip", function () {
                
                // make sure that the file exists on disk
                fs.readdir("./tests/assets/", function (err, entries) { 
                    
                    expect(entries).to.include('files.async.T3Pack.zip');

                    done();
                });
            })
        });
    });
    
    /* Test 4: making sure that the zipped file from Test 3 contains correct data */
    it("checks if the zipped file contains correct data (using JSZip)", function (done) {

        fs.readFile("./tests/assets/files.async.T3Pack.zip", function (err, data) {
            
            var zipped = new JSZip(data);
            
            expect(zipped.files).to.have.property("hello-world") &&
            expect(zipped.file("hello-world").asText()).to.equal("Hello World.");

            done();
        });
    });

});