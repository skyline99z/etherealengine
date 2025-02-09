import { Entity } from '../../ecs/classes/Entity'
import { defineComponent, hasComponent, removeComponent, setComponent } from '../../ecs/functions/ComponentFunctions'

export const VisibleComponent = defineComponent({
  name: 'VisibleComponent',
  jsonID: 'visible',
  toJSON: () => true
})

export const setVisibleComponent = (entity: Entity, visible: boolean) => {
  if (visible) {
    !hasComponent(entity, VisibleComponent) && setComponent(entity, VisibleComponent, true)
  } else removeComponent(entity, VisibleComponent)
}
