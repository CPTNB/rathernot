import { AsyncDelivery } from '../delivery/index'
export * from './field-types';

export interface RuntimeConfig {
  stage: {
    isProduction: () => boolean
  }
}

export type AsyncForm = {
  getDelivery(stageInputs: RuntimeConfig): AsyncDelivery
}
