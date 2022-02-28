import RatherNot from 'rathernot';
import { provisioningRequest } from './SimpleAsyncForm';

describe('rathernot', () => {
  it('should take a class and produce a serialization', () => {
    const rnInstance = RatherNot(provisioningRequest);
    const output = rnInstance.serialize();
    expect(output).toEqual("{\"name\":\"ProvisioningRequest\",\"fields\":[{\"name\":\"userName\",\"type\":\"ShortString\",\"options\":{\"todo\":\"foobar\",\"formFieldType\":\"ShortString\"}},{\"name\":\"userCostCenter\",\"type\":\"ShortString\",\"options\":{\"todo\":\"foobar\",\"formFieldType\":\"ShortString\"}},{\"name\":\"accountLifespan\",\"type\":\"Choice\",\"options\":{\"0\":\"temporary_1M\",\"1\":\"temporary_1Y\",\"2\":\"permanent\",\"formFieldType\":\"Choice\"}},{\"name\":\"ownerEmail\",\"type\":\"ShortString\",\"options\":{\"todo\":\"foobar\",\"formFieldType\":\"ShortString\"}},{\"name\":\"ownerPosixGroup\",\"type\":\"ShortString\",\"options\":{\"todo\":\"foobar\",\"formFieldType\":\"ShortString\"}}]}");
  })
})
