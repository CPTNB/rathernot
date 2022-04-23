import { Service, URel } from '../rn';
import { useState, useEffect } from 'react';
import * as ReactDom from 'react-dom';
import { readFile, readDir } from 'fs/promises';
import { resolve } from 'path';

const fs = Service({
  ls: async (dirpath) => {
    const files = await readDir(resolve('.', dirpath), { withFileType: true });
    return (files || []).map(file => ({
      name: file.name,
      dir: file.isDirectory()
    }));
  },
  cat: async (filepath) => {
    const fileContents = await readFile(resolve('.', filepath));
    return fileContents.toString('utf-8');
  }
});

function download (str) {
  console.log(str);
}

function PrintDir () {
  const [files, setFiles] = useState([]);
  useEffect(() => fs.ls(URel)
    .then(dirFiles => setFiles([ { name: '../', dir: true }, ...dirFiles ])));
  
  if (Array.isArray(files) && files.length === 0) {
    return "no files?";
  }
  return <>
    <h1>{URel.toString()}</h1>
    { files.map(file => file.dir
      ? <a href={ URel.moveTo(file.name) }> { file.name } </a>
      : <button onClick={ async () => download(await fs.cat(URel.moveTo(file.name))) }>
        { file.name } </button>) }
  </>;
}

function main (root) {
  ReactDom.renderToString(root, PrintDir());
}
