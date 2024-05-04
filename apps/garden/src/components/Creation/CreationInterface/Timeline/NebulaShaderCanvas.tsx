import React, { useEffect, useRef, useState } from 'react';

interface NebulaShaderCanvasProps {
  colors: string[];  // Array of colors for the clouds
}

type ProgramInfo = {
  uniformLocations: { time: WebGLUniformLocation|null; resolution: WebGLUniformLocation|null };
  attribLocations: { vertexPosition: number };
  program: WebGLProgram
}

const NebulaShaderCanvas: React.FC<NebulaShaderCanvasProps> = ({ colors }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isWebGLSupported, setWebGLSupported] = useState(true);
  const requestRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) {
      console.error('WebGL is not supported by your browser.');
      setWebGLSupported(false);
      return;
    }

    const resizeCanvas = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    };
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const vsSource = `
      attribute vec4 aVertexPosition;
      void main() {
        gl_Position = aVertexPosition;
      }
    `;

    const fsSource = `
      precision mediump float;
      uniform vec2 uResolution;
      uniform float uTime;
      float noise(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
      }
      void main() {
        vec2 st = gl_FragCoord.xy / uResolution.xy;
        float n = noise(st * 10.0 + vec2(uTime * 0.1));
        gl_FragColor = vec4(vec3(n), 1.0);
      }
    `;

    const program = initShaderProgram(gl, vsSource, fsSource);
    if (!program) return;

    const programInfo: ProgramInfo = {
      program,
      attribLocations: {
        vertexPosition: gl.getAttribLocation(program, 'aVertexPosition'),
      },
      uniformLocations: {
        resolution: gl.getUniformLocation(program, 'uResolution'),
        time: gl.getUniformLocation(program, 'uTime'),
      },
    };

    const buffers = initBuffers(gl);

    let observer: IntersectionObserver;
    const render = (time: number) => {
      if (buffers && programInfo) {
        drawScene(gl, programInfo, buffers, time);
      }
      requestRef.current = requestAnimationFrame(render);
    };

    const startAnimation = () => {
      console.log('starting animation')
      requestRef.current = requestAnimationFrame(render);
    };

    const stopAnimation = () => {
      if (requestRef.current) {
        console.log('stopping animation')
        cancelAnimationFrame(requestRef.current);
      }
    };

    observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          startAnimation();
        } else {
          stopAnimation();
        }
      });
    }, { threshold: 0.1 });

    observer.observe(canvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      stopAnimation();
      observer.disconnect();
      if (program) gl.deleteProgram(program);
      if (buffers && buffers.position) gl.deleteBuffer(buffers.position);
    };
  }, [colors]);

  if (!isWebGLSupported) {
    return <div>WebGL not supported. Please update your browser or use a different one.</div>;
  }

  return (
    <canvas ref={canvasRef} className='w-full h-full'></canvas>
  );
}

const loadShader = (gl: WebGLRenderingContext, type, source) => {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
};

function initShaderProgram(gl: WebGLRenderingContext, vsSource: string, fsSource: string): WebGLProgram | null {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    return null;
  }
  return shaderProgram;
}

function initBuffers(gl: WebGLRenderingContext) {
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  const positions = [
    1.0, 1.0,  // top right
    -1.0, 1.0,  // top left
    1.0, -1.0,  // bottom right
    -1.0, -1.0,  // bottom left
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
  return {
    position: positionBuffer,
  };
}

function drawScene(gl: WebGLRenderingContext, programInfo: ProgramInfo, buffers: { position: WebGLBuffer | null }, time: number) {
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height); // Set the viewport to cover the full canvas

  gl.clearColor(0, 0, 0, 1);  // Clear to black, fully opaque
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
  gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);

  gl.useProgram(programInfo.program);
  gl.uniform2f(programInfo.uniformLocations.resolution, gl.canvas.width, gl.canvas.height);
  gl.uniform1f(programInfo.uniformLocations.time, time * 0.005);

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

export default NebulaShaderCanvas;
