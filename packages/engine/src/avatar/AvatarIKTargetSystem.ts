import { Quaternion, Vector3 } from 'three'

import { getState } from '@xrengine/hyperflux'

import { Axis } from '../common/constants/Axis3D'
import { V_000 } from '../common/constants/MathConstants'
import { clamp } from '../common/functions/MathLerpFunctions'
import { Entity } from '../ecs/classes/Entity'
import { World } from '../ecs/classes/World'
import { defineQuery, getComponent, removeQuery } from '../ecs/functions/ComponentFunctions'
import { createPriorityQueue } from '../ecs/PriorityQueue'
import { VisibleComponent } from '../scene/components/VisibleComponent'
import { DistanceFromCameraComponent, FrustumCullCameraComponent } from '../transform/components/DistanceComponents'
import { TransformComponent } from '../transform/components/TransformComponent'
import { XRControllerComponent } from '../xr/XRComponents'
import { getControlMode, XRState } from '../xr/XRState'
import { solveLookIK } from './animation/LookAtIKSolver'
import { solveTwoBoneIK } from './animation/TwoBoneIKSolver'
import { AvatarRigComponent } from './components/AvatarAnimationComponent'
import { AvatarArmsTwistCorrectionComponent } from './components/AvatarArmsTwistCorrectionComponent'
import { AvatarControllerComponent } from './components/AvatarControllerComponent'
import { AvatarLeftHandIKComponent, AvatarRightHandIKComponent } from './components/AvatarIKComponents'
import { AvatarHeadDecapComponent } from './components/AvatarIKComponents'
import { AvatarHeadIKComponent } from './components/AvatarIKComponents'

const _vec = new Vector3()
const _rotXneg60 = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -Math.PI / 1.5)
const _rotY90 = new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), Math.PI / 2)
const _rotYneg90 = new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), -Math.PI / 2)

export default async function AvatarIKTargetSystem(world: World) {
  const leftHandQuery = defineQuery([VisibleComponent, AvatarLeftHandIKComponent, AvatarRigComponent])
  const rightHandQuery = defineQuery([VisibleComponent, AvatarRightHandIKComponent, AvatarRigComponent])
  const headIKQuery = defineQuery([VisibleComponent, AvatarHeadIKComponent, AvatarRigComponent])
  const localHeadIKQuery = defineQuery([VisibleComponent, AvatarHeadIKComponent, AvatarControllerComponent])
  const headDecapQuery = defineQuery([VisibleComponent, AvatarHeadDecapComponent])
  const armsTwistCorrectionQuery = defineQuery([
    VisibleComponent,
    AvatarArmsTwistCorrectionComponent,
    AvatarRigComponent
  ])

  const avatarQuery = defineQuery([VisibleComponent, AvatarRigComponent, AvatarHeadIKComponent])

  const maxSqrDistance = 25 * 25
  const minAccumulationRate = 0.01
  const maxAccumulationRate = 0.1
  const priorityQueue = createPriorityQueue(avatarQuery(), { priorityThreshold: maxAccumulationRate })

  const filterPriorityEntities = (entity: Entity) => priorityQueue.priorityEntities.has(entity)

  const xrState = getState(XRState)

  const execute = () => {
    const inAttachedControlMode = getControlMode() === 'attached'
    const localClientEntity = world.localClientEntity

    for (const entity of avatarQuery()) {
      /**
       * if outside of frustum, priority get set to 0 otherwise
       * whatever your distance is, gets mapped linearly to your priority
       */

      const sqrDistance = DistanceFromCameraComponent.squaredDistance[entity]
      if (FrustumCullCameraComponent.isCulled[entity]) {
        priorityQueue.setPriority(entity, 0)
      } else {
        const accumulation = clamp(
          (maxSqrDistance / sqrDistance) * world.deltaSeconds,
          minAccumulationRate,
          maxAccumulationRate
        )
        priorityQueue.addPriority(entity, accumulation)
      }
    }

    priorityQueue.update()

    const headIKEntities = headIKQuery(world).filter(filterPriorityEntities)
    const leftHandEntities = leftHandQuery(world).filter(filterPriorityEntities)
    const rightHandEntities = rightHandQuery(world).filter(filterPriorityEntities)

    /**
     * Head
     */
    for (const entity of headIKEntities) {
      const ik = getComponent(entity, AvatarHeadIKComponent)
      if (inAttachedControlMode && entity === localClientEntity) {
        ik.target.quaternion.copy(world.camera.quaternion)
        ik.target.position.copy(world.camera.position)
      }
      ik.target.updateMatrix()
      ik.target.updateMatrixWorld(true)
      const rig = getComponent(entity, AvatarRigComponent).rig
      ik.target.getWorldDirection(_vec).multiplyScalar(-1)
      solveLookIK(rig.Head, _vec, ik.rotationClamp)
    }

    /**
     * Hands
     */
    for (const entity of leftHandEntities) {
      const { rig } = getComponent(entity, AvatarRigComponent)

      const ik = getComponent(entity, AvatarLeftHandIKComponent)
      if (entity === localClientEntity) {
        const leftControllerEntity = xrState.leftControllerEntity.value
        if (leftControllerEntity) {
          const controller = getComponent(leftControllerEntity, XRControllerComponent)
          if (controller.hand) {
            const { position, rotation } = getComponent(controller.hand, TransformComponent)
            ik.target.position.copy(position)
            ik.target.quaternion.copy(rotation).multiply(_rotYneg90)
          } else if (controller.grip) {
            const { position, rotation } = getComponent(controller.grip, TransformComponent)
            ik.target.position.copy(position)
            /**
             * Since the hand has Z- forward in the grip space,
             *    which is roughly 60 degrees rotated from the arm's forward,
             *    apply a rotation to get the correct hand orientation
             */
            ik.target.quaternion.copy(rotation).multiply(_rotXneg60)
          } else {
            const { position, rotation } = getComponent(leftControllerEntity, TransformComponent)
            ik.target.position.copy(position)
            ik.target.quaternion.copy(rotation)
          }
        }
      }
      ik.target.updateMatrix()
      ik.target.updateMatrixWorld(true)

      // Arms should not be straight for the solver to work properly
      // TODO: Make this configurable

      // TODO: should we break hand IK apart into left and right components?
      // some devices only support one hand controller. How do we handle that?
      // how do we report that tracking is lost or still pending?
      // FOR NOW: we'll assume that we don't have tracking if the target is at exactly (0, 0, 0);
      // we may want to add a flag for this in the future, or to generally allow animations to play even if tracking is available

      if (!ik.target.position.equals(V_000)) {
        rig.LeftForeArm.quaternion.setFromAxisAngle(Axis.X, Math.PI * -0.25)
        rig.LeftForeArm.updateWorldMatrix(false, true)
        solveTwoBoneIK(
          rig.LeftArm,
          rig.LeftForeArm,
          rig.LeftHand,
          ik.target,
          ik.hint,
          ik.targetOffset,
          ik.targetPosWeight,
          ik.targetRotWeight,
          ik.hintWeight
        )
      }
    }

    for (const entity of rightHandEntities) {
      const { rig } = getComponent(entity, AvatarRigComponent)

      const ik = getComponent(entity, AvatarRightHandIKComponent)

      if (entity === localClientEntity) {
        const rightControllerEntity = xrState.rightControllerEntity.value
        if (rightControllerEntity) {
          const controller = getComponent(rightControllerEntity, XRControllerComponent)
          if (controller.hand) {
            const { position, rotation } = getComponent(controller.hand, TransformComponent)
            ik.target.position.copy(position)
            ik.target.quaternion.copy(rotation).multiply(_rotY90)
          } else if (controller.grip) {
            const { position, rotation } = getComponent(controller.grip, TransformComponent)
            ik.target.position.copy(position)
            /**
             * Since the hand has Z- forward in the grip space,
             *    which is roughly 60 degrees rotated from the arm's forward,
             *    apply a rotation to get the correct hand orientation
             */
            ik.target.quaternion.copy(rotation).multiply(_rotXneg60)
          } else {
            const { position, rotation } = getComponent(rightControllerEntity, TransformComponent)
            ik.target.position.copy(position)
            ik.target.quaternion.copy(rotation)
          }
        }
      }
      ik.target.updateMatrix()
      ik.target.updateMatrixWorld(true)

      if (!ik.target.position.equals(V_000)) {
        rig.RightForeArm.quaternion.setFromAxisAngle(Axis.X, Math.PI * 0.25)
        rig.RightForeArm.updateWorldMatrix(false, true)
        solveTwoBoneIK(
          rig.RightArm,
          rig.RightForeArm,
          rig.RightHand,
          ik.target,
          ik.hint,
          ik.targetOffset,
          ik.targetPosWeight,
          ik.targetRotWeight,
          ik.hintWeight
        )
      }
    }

    // for (const entity of armsTwistCorrectionQuery.enter()) {
    //   const { bindRig } = getComponent(entity, AvatarRigComponent)
    //   const twistCorrection = getComponent(entity, AvatarArmsTwistCorrectionComponent)
    //   twistCorrection.LeftHandBindRotationInv.copy(bindRig.LeftHand.quaternion).invert()
    //   twistCorrection.RightHandBindRotationInv.copy(bindRig.RightHand.quaternion).invert()
    // }

    // for (const entity of armsTwistCorrectionQuery()) {
    //   const { rig, bindRig } = getComponent(entity, AvatarRigComponent)
    //   const twistCorrection = getComponent(entity, AvatarArmsTwistCorrectionComponent)

    //   if (rig.LeftForeArmTwist) {
    //     applyBoneTwist(
    //       twistCorrection.LeftHandBindRotationInv,
    //       rig.LeftHand.quaternion,
    //       bindRig.LeftForeArmTwist.quaternion,
    //       rig.LeftForeArmTwist.quaternion,
    //       twistCorrection.LeftArmTwistAmount
    //     )
    //   }

    //   if (rig.RightForeArmTwist) {
    //     applyBoneTwist(
    //       twistCorrection.RightHandBindRotationInv,
    //       rig.RightHand.quaternion,
    //       bindRig.RightForeArmTwist.quaternion,
    //       rig.RightForeArmTwist.quaternion,
    //       twistCorrection.RightArmTwistAmount
    //     )
    //   }
    // }
  }

  const cleanup = async () => {
    removeQuery(world, headDecapQuery)
    removeQuery(world, leftHandQuery)
    removeQuery(world, rightHandQuery)
    removeQuery(world, localHeadIKQuery)
    removeQuery(world, headIKQuery)
    removeQuery(world, armsTwistCorrectionQuery)
  }

  return { execute, cleanup }
}
