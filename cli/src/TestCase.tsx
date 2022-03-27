import { ShortString, Choice, Form } from '../../common/application'
import Sqs from './AWS';

class TestCase {
  public MyString = ShortString();
  public MyChoice = Choice(["one", "two", "three"]);
  public foobar = Choice(["an", "illusion"]);

  onSubmit() {
    Sqs.sendMessage(this, 'myqueueUrl');
  }
}

export default new TestCase();
