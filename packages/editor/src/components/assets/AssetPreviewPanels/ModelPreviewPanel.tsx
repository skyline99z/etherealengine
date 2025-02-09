import React, { useEffect, useRef } from 'react'
import { Mesh } from 'three'

import LoadingView from '@etherealengine/client-core/src/common/components/LoadingView'
import { useRender3DPanelSystem } from '@etherealengine/client-core/src/user/components/Panel3D/useRender3DPanelSystem'
import { loadAvatarModelAsset } from '@etherealengine/engine/src/avatar/functions/avatarFunctions'
import { SourceType } from '@etherealengine/engine/src/renderer/materials/components/MaterialSource'
import {
  removeMaterialSource,
  unregisterMaterial
} from '@etherealengine/engine/src/renderer/materials/functions/MaterialLibraryFunctions'
import { State, useHookstate } from '@etherealengine/hyperflux'

import styles from '../styles.module.scss'

export const ModelPreviewPanel = (props) => {
  const url = props.resourceProps.resourceUrl
  const loading = useHookstate(true)

  const error = useHookstate('')
  const panelRef = useRef() as React.MutableRefObject<HTMLDivElement>

  const renderPanel = useRender3DPanelSystem(panelRef)
  const { scene } = renderPanel.state

  useEffect(() => {
    const loadModel = async () => {
      try {
        const model = await loadAvatarModelAsset(url)
        if (model) {
          model.name = 'avatar'
          const result = scene.value.getObjectByName(model.name)
          if (result) scene.value.remove(result)
          scene.value.add(model)
        }
        loading.set(false)
      } catch (err) {
        loading.set(false)
        error.set(err.message)
      }
    }

    loadModel()

    return () => {
      const sceneVal = scene.value
      const avatar = sceneVal.children.find((child) => child.name === 'avatar')
      if (avatar?.userData['src']) {
        removeMaterialSource({ type: SourceType.MODEL, path: avatar.userData['src'] })
      }
    }
  }, [])

  return (
    <>
      {loading.value && <LoadingView />}
      {error.value && (
        <div className={styles.container}>
          <h1 className={styles.error}>{error.value}</h1>
        </div>
      )}
      <div id="stage" ref={panelRef} style={{ width: '100%', minHeight: '250px', height: '100%' }}></div>
    </>
  )
}
