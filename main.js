var fs = require('fs');
var path = require('path');
var JSZip = require('jszip');
var Q = require('q');
var async = require('async')
var ZipExport = require('./libs/ZipExport.js');

/*****************************************************************************************
******************************** PRIVATE HELPER FUNCTIONS ********************************
*****************************************************************************************/

/*
 * recursively and asynchronously vistis the directory and all subdirectories and zips all files it finds
 * @param dir {String}: the path to the subdirectory
 * @param zipped_dir {JSZip}: the JSZip object with the new directory as root
 */
function zip_dir(dir, zipped_dir) {

    var deferred = Q.defer();

    fs.readdir(dir, function (err, entries) {
        
        if (err)
            throw err;

        var entries_paths = entries.map(function (entry) { 
            return path.normalize(dir + path.sep + entry);
        });

        async.map(entries_paths, fs.stat, function (err, stats) {
            
            var entries_count = entries_paths.length;

            // construct a an array of objects each contain an with-parent entry and its type
            var typed_entries = Array(entries_count);
            for (var i = 0; i < entries_count; i++) {

                typed_entries[i] = {
                    path: entries_paths[i],
                    type: stats[i].isDirectory() ? 'dir' : 'file'
                }
            }

            async.each(typed_entries, function (entry, callback) {
                
                var parsed_entry_path = path.parse(entry.path);

                if (entry.type === 'dir') {
                    
                    var new_zipped_dir = zipped_dir.folder(parsed_entry_path.base);

                    // recursively zip the newly found dir
                    Q.fcall(zip_dir, entry.path, new_zipped_dir).then(function () {
                        //the end of this iteration
                        callback();
                    }).done();
                }
                else {

                    fs.readFile(entry.path, function (err, data) { 
                        
                        if (err)
                            throw err;
                        
                        //zip the file within the current subdir
                        zipped_dir.file(parsed_entry_path.base, data);
                        
                        // the end of this iteration
                        callback();
                    });
                } 

            }, function (err) {
                
                // here all iterations are over
                if (err)
                    throw err;

                // resolve the deffered and fullfil the promise
                deferred.resolve();      
            });
        });
    });

    return deferred.promise;
} 

/*
 * recursively and synchronously visits the directory and all subdirectories and zips all files it finds
 * @param dir {String}: the path to the subdirectory
 * @param zipped_dir {JSZip}: the JSZip object with the new directory as root
 */
function zip_dir_sync(dir, zipped_dir) {
    
    var entries = fs.readdirSync(dir);
    var entries_count = entries.length;
    
    for(var i = 0; i < entries_count; i++) {
        var entry = entries[i];        
        var entry_normalized_path = path.normalize(dir + path.sep + entry);
        var entry_stats = fs.statSync(entry_normalized_path);
        
        if(entry_stats.isDirectory()) {
            
            var new_zipped_dir = zipped_dir.folder(entry);
            
            // recursively zip the newly found dir
            zip_dir_sync(entry_normalized_path, new_zipped_dir);
        }
        else {
            
            var file = fs.readFileSync(entry_normalized_path);
            
            // zip the file within current subdir
            zipped_dir.file(entry, file);
        }
    }
}


/*****************************************************************************************
********************************** MODULE PUBLIC APIS ************************************
*****************************************************************************************/


var ZipLocal = {};  //the module container

ZipLocal.sync = {} // container for the synchronous version of the the api

/*
 * zips a given file/directory asynchronously
 * @param _path {String}: the path to file/directory to zip
 * @param _callback {Function}: the function to be called when the zipping is done
 */
ZipLocal.zip = function (_path, _callback) {
    
    var callback = _callback || function () { };

    var normalized_path = path.normalize(_path);
    var zipped_obj = new JSZip();

    fs.stat(normalized_path, function (err, stats) {
        
        if (err)
            throw err;

        if (stats.isDirectory()) {
            
            // start zipping the directory
            Q.fcall(zip_dir, normalized_path, zipped_obj).then(function () {
                
                // invoke the callback
                callback(new ZipExport(zipped_obj, false, true));
            }).done();
        }
        else {

            var parsed_path = path.parse(normalized_path);
            fs.readFile(normalized_path, function (err, file) {
                
                if (err)
                    throw err;

                zipped_obj.file(parsed_path.base, file);

                // invoke the callback
                callback(new ZipExport(zipped_obj, false, true));

            });
        }
    });
}

/*
 * unzips a given zip file asynchronously
 * @param _path {String}: the path to the zip file
 * @param _callback {Function}: the function to be called when the unzipping is done
 */
ZipLocal.unzip = function (_path, _callback) {
    
    var callback = _callback || function () { };

    var normalized_path = path.normalize(_path);

    fs.readFile(normalized_path, function (err, data) {
        
        var zipped_obj = new JSZip();
        zipped_obj.load(data);
        
        //invoke the callback
        callback(new ZipExport(zipped_obj, true, true))

    });

} 

/*
 * zips a given file/directory synchronously
 * @param _path {String}: the path to the file/directory to zip
 * @return {ZipExport}: the ZipExport object that contains exporting interfaces
 */
ZipLocal.sync.zip = function(_path) {
    
    var normalized_path = path.normalize(_path);
    var stats = fs.statSync(normalized_path);
    var zipped_obj = new JSZip();
    
    if(stats.isDirectory()) {
        
        // start zipping the directory
        zip_dir_sync(normalized_path, zipped_obj);
        
        return new ZipExport(zipped_obj);
    }
    else {
        
        var parsed_path = path.parse(normalized_path);
        var file = fs.readFileSync(normalized_path);
        
        zipped_obj.file(parsed_path.base, file);
        
        return new ZipExport(zipped_obj);
    }
}

/*
 * unzips a given zip file synchrnously
 * @param _path {String}: the path to the zip file
 * @return {ZipExport}: the ZipExport object that contains exporting interfaces
 */
ZipLocal.sync.unzip = function (_path) {

    var normalized_path = path.normalize(_path);

    var data = fs.readFileSync(_path);

    var zipped_obj = new JSZip();
    zipped_obj.load(data);

    return new ZipExport(zipped_obj, true, false);
}; 


module.exports = ZipLocal;