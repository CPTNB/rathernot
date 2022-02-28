import {
  getFormFields
} from 'forms';
import { provisioningRequest } from './SimpleAsyncForm';

describe('async form', () => {
  it ('should parse form fields', () => {
    const fieldNames = getFormFields(provisioningRequest)
      .map(([name]) => name);
    expect(fieldNames).toEqual([
      'userName',
      'userCostCenter',
      'accountLifespan',
      'ownerEmail',
      'ownerPosixGroup']);
  })
})
