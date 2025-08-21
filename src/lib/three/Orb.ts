import { shaderMaterial } from '@react-three/drei'
import type { ThreeElement } from '@react-three/fiber'
import { Color, type ShaderMaterial } from 'three'

export const OrbMaterial = shaderMaterial(
	{ uColor: new Color(), uOpacity: 1 },
	/* vertex */ `
		varying vec3 vNormal;
		varying vec3 vViewDir;
  	void main(){
  		vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
			gl_Position = projectionMatrix * mvPosition;

			vNormal = normalize(normalMatrix * normal);
			vViewDir = normalize(-mvPosition.xyz);
  	}`,
	/* fragment */ `
  	uniform float uOpacity;
  	uniform vec3 uColor;
		varying vec3 vNormal;
		varying vec3 vViewDir;
  	void main(){
      float edge = 1.0 - dot(normalize(vNormal), normalize(vViewDir));
      float edgeThreshold = 0.25;   // move this to adjust where the outline begins
      float edgeSoftness = 0.03;    // smaller = crisper / thinner outline
      float edgeMask = smoothstep(edgeThreshold, edgeThreshold + edgeSoftness, edge);
    
      vec3 baseColor = uColor;
			
      float lightDot = dot(normalize(vNormal), normalize(vViewDir)); // 1.0 = facing camera
      float facing = clamp(lightDot, 0.0, 1.0);
      float quant = floor(facing * 2.0) / 2.0;

      vec3 edgeShadedColor = mix(baseColor, baseColor * quant, edgeMask);
			
  		gl_FragColor = vec4(edgeShadedColor, uOpacity);
  	}`
)

declare module '@react-three/fiber' {
	interface ThreeElements {
		orbMaterial: ThreeElement<
			typeof OrbMaterial & {
				uColor: Color
				uOpacity: number
			}
		>
	}
}

export interface OrbMaterialUniforms extends ShaderMaterial {
	uniforms: {
		uColor: { value: Color }
		uOpacity: { value: number }
	}
}
