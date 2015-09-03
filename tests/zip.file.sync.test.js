var fs = require('fs');
var expect = require('chai').expect;
var zipper = require('../main.js');
var JSZip = require('jszip');

var localMemory = {}; // used for passing variables between tests

describe("Zipping files synchrnously", function () {
    
    /* Test 1 : zipping a file in memory synchrnously without errors */
    it("should zip a file in memory without any errors", function () {
        
        localMemory.T1ZippedBuffer = zipper.sync.zip("./tests/assets/hello-world").memory();
    });
    
    /* Test 2: making sure that the zipped buffer from Test 1 contains correct data */
    it("checks if the zipped buffer contains correct data (using JSZip)", function () {
        
        var zipped = new JSZip(localMemory.T1ZippedBuffer);
        
        expect(zipped.files).to.have.property("hello-world") &&
        expect(zipped.file("hello-world").asText()).to.equal("Hello World.");

    });
    
    /* Test 3: zipping a file to disk synchrnously without errors */
    it("should zip a file to disk without any errors", function () {
        
        zipper.sync.zip("./tests/assets/hello-world").save("./tests/assets/files.sync.T3Pack.zip");

        // make sure the file exists
        var entries = fs.readdirSync("./tests/assets/");
        
        expect(entries).to.include("files.sync.T3Pack.zip");
    });
    
    /* Test 4: making sure that the zipped file from Test 3 contains correct data */
    it("checks if the zipped file contains correct data (using JSZip)", function (done) {
        
        fs.readFile("./tests/assets/files.sync.T3Pack.zip", function (err, data) {
            
            var zipped = new JSZip(data);
            
            expect(zipped.files).to.have.property("hello-world") &&
            expect(zipped.file("hello-world").asText()).to.equal("Hello World.");
            
            done();
        });
    });

});