import { Service } from '../rn';
import * as React from 'react';
import * as ReactDom from 'react-dom/client';
import { readFile, readdir } from 'fs/promises';
import { resolve } from 'path';

const fs = Service({
  ls: async (pathChunks) => {
    const files = await readdir(resolve(...pathChunks), { withFileTypes: true });
    return (files || []).map(file => ({
      name: file.name,
      dir: file.isDirectory()
    }));
  },
  cat: async (pathChunks) => {
    const fileContents = await readFile(resolve(...pathChunks));
    return fileContents.toString('utf-8');
  }
});

async function download (pathChunks) {
  const data = await fs.cat(pathChunks);
  console.log(data);
}

function Link ({name, isDir, onClick}) {
  return <span
    style={{
      color: isDir ? 'blue' : 'inherit',
      textDecoration: isDir ? 'underline' : 'inherit',
      cursor: 'pointer'
    }}
    onClick={onClick}>{name}</span>
}

function PrintDir () {
  const [ files, setFiles ] = React.useState([]);
  const [ lsing, setLsing ] = React.useState(false);
  const [ pathChunks, setPathChunks ] = React.useState(['/']);
  React.useEffect(() => {
    if (!lsing) {
      const parentDir = pathChunks.length <= 1 ? [] : [{ name: '..', dir: true }]
      fs.ls(pathChunks)
        .then(dirFiles => setFiles([...parentDir,  ...dirFiles ]))
        .catch(e => console.log(e))
        .finally(f => setLsing(false));
      setLsing(true);
    }
  }, [pathChunks]);

  if (Array.isArray(files) && files.length === 0) {
    return "loading...";
  }
  const printedFiles = files.map((file, i) => {
    const onClick = file.dir
      ? () => setPathChunks(file.name === '..'
        ? pathChunks.slice(0, pathChunks.length - 1)
        : pathChunks.concat(file.name))
      : () => download(pathChunks.concat(file.name))
    return <div key={i}><Link
      name={file.name}
      isDir={file.dir}
      onClick={ onClick }/></div>
  });
  const breadcrumb = pathChunks.map((chunk, i) => <span key={i}>
    <Link
      name={chunk}
      isDir={true}
      onClick={ () => setPathChunks(pathChunks.slice(0, i + 1)) }/>{i === 0 ? "" : "/"}
  </span>)

  return <>
    <h1>{ breadcrumb }</h1>
    { printedFiles }
  </>;
}

function main (root) {
  ReactDom.createRoot(root).render(<PrintDir />);
}
