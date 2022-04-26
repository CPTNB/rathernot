const { spawn } = require('child_process');

// takes a command and collects stdout into a single string in a promise
module.exports.spawnP = async function (command, args = []) {
  return new Promise(function (resolve, reject) {
    let allOutputs = [];
    let allErrors = [];
    const proc = spawn(command, args);
    proc.stderr.on('data', l => allErrors.push(l.toString()));
    proc.stdout.on('data', l => allOutputs.push(l.toString()));
    proc.on('close', (code) => {
      allErrors.forEach(e => console.error(e));
      if (code != 0) {
        reject(allErrors.join('\n'));
      } else {
        resolve(allOutputs.join('\n'));
      }
    });
  });
}
