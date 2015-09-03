var fs = require('fs');
var path = require('path');
var async = require('async');
var ZippedFS = require('./ZippedFS.js');

/*****************************************************************************************
******************************** PRIVATE HELPER FUNCTIONS ********************************
*****************************************************************************************/

/*
 * extracts an unzipped file to the disk asynchrnously
 * @param _path {String}: extraction path
 * @param jszip {JSZip}: the jszip object containg the unzipped file
 * @param callback {Function}: the function to be called when extracting is done
 */
function extract_to(_path, jszip, callback) {

    var extraction_path = _path === null ? "./" : path.normalize(_path);
    var current_working_dirctory = process.cwd();

    // make sure that the extraction path points to a existing directory
    fs.stat(extraction_path, function (err, stats) {

        if (err)
            throw new Error(extraction_path + " doesn't exist");

        if (!stats.isDirectory())
            throw new Error(extraction_path + " is not a directory");

        // sort out the unzipped file to directories and files
        var dirs = [];
        var files = [];
        for (var name in jszip.files) {
            
            var entry = jszip.files[name];
            
            if (entry.dir)
                dirs.push(name);
            else
                files.push(name);
        }
        
        // sort the directories ascendingy by level
        dirs.sort(function (a, b) {
            function dir_sep_count(dir) { return (dir.match(/\//g) || []).length; }
            
            return dir_sep_count(a) - dir_sep_count(b);
        });

        // change process's working directory to extraction directory
        process.chdir(extraction_path);

        // create the directories
        async.eachSeries(dirs, function (dir, end_iteration) {

            fs.mkdir(dir, function () {
                // end of this iteration
                end_iteration();
            });

        }, function (err) {
            
            if (err)
                throw err;

            // write the files
            async.each(files, function (file, end_iteration) { 

                var data = jszip.file(file).asNodeBuffer();

                fs.writeFile(file, data, function (err) {
                    
                    if (err)
                        throw err;
                    
                    // end of this iteration
                    end_iteration();

                });
            }, function (err) { 
                
                // change the process working directory back
                process.chdir(current_working_dirctory);

                // invoke the callback
                callback();
            });
        });
    });
}

/*
 * extracts an unzipped file to the disk synchrnously
 * @param _path {String}: extraction path
 * @param jszip {JSZip}: the jszip object containg the unzipped file
 */
function extract_to_sync(_path, jszip) {
    
    var extraction_path = _path === null ? "./" : path.normalize(_path);
    var current_working_dirctory = process.cwd();
    
    // make sure that the extraction path points to a existing directory
    var stats;
    try { stats = fs.statSync(extraction_path); }
    catch (err) { throw new Error(extraction_path + " doesn't exist"); }
    if (!stats.isDirectory())
        throw new Error(extraction_path + " is not a directory");
    
    // sort out the unzipped file to directories and files
    var dirs = [];
    var files = [];
    for (var name in jszip.files) {

        var entry = jszip.files[name];

        if (entry.dir)
            dirs.push(name);
        else
            files.push(name);
    }
    
    // sort the directories ascendingy by level
    dirs.sort(function (a, b) {
        function dir_sep_count(dir) { return (dir.match(/\//g) || []).length; }
        
        return dir_sep_count(a) - dir_sep_count(b);
    });

    // change process's working directory to extraction directory
    process.chdir(extraction_path);

    // create the directories
    dirs.forEach(function (dir) {
        fs.mkdirSync(dir);
    });

    // write the files
    files.forEach(function (file) {

        var data = jszip.file(file).asNodeBuffer();

        fs.writeFileSync(file, data);
    });

    // change the process working directory back
    process.chdir(current_working_dirctory);
}


/*****************************************************************************************
********************************** MODULE PUBLIC APIS ************************************ 
***** THE MODULE CONTAINS THE APIS THAT DEAL WITH EXPORTING AFTER ZIPPING IS COMPLETE ****
*****************************************************************************************/

/*
 * constructs a ZipExport object out of a JSZip object
 * @param jszip {JSZip}: the JSZip object
 * @param unzipped {Boolean}: a flag to indicate if the source jszip was from an unzipped file
 * @param async {Boolean}: a flag to indicate whether the zipping was asynchrnously
 */
function ZipExport(jszip, unzipped, async) {
    
    // hold the JSZip for exporting
    this.content = jszip;
    
    // determines if the exported will be compressed
    this.compressed = false;
    
    // determines if the source is an unzipped file 
    this.src_unzipped = unzipped ? true : false;
    
    // determines if the exported file will be written asynchronously
    this.save_async = async ? true : false;
}

/*
 * sets the object so that the exported format will be compressed
 */
ZipExport.prototype.compress = function () {

    if(!this.src_unzipped)
        this.compressed = true;
    
    return this;
}

/*
 * returns the zipped/unzipped file representation in memory
 * @return {Buffer|ZippedFS}: Buffer for a zipped file, a ZippedFS object for unzipped
 */
ZipExport.prototype.memory = function() {
    
    if (!this.src_unzipped) {

        // generate the zipped buffer
        var buff = this.content.generate({
            type: "nodebuffer",
            compression: this.compressed ? "DEFLATE" : undefined
        });
        
        return new Buffer(buff);
    }
    else {

        // return a ZippedFS object of the unzipped file
        return new ZippedFS(this.content);
    }
}

/*
 * writes the zipped/unzipped file to disk
 * @param _path {String}: path to the output file
 * @param _callback {Function}: the function to be called when the save is done (only in async zipping)
 */
ZipExport.prototype.save = function (_path, _callback) {
    
    var callback = _callback || function () { };
    
    if (!this.src_unzipped) {
        // generate the zipped buffer
        var buff = this.content.generate({
            type: "nodebuffer",
            compression: this.compressed ? "DEFLATE" : undefined
        });
        
        var normalized_path = path.normalize(_path);
        var parsed_path = path.parse(normalized_path);
        var current_working_directory = process.cwd();
        
        
        // change process's directory to save directory if exists
        if (parsed_path.dir !== '')
            process.chdir(parsed_path.dir);
        
        // write the new file
        if (!this.save_async)
            fs.writeFileSync(parsed_path.base, buff);
        else
            fs.writeFile(parsed_path.base, buff, function (err) {
                
                if (err)
                    throw err;
                
                //invoke the callback
                callback();

            });
        
        // change process's directory back
        process.chdir(current_working_directory);
    }
    else {
        
        // extract the unzipped file to given directory
        if (!this.save_async)
            extract_to_sync(_path ? _path : null, this.content);
        else
            extract_to(_path ? _path : null, this.content, callback);
    }
}


module.exports = ZipExport;