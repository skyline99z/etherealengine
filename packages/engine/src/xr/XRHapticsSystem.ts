import { defineActionQueue } from '@etherealengine/hyperflux'

import { Engine } from '../ecs/classes/Engine'
import { defineSystem } from '../ecs/functions/SystemFunctions'
import { XRAction } from './XRState'

/** haptic typings are currently incomplete */
type Haptic = {
  type: 'vibration'
  /**
   * @param value A double representing the intensity of the pulse. This can vary depending on the hardware type, but generally takes a value between 0.0 (no intensity) and 1.0 (full intensity).
   * @param duration A double representing the duration of the pulse, in milliseconds.
   */
  pulse: (value: number, duration: number) => void
}

const vibrateControllerQueue = defineActionQueue(XRAction.vibrateController.matches)

const execute = () => {
  for (const action of vibrateControllerQueue()) {
    for (const inputSource of Engine.instance.inputSources) {
      if (inputSource.handedness === action.handedness && inputSource.gamepad?.hapticActuators?.length) {
        ;(inputSource.gamepad.hapticActuators[0] as Haptic).pulse(action.value, action.duration)
      }
    }
  }
}

export const XRHapticsSystem = defineSystem({
  uuid: 'ee.engine.XRHapticsSystem',
  execute
})
