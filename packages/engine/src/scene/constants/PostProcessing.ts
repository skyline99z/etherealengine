import {
  BlendFunction,
  BloomEffect,
  BrightnessContrastEffect,
  ColorDepthEffect,
  DepthOfFieldEffect,
  EdgeDetectionMode,
  HueSaturationEffect,
  KernelSize,
  OutlineEffect,
  PredicationMode,
  Resolution,
  SMAAEffect,
  SMAAPreset,
  SSAOEffect,
  ToneMappingEffect
} from 'postprocessing'
import { MotionBlurEffect, SSGIEffect, TRAAEffect, VelocityDepthNormalPass } from 'realism-effects'
import { SSREffect } from 'screen-space-reflections'
import { ColorRepresentation, Texture } from 'three'

import { FXAAEffect } from '../../renderer/effects/FXAAEffect'
import { LinearTosRGBEffect } from '../../renderer/effects/LinearTosRGBEffect'

export enum Effects {
  // FXAAEffect = 'FXAAEffect',
  SMAAEffect = 'SMAAEffect',
  OutlineEffect = 'OutlineEffect',
  SSAOEffect = 'SSAOEffect',
  SSREffect = 'SSREffect',
  DepthOfFieldEffect = 'DepthOfFieldEffect',
  BloomEffect = 'BloomEffect',
  ToneMappingEffect = 'ToneMappingEffect',
  BrightnessContrastEffect = 'BrightnessContrastEffect',
  HueSaturationEffect = 'HueSaturationEffect',
  ColorDepthEffect = 'ColorDepthEffect',
  LinearTosRGBEffect = 'LinearTosRGBEffect',
  SSGIEffect = 'SSGIEffect',
  TRAAEffect = 'TRAAEffect',
  MotionBlurEffect = 'MotionBlurEffect'
}

export type EffectType = {
  EffectClass: any
}

export const EffectMap = new Map<Effects, EffectType>()
// TODO: FXAA recently broke due to new threejs & postprocessing version #5568
// EffectMap.set(Effects.FXAAEffect, { EffectClass: FXAAEffect })
EffectMap.set(Effects.SMAAEffect, { EffectClass: SMAAEffect })
EffectMap.set(Effects.OutlineEffect, { EffectClass: OutlineEffect })
EffectMap.set(Effects.SSAOEffect, { EffectClass: SSAOEffect })
EffectMap.set(Effects.SSREffect, { EffectClass: SSREffect })
EffectMap.set(Effects.DepthOfFieldEffect, { EffectClass: DepthOfFieldEffect })
EffectMap.set(Effects.BloomEffect, { EffectClass: BloomEffect })
EffectMap.set(Effects.ToneMappingEffect, { EffectClass: ToneMappingEffect })
EffectMap.set(Effects.BrightnessContrastEffect, { EffectClass: BrightnessContrastEffect })
EffectMap.set(Effects.HueSaturationEffect, { EffectClass: HueSaturationEffect })
EffectMap.set(Effects.ColorDepthEffect, { EffectClass: ColorDepthEffect })
EffectMap.set(Effects.LinearTosRGBEffect, { EffectClass: LinearTosRGBEffect })
EffectMap.set(Effects.SSGIEffect, { EffectClass: SSGIEffect })
EffectMap.set(Effects.TRAAEffect, { EffectClass: TRAAEffect })
EffectMap.set(Effects.MotionBlurEffect, { EffectClass: MotionBlurEffect })

export type EffectProps = {
  isActive: boolean
  blendFunction?: BlendFunction
}

export type FXAAEffectProps = EffectProps

export type SMAAEffectProps = EffectProps & {
  preset: SMAAPreset
  edgeDetectionMode: EdgeDetectionMode
  predicationMode: PredicationMode
}

export type OutlineEffectProps = EffectProps & {
  patternTexture: Texture | null
  edgeStrength: number
  pulseSpeed: number
  visibleEdgeColor: ColorRepresentation
  hiddenEdgeColor: ColorRepresentation
  resolutionScale: number
  width: number
  height: number
  kernelSize: number
  blur: boolean
  xRay: boolean
}

export type SSAOEffectProps = EffectProps & {
  distanceScaling: boolean
  depthAwareUpsampling: boolean
  samples: number
  rings: number
  distanceThreshold: number // Render up to a distance of ~20 world units
  distanceFalloff: number // with an additional ~2.5 units of falloff.
  minRadiusScale: number
  bias: number
  radius: number
  intensity: number
  fade: number
}

const defaultSSROptions = {
  intensity: 1,
  exponent: 1,
  distance: 10,
  fade: 0,
  roughnessFade: 1,
  thickness: 10,
  ior: 1.45,
  maxRoughness: 1,
  maxDepthDifference: 10,
  blend: 0,
  correction: 1,
  correctionRadius: 1,
  blur: 0.5,
  blurKernel: 1,
  blurSharpness: 10,
  jitter: 0,
  jitterRoughness: 0,
  steps: 20,
  refineSteps: 5,
  missedRays: true,
  useNormalMap: true,
  useRoughnessMap: true,
  resolutionScale: 1,
  velocityResolutionScale: 1
}

export type SSREffectProps = EffectProps & typeof defaultSSROptions

export type DepthOfFieldEffectProps = EffectProps & {
  focusDistance: number
  focalLength: number
  bokehScale: number
}

export type BloomEffectProps = EffectProps & {
  kernelSize: number
  luminanceThreshold: number
  luminanceSmoothing: number
  intensity: number
}

export type ToneMappingEffectProps = EffectProps & {
  adaptive: boolean
  resolution: number
  middleGrey: number
  maxLuminance: number
  averageLuminance: number
  adaptationRate: number
}

export type BrightnessContrastEffectProps = EffectProps & {
  brightness: number
  contrast: number
}

export type HueSaturationEffectProps = EffectProps & {
  hue: number
  saturation: number
}

export type ColorDepthEffectProps = EffectProps & {
  bits: number
}

export type LinearTosRGBEffectProps = EffectProps

export type SSGIEffectProps = EffectProps & {
  distance: number
  thickness: number
  autoThickness: boolean
  maxRoughness: number
  blend: number
  denoiseIterations: number
  denoiseKernel: number
  denoiseDiffuse: number
  denoiseSpecular: number
  depthPhi: number
  normalPhi: number
  roughnessPhi: number
  envBlur: number
  importanceSampling: boolean
  directLightMultiplier: number
  steps: number
  refineSteps: number
  spp: number
  resolutionScale: number
  missedRays: boolean
}

export type TRAAEffectProps = EffectProps & {
  blend: number
  constantBlend: boolean
  dilation: boolean
  blockySampling: boolean
  logTransform: boolean
  depthDistance: number
  worldDistance: number
  neighborhoodClamping: boolean
}

export type MotionBlurEffectProps = EffectProps & {
  intensity: 1
  jitter: 1
  samples: 16
}

export type EffectPropsSchema = {
  // [Effects.FXAAEffect]: FXAAEffectProps
  [Effects.SMAAEffect]: SMAAEffectProps
  [Effects.OutlineEffect]: OutlineEffectProps
  [Effects.SSAOEffect]: SSAOEffectProps
  [Effects.SSREffect]: SSREffectProps
  [Effects.DepthOfFieldEffect]: DepthOfFieldEffectProps
  [Effects.BloomEffect]: BloomEffectProps
  [Effects.ToneMappingEffect]: ToneMappingEffectProps
  [Effects.BrightnessContrastEffect]: BrightnessContrastEffectProps
  [Effects.HueSaturationEffect]: HueSaturationEffectProps
  [Effects.ColorDepthEffect]: ColorDepthEffectProps
  [Effects.LinearTosRGBEffect]: LinearTosRGBEffectProps
  [Effects.SSGIEffect]: SSGIEffectProps
  [Effects.TRAAEffect]: TRAAEffectProps
  [Effects.MotionBlurEffect]: MotionBlurEffectProps
}

export const defaultPostProcessingSchema: EffectPropsSchema = {
  // FXAAEffect: {
  //   isActive: true,
  //   blendFunction: BlendFunction.NORMAL
  // },
  [Effects.SMAAEffect]: {
    isActive: true,
    blendFunction: BlendFunction.NORMAL,
    preset: SMAAPreset.MEDIUM,
    edgeDetectionMode: EdgeDetectionMode.COLOR,
    predicationMode: PredicationMode.DISABLED
  },
  [Effects.OutlineEffect]: {
    isActive: true,
    blendFunction: BlendFunction.SCREEN,
    patternTexture: null,
    edgeStrength: 2.0,
    pulseSpeed: 0.0,
    visibleEdgeColor: 0xffffff,
    hiddenEdgeColor: 0xffffff,
    resolutionScale: 0.5,
    width: Resolution.AUTO_SIZE,
    height: Resolution.AUTO_SIZE,
    kernelSize: KernelSize.VERY_SMALL,
    blur: false,
    xRay: true
  },
  [Effects.SSAOEffect]: {
    isActive: false,
    blendFunction: BlendFunction.MULTIPLY,
    distanceScaling: true,
    depthAwareUpsampling: true,
    samples: 16,
    rings: 7,
    distanceThreshold: 0.125, // Render up to a distance of ~20 world units
    distanceFalloff: 0.02, // with an additional ~2.5 units of falloff.
    minRadiusScale: 1,
    bias: 0.25,
    radius: 0.01,
    intensity: 2,
    fade: 0.05
  },
  [Effects.SSREffect]: {
    isActive: false,
    ...defaultSSROptions
  },
  [Effects.DepthOfFieldEffect]: {
    isActive: false,
    blendFunction: BlendFunction.NORMAL,
    focusDistance: 0.02,
    focalLength: 0.5,
    bokehScale: 1
  },
  [Effects.BloomEffect]: {
    isActive: true,
    blendFunction: BlendFunction.SCREEN,
    kernelSize: KernelSize.MEDIUM,
    luminanceThreshold: 1.0,
    luminanceSmoothing: 0.1,
    intensity: 0.2
  },
  [Effects.ToneMappingEffect]: {
    isActive: false,
    blendFunction: BlendFunction.NORMAL,
    adaptive: true,
    resolution: 512,
    middleGrey: 0.6,
    maxLuminance: 32.0,
    averageLuminance: 1.0,
    adaptationRate: 2.0
  },
  [Effects.BrightnessContrastEffect]: {
    isActive: false,
    brightness: 0.05,
    contrast: 0.1
  },
  [Effects.HueSaturationEffect]: {
    isActive: false,
    hue: 0,
    saturation: -0.15
  },
  [Effects.ColorDepthEffect]: {
    isActive: false,
    bits: 16
  },
  [Effects.LinearTosRGBEffect]: {
    isActive: false
  },
  [Effects.SSGIEffect]: {
    isActive: false,
    distance: 10,
    thickness: 10,
    autoThickness: false,
    maxRoughness: 1,
    blend: 0.9,
    denoiseIterations: 1,
    denoiseKernel: 2,
    denoiseDiffuse: 10,
    denoiseSpecular: 10,
    depthPhi: 2,
    normalPhi: 50,
    roughnessPhi: 1,
    envBlur: 0.5,
    importanceSampling: true,
    directLightMultiplier: 1,
    steps: 20,
    refineSteps: 5,
    spp: 1,
    resolutionScale: 1,
    missedRays: false
  },
  [Effects.TRAAEffect]: {
    isActive: false,
    blend: 0.8,
    constantBlend: true,
    dilation: true,
    blockySampling: false,
    logTransform: false, // ! todo: check if can use logTransform withoutt artifacts
    depthDistance: 10,
    worldDistance: 5,
    neighborhoodClamping: true
  },
  [Effects.MotionBlurEffect]: {
    isActive: false,
    intensity: 1,
    jitter: 1,
    samples: 16
  }
}
