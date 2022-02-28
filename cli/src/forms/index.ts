import { AsyncDelivery } from '../delivery/index'
export { getFormFields } from './field-types';
export { Choice, ChoiceOptions } from './choice';
export { ShortString, ShortStringOptions } from './short-string';

export interface RuntimeConfig {
  stage: {
    isProduction: () => boolean
  }
}
