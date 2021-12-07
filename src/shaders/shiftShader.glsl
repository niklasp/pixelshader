uniform vec2 u_resolution;  // Canvas size (width,height)
uniform vec2 u_mouse;       // mouse position in screen pixels
uniform vec2 u_mouseSpeed;
uniform float u_time;       // Time in seconds since load
uniform sampler2D tDiffuse;
uniform vec2 resolution;
uniform float pixelSize;

varying highp vec2 vUv;
varying vec3 vNormal;

void main() {
  vec2 vUvNormal = vec2( vUv - 0.5 );
  vec2 vUvMouse = vec2( vUv.x - u_mouse.x, vUv.y - u_mouse.y);
  vec2 dxy = pixelSize * 2./ resolution;
  float circle = smoothstep(
    0.1,
    1.,
    dot(vUvNormal, vUvNormal) * 4.
  );
  vec2 pixelated = (dxy * floor( vUv / dxy ) );

  //around mouse
  vec2 mouseUv = vUvNormal;
  mouseUv += ( pixelated - 0.5 ) * ( distance( u_mouse, mouseUv + 0.5) * 1.) * length(u_mouseSpeed) * 4.;

  //end around mouse


  // gl_FragColor = texture2D(tDiffuse, pixelated - circle);
  gl_FragColor = texture2D( tDiffuse, vUv + vUvNormal / 4.); // add border effect lines
  gl_FragColor = texture2D( tDiffuse, vUv + (1. - circle) * vUvNormal / 4.); // dont distort center with circle
  gl_FragColor = texture2D( tDiffuse, vUv + ( pixelated - 0.5 )* (1. - circle ) ); //somehow working
  gl_FragColor = texture2D( tDiffuse, mouseUv + 0.5); //try to only apply at mouse position
  // gl_FragColor = vec4( circle, circle, circle, 1.0 );
}