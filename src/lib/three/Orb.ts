import { shaderMaterial } from '@react-three/drei'
import type { ThreeElement } from '@react-three/fiber'
import type { ShaderMaterial } from 'three'

export const OrbMaterial = shaderMaterial(
	{ uTime: 0, uHovered: -1, uSelected: -1, uOpacity: 1 },
	/* vertex */ `
   varying vec3 vPosition;
   void main(){
     vPosition = position;
     gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
   }`,
	/* fragment */ `
   uniform float uOpacity;
   uniform vec3 uColor;
   void main(){
     gl_FragColor = vec4(uColor, uOpacity);
   }`
)

declare module '@react-three/fiber' {
	interface ThreeElements {
		orbMaterial: ThreeElement<
			typeof OrbMaterial & {
				uOpacity: number
			}
		>
	}
}

export interface OrbMaterialUniforms extends ShaderMaterial {
	uniforms: {
		uOpacity: { value: number }
	}
}
