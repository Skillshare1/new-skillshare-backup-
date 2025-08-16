import { useRef, useEffect, useState } from "react";
import { Renderer, Program, Triangle, Mesh } from "ogl";

const hexToRgb = (hex) => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? [parseInt(m[1],16)/255, parseInt(m[2],16)/255, parseInt(m[3],16)/255] : [1,1,1];
};
const getAnchorAndDir = (origin, w, h) => {
  const outside = 0.2;
  switch (origin) {
    case "top-left": return { anchor:[0, -outside*h], dir:[0,1] };
    case "top-right": return { anchor:[w, -outside*h], dir:[0,1] };
    case "left": return { anchor:[-outside*w, 0.5*h], dir:[1,0] };
    case "right": return { anchor:[(1+outside)*w, 0.5*h], dir:[-1,0] };
    case "bottom-left": return { anchor:[0, (1+outside)*h], dir:[0,-1] };
    case "bottom-center": return { anchor:[0.5*w, (1+outside)*h], dir:[0,-1] };
    case "bottom-right": return { anchor:[w, (1+outside)*h], dir:[0,-1] };
    default: return { anchor:[0.5*w, -outside*h], dir:[0,1] };
  }
};

export default function LightRays({
  raysOrigin="top-center",
  raysColor="#00ffff",
  raysSpeed=1.2,
  lightSpread=0.9,
  rayLength=1.2,
  pulsating=false,
  fadeDistance=1.0,
  saturation=1.0,
  followMouse=true,
  mouseInfluence=0.12,
  noiseAmount=0.05,
  distortion=0.04,
  className=""
}) {
  const containerRef = useRef(null);
  const uniformsRef = useRef(null);
  const rendererRef = useRef(null);
  const mouseRef = useRef({ x:0.5, y:0.5 });
  const smoothMouseRef = useRef({ x:0.5, y:0.5 });
  const animationIdRef = useRef(null);
  const meshRef = useRef(null);
  const cleanupRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const observerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    observerRef.current = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), { threshold:0.1 });
    observerRef.current.observe(containerRef.current);
    return () => observerRef.current?.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible || !containerRef.current) return;
    if (cleanupRef.current) cleanupRef.current();

    const init = async () => {
      const renderer = new Renderer({ dpr: Math.min(window.devicePixelRatio,2), alpha:true });
      rendererRef.current = renderer;
      const gl = renderer.gl;
      gl.canvas.style.width = "100%";
      gl.canvas.style.height = "100%";
      while (containerRef.current.firstChild) containerRef.current.removeChild(containerRef.current.firstChild);
      containerRef.current.appendChild(gl.canvas);

      const vert = `
      attribute vec2 position; varying vec2 vUv;
      void main(){ vUv = position*0.5+0.5; gl_Position = vec4(position,0.,1.); }`;

      const frag = `precision highp float;
      uniform float iTime; uniform vec2 iResolution;
      uniform vec2 rayPos; uniform vec2 rayDir; uniform vec3 raysColor;
      uniform float raysSpeed, lightSpread, rayLength, pulsating, fadeDistance, saturation;
      uniform vec2 mousePos; uniform float mouseInfluence, noiseAmount, distortion;
      float noise(vec2 st){ return fract(sin(dot(st, vec2(12.9898,78.233))) * 43758.5453123); }
      float rs(vec2 s, vec2 d, vec2 c, float a, float b, float sp){
        vec2 v = c - s; vec2 n = normalize(v);
        float ca = dot(n, d);
        float da = ca + distortion * sin(iTime*2. + length(v)*.01) * .2;
        float spread = pow(max(da,0.), 1. / max(lightSpread,.001));
        float dist = length(v); float md = iResolution.x*rayLength;
        float lenFall = clamp((md - dist)/md, 0., 1.);
        float fade = clamp((iResolution.x*fadeDistance - dist)/(iResolution.x*fadeDistance), .5, 1.);
        float pulse = pulsating>.5 ? (0.8 + 0.2*sin(iTime*sp*3.)) : 1.;
        float base = clamp((0.45+0.15*sin(da*a + iTime*sp)) + (0.3+0.2*cos(-da*b + iTime*sp)), 0.,1.);
        return base * lenFall * fade * spread * pulse;
      }
      void main(){
        vec2 fc = gl_FragCoord.xy; vec2 coord = vec2(fc.x, iResolution.y - fc.y);
        vec2 d = rayDir;
        if(mouseInfluence>0.){
          vec2 ms = mousePos * iResolution.xy;
          vec2 md = normalize(ms - rayPos);
          d = normalize(mix(rayDir, md, mouseInfluence));
        }
        vec4 c1 = vec4(1.) * rs(rayPos,d,coord,36.2214,21.11349,1.5*raysSpeed);
        vec4 c2 = vec4(1.) * rs(rayPos,d,coord,22.3991,18.0234,1.1*raysSpeed);
        vec4 col = c1*.5 + c2*.4;
        if(noiseAmount>0.) { float n = noise(coord*.01 + iTime*.1); col.rgb *= (1.-noiseAmount + noiseAmount*n); }
        float b = 1. - (coord.y / iResolution.y);
        col.x *= .1 + b*.8; col.y *= .3 + b*.6; col.z *= .5 + b*.5;
        if(saturation!=1.){ float g = dot(col.rgb, vec3(.299,.587,.114)); col.rgb = mix(vec3(g), col.rgb, saturation); }
        col.rgb *= raysColor; gl_FragColor = col;
      }`;

      const uniforms = {
        iTime:{value:0}, iResolution:{value:[1,1]},
        rayPos:{value:[0,0]}, rayDir:{value:[0,1]},
        raysColor:{value:hexToRgb("#00ffff")}, raysSpeed:{value:1.2},
        lightSpread:{value:0.9}, rayLength:{value:1.2},
        pulsating:{value:0.0}, fadeDistance:{value:1.0}, saturation:{value:1.0},
        mousePos:{value:[0.5,0.5]}, mouseInfluence:{value:0.12},
        noiseAmount:{value:0.05}, distortion:{value:0.04},
      };
      uniformsRef.current = uniforms;

      const geometry = new Triangle(gl);
      const program = new Program(gl, { vertex: vert, fragment: frag, uniforms });
      const mesh = new Mesh(gl, { geometry, program });
      meshRef.current = mesh;

      const update = () => {
        const wCSS = containerRef.current.clientWidth;
        const hCSS = containerRef.current.clientHeight;
        renderer.dpr = Math.min(window.devicePixelRatio,2);
        renderer.setSize(wCSS, hCSS);
        const w = wCSS*renderer.dpr, h = hCSS*renderer.dpr;
        uniforms.iResolution.value = [w,h];
        const { anchor, dir } = getAnchorAndDir(raysOrigin, w, h);
        uniforms.rayPos.value = anchor; uniforms.rayDir.value = dir;
      };

      const loop = (t) => {
        uniforms.iTime.value = t*0.001;
        if (followMouse && uniforms.mouseInfluence.value>0){
          const s = 0.92;
          smoothMouseRef.current.x = smoothMouseRef.current.x*s + mouseRef.current.x*(1-s);
          smoothMouseRef.current.y = smoothMouseRef.current.y*s + mouseRef.current.y*(1-s);
          uniforms.mousePos.value = [smoothMouseRef.current.x, smoothMouseRef.current.y];
        }
        renderer.render({ scene: mesh });
        animationIdRef.current = requestAnimationFrame(loop);
      };

      window.addEventListener("resize", update);
      update();
      animationIdRef.current = requestAnimationFrame(loop);

      cleanupRef.current = () => {
        cancelAnimationFrame(animationIdRef.current); animationIdRef.current=null;
        window.removeEventListener("resize", update);
        const lose = gl.getExtension("WEBGL_lose_context"); lose?.loseContext();
        gl.canvas.parentNode?.removeChild(gl.canvas);
        rendererRef.current=null; uniformsRef.current=null; meshRef.current=null;
      };
    };

    init();
    return () => cleanupRef.current?.();
  }, [isVisible, raysOrigin, followMouse]);

  useEffect(() => {
    const onMove = (e) => {
      if (!containerRef.current) return;
      const r = containerRef.current.getBoundingClientRect();
      mouseRef.current = { x:(e.clientX-r.left)/r.width, y:(e.clientY-r.top)/r.height };
    };
    if (followMouse) { window.addEventListener("mousemove", onMove); return () => window.removeEventListener("mousemove", onMove); }
  }, [followMouse]);

  return <div ref={containerRef} className={`w-full h-full pointer-events-none absolute inset-0 ${className}`} />;
}
