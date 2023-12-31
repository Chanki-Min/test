import * as React from 'react'
import { useFrame, useThree, Vector3 } from '@react-three/fiber'
import * as THREE from 'three'

export type SpriteAnimatorProps = {
  startFrame?: number
  endFrame?: number
  fps?: number
  frameName?: string
  scaleFactor?: number
  textureDataURL?: string
  textureImageURL: string
  loop?: boolean
  numberOfFrames?: number
  autoPlay?: boolean
  animationNames?: Array<string>
  onStart?: Function
  onEnd?: Function
  onLoopEnd?: Function
  onFrame?: Function
  play?: boolean
  pause?: boolean
  position?: Array<number>
  alphaTest?: number
} & JSX.IntrinsicElements['group']

export const SpriteAnimator: React.FC<SpriteAnimatorProps> = (
  {
    startFrame,
    endFrame,
    fps,
    frameName,
    scaleFactor,
    textureDataURL,
    textureImageURL,
    loop,
    numberOfFrames,
    autoPlay,
    animationNames,
    onStart,
    onEnd,
    onLoopEnd,
    onFrame,
    play,
    pause,
    alphaTest,
    children,
    ...props
  },
  fref
) => {
  const v = useThree((state) => state.viewport)
  const spriteData = React.useRef<any>(null)
  const [isJsonReady, setJsonReady] = React.useState(false)
  const matRef = React.useRef<any>()
  const spriteRef = React.useRef<any>()
  const timerOffset = React.useRef(window.performance.now())
  const textureData = React.useRef<any>()
  const currentFrame = React.useRef<number>(startFrame || 0)
  const currentFrameName = React.useRef<string>(frameName || '')
  const fpsInterval = 1000 / (fps || 30)
  const [spriteTexture, setSpriteTexture] = React.useState<THREE.Texture>(new THREE.Texture())
  const totalFrames = React.useRef<number>(0)
  const [aspect, setAspect] = React.useState<Vector3 | undefined>([1, 1, 1])
  const aspectFactor = scaleFactor || 0.1

  function loadJsonAndTextureAndExecuteCallback(
    jsonUrl: string,
    textureUrl: string,
    callback: (json: any, texture: THREE.Texture) => void
  ): void {
    const textureLoader = new THREE.TextureLoader()
    const jsonPromise = fetch(jsonUrl).then((response) => response.json())
    const texturePromise = new Promise<THREE.Texture>((resolve) => {
      textureLoader.load(textureUrl, resolve)
    })

    Promise.all([jsonPromise, texturePromise]).then((response) => {
      callback(response[0], response[1])
    })
  }

  const calculateAspectRatio = (width: number, height: number, factor: number): Vector3 => {
    const adaptedHeight = height * (v.aspect > width / height ? v.width / width : v.height / height)
    const adaptedWidth = width * (v.aspect > width / height ? v.width / width : v.height / height)

    //setAspect([adaptedWidth * factor, adaptedHeight * factor, 1])
    spriteRef.current.scale = [adaptedWidth * factor, adaptedHeight * factor, 1]
    return [adaptedWidth * factor, adaptedHeight * factor, 1]
  }

  // initial loads
  React.useEffect(() => {
    if (textureDataURL && textureImageURL) {
      loadJsonAndTextureAndExecuteCallback(textureDataURL, textureImageURL, parseSpriteData)
    } else if (textureImageURL) {
      // only load the texture, this is an image sprite only
      const textureLoader = new THREE.TextureLoader()
      new Promise<THREE.Texture>((resolve) => {
        textureLoader.load(textureImageURL, resolve)
      }).then((texture) => {
        parseSpriteData(null, texture)
      })
    }
  }, [])

  React.useLayoutEffect(() => {
    modifySpritePosition()
  }, [spriteTexture])

  React.useEffect(() => {
    if (autoPlay === false) {
      if (play) {
      }
    }
  }, [pause])

  React.useEffect(() => {
    if (currentFrameName.current !== frameName && frameName) {
      currentFrame.current = 0
      currentFrameName.current = frameName
    }
  }, [frameName])

  const parseSpriteData = (json: any, _spriteTexture: THREE.Texture): void => {
    // sprite only case
    if (json === null) {
      if (_spriteTexture && numberOfFrames) {
        //get size from texture
        const width = _spriteTexture.image.width
        const height = _spriteTexture.image.height
        const frameWidth = width / numberOfFrames
        const frameHeight = height
        textureData.current = _spriteTexture
        totalFrames.current = numberOfFrames
        spriteData.current = {
          frames: [],
          meta: {
            version: '1.0',
            size: { w: width, h: height },
            scale: '1',
          },
        }

        if (parseInt(frameWidth.toString(), 10) === frameWidth) {
          // if it fits
          for (let i = 0; i < numberOfFrames; i++) {
            spriteData.current.frames.push({
              frame: { x: i * frameWidth, y: 0, w: frameWidth, h: frameHeight },
              rotated: false,
              trimmed: false,
              spriteSourceSize: { x: 0, y: 0, w: frameWidth, h: frameHeight },
              sourceSize: { w: frameWidth, h: height },
            })
          }
        }
      }
    } else if (_spriteTexture) {
      spriteData.current = json
      spriteData.current.frames = Array.isArray(json.frames) ? json.frames : parseFrames()
      totalFrames.current = Array.isArray(json.frames) ? json.frames.length : Object.keys(json.frames).length
      textureData.current = _spriteTexture

      const { w, h } = getFirstItem(json.frames).sourceSize
      const aspect = calculateAspectRatio(w, h, aspectFactor)

      setAspect(aspect)
      if (matRef.current) {
        matRef.current.map = _spriteTexture
      }
    }

    _spriteTexture.premultiplyAlpha = false
    setSpriteTexture(_spriteTexture)
  }

  // for frame based JSON Hash sprite data
  const parseFrames = (): any => {
    let sprites: any = {}
    const data = spriteData.current
    let delimiters = animationNames
    if (delimiters) {
      for (let i = 0; i < delimiters.length; i++) {
        sprites[delimiters[i]] = []

        for (let innerKey in data['frames']) {
          let value = data['frames'][innerKey]
          let frameData = value['frame']
          let x = frameData['x']
          let y = frameData['y']
          let width = frameData['w']
          let height = frameData['h']
          let sourceWidth = value['sourceSize']['w']
          let sourceHeight = value['sourceSize']['h']

          if (typeof innerKey === 'string' && innerKey.toLowerCase().indexOf(delimiters[i].toLowerCase()) !== -1) {
            sprites[delimiters[i]].push({
              x: x,
              y: y,
              w: width,
              h: height,
              frame: frameData,
              sourceSize: { w: sourceWidth, h: sourceHeight },
            })
          }
        }
      }
    }

    return sprites
  }

  // modify the sprite material after json is parsed and state updated
  const modifySpritePosition = (): void => {
    if (!spriteData.current) return
    const {
      meta: { size: metaInfo },
      frames,
    } = spriteData.current

    const { w: frameW, h: frameH } = Array.isArray(frames)
      ? frames[0].sourceSize
      : frameName
      ? frames[frameName]
        ? frames[frameName][0].sourceSize
        : { w: 0, h: 0 }
      : { w: 0, h: 0 }

    matRef.current.map.wrapS = matRef.current.map.wrapT = THREE.RepeatWrapping
    matRef.current.map.repeat.set(1 / (metaInfo.w / frameW), 1 / (metaInfo.h / frameH))

    //const framesH = (metaInfo.w - 1) / frameW
    const framesV = (metaInfo.h - 1) / frameH
    const frameOffsetY = 1 / framesV
    matRef.current.map.offset.x = 0
    matRef.current.map.offset.y = 1 - frameOffsetY

    setJsonReady(true)
    if (onStart) onStart()
  }

  // run the animation on each frame
  const runAnimation = (): void => {
    //if (!frameName) return
    const now = window.performance.now()
    const diff = now - timerOffset.current
    const {
      meta: { size: metaInfo },
      frames,
    } = spriteData.current
    const { w: frameW, h: frameH } = getFirstItem(frames).sourceSize
    const spriteFrames = Array.isArray(frames) ? frames : frameName ? frames[frameName] : []

    let finalValX = 0
    let finalValY = 0
    const _endFrame = endFrame || spriteFrames.length - 1

    if (currentFrame.current > _endFrame) {
      currentFrame.current = loop ? startFrame ?? 0 : 0
      if (loop) {
        onLoopEnd?.({
          currentFrameName: frameName,
          currentFrame: currentFrame.current,
        })
      } else {
        onEnd?.({
          currentFrameName: frameName,
          currentFrame: currentFrame.current,
        })
      }
      if (!loop) return
    }

    if (diff <= fpsInterval) return
    timerOffset.current = now - (diff % fpsInterval)

    calculateAspectRatio(frameW, frameH, aspectFactor)
    const framesH = (metaInfo.w - 1) / frameW
    const framesV = (metaInfo.h - 1) / frameH
    const {
      frame: { x: frameX, y: frameY },
      sourceSize: { w: originalSizeX, h: originalSizeY },
    } = spriteFrames[currentFrame.current]
    const frameOffsetX = 1 / framesH
    const frameOffsetY = 1 / framesV
    finalValX = frameOffsetX * (frameX / originalSizeX)
    finalValY = Math.abs(1 - frameOffsetY) - frameOffsetY * (frameY / originalSizeY)

    matRef.current.map.offset.x = finalValX
    matRef.current.map.offset.y = finalValY

    currentFrame.current += 1
  }

  // *** Warning! It runs on every frame! ***
  useFrame((state, delta) => {
    if (!spriteData.current?.frames || !matRef.current?.map) {
      return
    }

    if (pause) {
      return
    }

    if (autoPlay || play) {
      runAnimation()
      onFrame && onFrame(delta, currentFrame.current)
    }
  })

  // utils
  const getFirstItem = (param: any): any => {
    if (Array.isArray(param)) {
      return param[0]
    } else if (typeof param === 'object' && param !== null) {
      const keys = Object.keys(param)
      return param[keys[0]][0]
    } else {
      return { w: 0, h: 0 }
    }
  }

  return (
    <group {...props}>
      <React.Suspense fallback={null}>
        <sprite ref={spriteRef} scale={aspect}>
          <spriteMaterial
            ref={matRef}
            map={spriteTexture}
            premultipliedAlpha={false}
            transparent={true}
            alphaTest={alphaTest ?? 0.0}
          />
        </sprite>
      </React.Suspense>
      {children}
    </group>
  )
}
