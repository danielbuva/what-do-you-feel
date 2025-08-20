import { shaderMaterial } from '@react-three/drei'
import type { ThreeElement } from '@react-three/fiber'
import type { ShaderMaterial } from 'three'

export const BreathingMaterial = shaderMaterial(
	{ uTime: 0, uHovered: -1, uSelected: -1 },
	/* vertex */ `
    uniform float uTime;
    varying vec3 vColor;
    varying vec3 vNormal;
    varying vec3 vViewDir;
    varying float vInstanceID;
    void main() {
      vec3 transformed = position;
      float phase = float(gl_InstanceID) * 0.1;
      float s = sin(uTime + phase);
      float c = cos(s + phase);
      float move = s * 0.01;
      vec3 wobble = vec3(s, c, 0.0) * 0.01;
      transformed += normal * move + wobble;

      vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(transformed, 1.0);
      gl_Position = projectionMatrix * mvPosition;

      vColor = instanceColor;                     // instanceColor will be provided by the attribute
      vNormal = normalize(normalMatrix * normal);
      vViewDir = normalize(-mvPosition.xyz);
      vInstanceID = float(gl_InstanceID);
    }
  `,
	/* fragment */ `
uniform int uHovered;
uniform int uSelected;
varying vec3 vColor;
varying float vInstanceID;
varying vec3 vNormal;
varying vec3 vViewDir;

void main() {
  // ----- edge metric (0 in front-facing areas, >0 near silhouettes) -----
  float edge = 1.0 - dot(normalize(vNormal), normalize(vViewDir));
  // edgeThreshold & edgeSoftness control how narrow the edge band is
  float edgeThreshold = 0.18;   // move this to adjust where the outline begins
  float edgeSoftness = 0.03;    // smaller = crisper / thinner outline
  float edgeMask = smoothstep(edgeThreshold, edgeThreshold + edgeSoftness, edge);

  // ----- base color (no heavy shading in the center) -----
  vec3 baseColor = vColor;

  // ----- quantized cell shading (applied only at edges) -----
  // compute simple lighting value (view-based lambert-like)
  float lightDot = dot(normalize(vNormal), normalize(vViewDir)); // 1.0 = facing camera
  // invert so edges are darker: (you can also use other light direction)
  float facing = clamp(lightDot, 0.0, 1.0);

  // quantize into discrete levels (hardness of cell shading)
  float levels = 2.0; // try 2 or 3 for stronger banding (lower = fewer levels)
  float quant = floor(facing * levels) / levels;

  // mix quantized shading *only* at edgeMask (so interior keeps baseColor)
  float edgeShadeMix = 1.0; // 1.0 means full quantized effect at edges
  vec3 edgeShadedColor = mix(baseColor, baseColor * quant, edgeMask * edgeShadeMix);

  // ----- outline for hover/selected (thin and edge-only) -----
  // robust float equality: produce 1.0 if ID matches (abs < 0.5)
  float isSelected = 1.0 - step(0.5, abs(vInstanceID - float(uSelected)));
  float isHovered  = 1.0 - step(0.5, abs(vInstanceID - float(uHovered)));

  // outline strengths
  float hoverOutlineStrength = 0.35;   // subtle
  float selectedOutlineStrength = 0.7; // stronger

  // Use edgeMask to localize outline to silhouette region, and scale by isSelected/isHovered.
  float outlineFactor =
    edgeMask * (isSelected * selectedOutlineStrength + isHovered * hoverOutlineStrength);

  // Outline color (white by default) — you can swap for an accent color
  vec3 outlineColor = vec3(1.0);

  // blend outline lightly (mix keeps it thin)
  vec3 withOutline = mix(edgeShadedColor, outlineColor, clamp(outlineFactor, 0.0, 1.0));

  // final: clamp to avoid overbright artifacts
  gl_FragColor = vec4(clamp(withOutline, 0.0, 1.0), 1.0);
}
  `
)

declare module '@react-three/fiber' {
	interface ThreeElements {
		breathingMaterial: ThreeElement<
			typeof BreathingMaterial & {
				uTime: number
				uHovered: number
				uSelected: number
			}
		>
	}
}

export interface BreathingMaterialUniforms extends ShaderMaterial {
	uniforms: {
		uTime: { value: number }
		uHovered: { value: number }
		uSelected: { value: number }
	}
}
