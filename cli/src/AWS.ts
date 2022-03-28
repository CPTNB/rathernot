import { Service } from '../../common/application';
// import { SQS } from 'aws-sdk'
//we're going to have to pass in some kind of configuration to AWS
// use an environment object?
// const sqs = new SQS();

class Sqs {
  async sendMessage(content: object, queueUrl: string) {
    console.log(`sqs got: ${JSON.stringify(content)}, to ${queueUrl}`);
    return Promise.resolve('greatjob');
    // return new Promise(function(resolve, reject) {
    //   return sqs.sendMessage({
    //     MessageBody: JSON.stringify(content),
    //     QueueUrl: queueUrl
    //   }, (err, res) => {
    //     if (err) {
    //       reject(err)
    //     } else {
    //       resolve(res);
    //     }
    //   });
    // });
  }
}

export default Service(new Sqs());

const anotherguy = {
  foobar: () => 'foobar'
}

Service(anotherguy);
