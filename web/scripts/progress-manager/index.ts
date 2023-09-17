import { StateHandler } from '../state-handler/index.js'

export class ProgressManager implements Module {
  stateHandler: StateHandler

  /**
   * Progress information object, including current value and maximum value
   */
  progress: { value: number; max: number }

  setup(config: ComfyCenter) {
    this.stateHandler = config.stateHandler
  }
}
