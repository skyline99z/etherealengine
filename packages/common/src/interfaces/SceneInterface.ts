import { EntityUUID } from './EntityUUID'

export interface ComponentJson<T extends any = any> {
  name: string
  props?: Partial<T> | T
}

export interface EntityJson {
  name: EntityUUID | string
  type?: string
  components: Array<ComponentJson>
  parent?: EntityUUID
  index?: number
}

export interface SceneJson {
  entities: { [uuid: EntityUUID]: EntityJson }
  root: EntityUUID
  version: number
}

export interface SceneMetadata {
  name: string
  thumbnailUrl: string
  project: string
}

export interface SceneData extends SceneMetadata {
  scene: SceneJson
}
