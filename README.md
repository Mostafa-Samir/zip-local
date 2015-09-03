# zip-local

## Why another one?!

I was working on a poject and I needed something to zip and unzip local directories, so I went and searched on npm. I got quite a lot of results and all of them worked perfectly with files, but it when it came to directories each of them suffered from at least one of these three problems:
* not being asynchronous
* not being developer-friendly
* having odd behaviors (like zipping the whole path to root along with the directory)

So I wrote this to provide something free of the three problems!

## Installation

using npm:
```
npm install zip-local
```

## Usage

The API comes in two versions: an asynchrnous version and a synchronous one. This gives you the choice to use whichever suitable for your application.

### Zipping

Zipping is done through <code>ZipLocal.zip</code> or its synchronous version <code> ZipLocal.sync.zip</code> by passing the path to the file or directory that needs to be zipped. In the asynchrnous version, the callback is passed an instance of <code> ZipExport</code> object that contains the APIs to export the 
zipped file. In the synchronous version, the <code>ZipExport</code> object is returned.

Here's an example of asynchronous zipping,

```javascript
var zipper = require("zip-local");

// zipping a file
zipper.zip("./hello-world.cpp", function(zipped) {
	
    zipped.compress(); // compress before exporting
    
	var buff = zipped.memory(); // get the zipped file as a Buffer
    
    // or save the zipped file to disk
    zipped.save("../package.zip", function() {
    	console.log("saved successfully !");
    });
});
```

and here's synchronous zipping,

```javascript
var zipper = require('zip-local');

// zipping a file to memory without compression
var buff = zipper.sync.zip("./hello-world.java").memory();

// zipping a directory to disk with compression
// the directory has the following structure
// |-- hello-world.txt
// |-- cpp
//     |-- hello-world.cpp
// |-- java
//     |--hello-world.java
zipper.sync.zip("./hello/world/").compress().save("pack.zip");
```

### Unzipping

Similiarly, unzipping is done through <code>ZipLocal.unzip</code> or the synchronous <code>ZipLocal.sync.unzip</code> by passing the path to the zip file. Like the zipping functions, these functions also use the <code>ZipExport</code> object for exporting your unzipped file, but in case of exporting in memory the <code>memory</code> function returns a <code>ZippedFS</code> object instead of a buffer. This objects servers as a mini-filesystem for the unzipped file.

An example for asynchronous unzipping,

```javascript
var zipper = require('zip-local');

zipper.unzip("../package.zip", function(unzipped) {
	
    // extract to the current working directory
    unzipped.save(null, function() { });
    
    var unzippedfs = unzipped.memory();
    
    // print an array of file paths in the unzipped file
    console.log(unzippedfs.contents()); // prints [ 'hello-world.cpp' ]
    
    // read the file as text
    var txt = unzippedfs.read("hello-world.cpp", 'text');
    
    // or read it as Buffer
    var buff = unzippedfs.read("hello-world.cpp", 'buffer');
});
```

and the synchronous unzipping,

```javascript
var zipper = require('zip-local');

// extract to an existing directory
zipper.sync.unzip("pack.zip").save("../../hello");

// export in memory
var unzippedfs = zipper.sync.unzip("pack.zip").memory();

// prints ['hello-world.txt', 'cpp/hello-world.cpp', 'java/hello-world.java']
console.log(unzippedfs.contents()); 

// read file in buffer
var buff = unzippedfs.read("cpp/hello-world.cpp", "buffer");
```

read the [API documentations](https://github.com/Mostafa-Samir/zip-local/wiki/API-Documentation) for furthur details.

## License

### MIT
