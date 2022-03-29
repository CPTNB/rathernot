import Sqs from './AWS';

const Application = () => <>
  <h1>hello world</h1>
  <button onClick={() => Sqs.sendMessage({
    an: 'object'
  }, 'foobar.com')}>click me</button>
</>

export default Application();
