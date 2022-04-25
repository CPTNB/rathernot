import { Service, URel } from '../rn';
import * as React from 'react';
import * as ReactDom from 'react-dom/client';
import { readFile, readdir } from 'fs/promises';
import { resolve } from 'path';

const fs = Service({
  ls: async (dirpath) => {
    const files = await readdir(resolve('.', dirpath), { withFileTypes: true });
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
  const [files, setFiles] = React.useState([]);
  const [lsing, setLsing] = React.useState(false);
  React.useEffect(() => {
    if (!lsing) {
      fs.ls(URel())
        .then(dirFiles => setFiles([ { name: '../', dir: true }, ...dirFiles ]))
        .catch(e => console.log(e));
      setLsing(true);
    }
  });
  
  if (Array.isArray(files) && files.length === 0) {
    return "no files?";
  }
  const printedFiles = files.map((file, i) => <p key={i}>{
    file.dir
      ? <a href={ URel.concat(file.name).href() }> { file.name } </a>
      : <button onClick={ async () => download(await fs.cat(URel.concat(file.name).href())) }>
        { file.name } </button>
  }
  </p>);
  return <>
    <h1>{URel()}</h1>
    { printedFiles }
  </>;
}

function main (root) {
  ReactDom.createRoot(root).render(<PrintDir />);
}
