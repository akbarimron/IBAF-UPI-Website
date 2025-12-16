const fs = require('fs');
const archiver = require('archiver');

// Output file
const output = fs.createWriteStream('build.zip');
const archive = archiver('zip', {
  zlib: { level: 9 }
});

output.on('close', function() {
  console.log(`build.zip created: ${archive.pointer()} total bytes`);
});

archive.on('error', function(err) {
  throw err;
});

archive.pipe(output);

// Change './dist' to your build output folder if needed
archive.directory('./dist/', false);

archive.finalize();
