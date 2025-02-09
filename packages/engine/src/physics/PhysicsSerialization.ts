import { Entity } from '../ecs/classes/Entity'
import { getComponent, hasComponent } from '../ecs/functions/ComponentFunctions'
import { checkBitflag, readVector3, readVector4 } from '../networking/serialization/DataReader'
import { writeVector3, writeVector4 } from '../networking/serialization/DataWriter'
import { readUint8, rewindViewCursor, spaceUint8, ViewCursor } from '../networking/serialization/ViewCursor'
import { RigidBodyComponent, RigidBodyDynamicTagComponent } from './components/RigidBodyComponent'

export const readBodyPosition = readVector3(RigidBodyComponent.position)
export const readBodyRotation = readVector4(RigidBodyComponent.rotation)
export const readBodyLinearVelocity = readVector3(RigidBodyComponent.linearVelocity)
export const readBodyAngularVelocity = readVector3(RigidBodyComponent.angularVelocity)

export const readRigidBody = (v: ViewCursor, entity: Entity) => {
  const changeMask = readUint8(v)
  let b = 0
  const rigidBody = getComponent(entity, RigidBodyComponent)
  const dynamic = hasComponent(entity, RigidBodyDynamicTagComponent)
  if (checkBitflag(changeMask, 1 << b++)) {
    readBodyPosition(v, entity)
    if (dynamic && rigidBody) rigidBody.body.setTranslation(rigidBody.position, false)
  }
  if (checkBitflag(changeMask, 1 << b++)) {
    readBodyRotation(v, entity)
    if (dynamic && rigidBody) rigidBody.body.setRotation(rigidBody.rotation, false)
  }
  if (checkBitflag(changeMask, 1 << b++)) {
    readBodyLinearVelocity(v, entity)
    if (dynamic && rigidBody) rigidBody.body.setLinvel(rigidBody.linearVelocity, false)
  }
  if (checkBitflag(changeMask, 1 << b++)) {
    readBodyAngularVelocity(v, entity)
    if (dynamic && rigidBody) rigidBody.body.setAngvel(rigidBody.angularVelocity, false)
  }
  if (!dynamic && rigidBody) {
    const position = rigidBody.position
    const rotation = rigidBody.rotation
    RigidBodyComponent.targetKinematicPosition.x[entity] = position.x
    RigidBodyComponent.targetKinematicPosition.y[entity] = position.y
    RigidBodyComponent.targetKinematicPosition.z[entity] = position.z
    RigidBodyComponent.targetKinematicRotation.x[entity] = rotation.x
    RigidBodyComponent.targetKinematicRotation.y[entity] = rotation.y
    RigidBodyComponent.targetKinematicRotation.z[entity] = rotation.z
    RigidBodyComponent.targetKinematicRotation.w[entity] = rotation.w
  }
}

export const writeBodyPosition = writeVector3(RigidBodyComponent.position)
export const writeBodyRotation = writeVector4(RigidBodyComponent.rotation)
export const writeBodyLinearVelocity = writeVector3(RigidBodyComponent.linearVelocity)
export const writeBodyAngularVelocity = writeVector3(RigidBodyComponent.angularVelocity)

export const writeRigidBody = (v: ViewCursor, entity: Entity) => {
  if (!hasComponent(entity, RigidBodyComponent)) return

  const rewind = rewindViewCursor(v)
  const writeChangeMask = spaceUint8(v)
  let changeMask = 0
  let b = 0

  changeMask |= writeBodyPosition(v, entity) ? 1 << b++ : b++ && 0
  changeMask |= writeBodyRotation(v, entity) ? 1 << b++ : b++ && 0
  changeMask |= writeBodyLinearVelocity(v, entity) ? 1 << b++ : b++ && 0
  changeMask |= writeBodyAngularVelocity(v, entity) ? 1 << b++ : b++ && 0

  return (changeMask > 0 && writeChangeMask(changeMask)) || rewind()
}

export const PhysicsSerialization = {
  ID: 'ee.core.physics' as const,
  readRigidBody,
  writeRigidBody
}
