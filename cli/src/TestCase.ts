import { ShortString, Choice } from '../../common/application'

class TestCase {
  public MyString = ShortString();
  public MyChoice = Choice(["one", "two", "three"]);
  public AnotherChoice = Choice(["an", "illusion"]);

  onSubmit() {
    //call a service that we include here
  }
}

export default new TestCase();
