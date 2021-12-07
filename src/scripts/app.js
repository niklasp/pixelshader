import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';

import { monitorScroll, loadModels, lerp } from './util';

//import shaders
import vertexShader from '../shaders/vertex.glsl';
import fragmentShader from '../shaders/fragment.glsl';
import shiftShader from '../shaders/shiftShader.glsl';

//import your models
import model from '../models/model.glb';
export default class Sketch {
  constructor( options ) {

    this.time = 0;
    this.container = options.dom;
    this.scrollPercentage = 0.0;

    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;

    const fov = 40;
    const near = 0.01;
    const far = 100;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera( fov, this.width / this.height, near, far );
    this.camera.position.z = 25;

    // const gridHelper = new THREE.GridHelper( 100, 100 );
    // this.scene.add( gridHelper );

    this.renderer = new THREE.WebGLRenderer( {
      antialias: false,
      autoClear: true,
      powerPreference: "high-performance",
    } );

    this.renderer.setSize( this.width, this.height );
    this.renderer.setClearColor(0xeeeeee, 1);
    this.container.appendChild( this.renderer.domElement );

    this.composer = new EffectComposer( this.renderer );
    const renderPass = new RenderPass( this.scene, this.camera );
    this.composer.addPass( renderPass );
    this.composer.setSize ( this.width, this.height );

    this.controls = new OrbitControls( this.camera, this.renderer.domElement );

    this.mouse = new THREE.Vector2( 0.0, 0.0 );
    this.mouseSpeed = new THREE.Vector2( 0.0, 0.0 );
    this.oldMouseSpeed = new THREE.Vector2( 0.0, 0.0 );
    this.mouseAcc = new THREE.Vector2( 0.0, 0.0 );
    this.lMouseSpeed = new THREE.Vector2( 0.0, 0.0 );
    this.lMouse = new THREE.Vector2( 0.0, 0.0 );

    this.setupListeners();
    this.addObjects();
    this.addComposerPass();
    this.render();
    this.resize();
  }

  setupListeners() {
    window.addEventListener( 'resize', this.resize.bind( this ) );
    document.addEventListener( 'mousemove', this.onMouseMove.bind( this ) );
    monitorScroll(ratio => {
      this.scrollPercentage = (ratio).toFixed(3);
    });
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize( this.width, this.height );
    this.composer.setSize( this.width, this.height );
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
  }

  addComposerPass() {
    this.shader = {
      uniforms: {
        u_time: { value: 0.0 },
        tDiffuse: { value: null },
        pixelSize: { value: 10 },
        resolution: { value: new THREE.Vector2( this.width, this.height ) },
        u_mouse: { value: new THREE.Vector2( this.width / 2.0, this.height / 2.0 ) },
        u_mouseSpeed: { value: new THREE.Vector2( this.width / 2.0, this.height / 2.0 ) },
      },
      vertexShader,
      fragmentShader: shiftShader,
    };
    this.shaderPass = new ShaderPass( this.shader );
    this.composer.addPass( this.shaderPass );
  }

  addObjects() {
    this.geometry = new THREE.BoxGeometry( 0.4, 0.4, 0.4 );

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        u_time: { value: 0.0 },
      },
      side: THREE.DoubleSide,
      fragmentShader,
      vertexShader,
    });

    // this.mesh = new THREE.Mesh( this.geometry, this.material );
    // this.scene.add( this.mesh );

    loadModels(
      model,
      ( gltf ) => {
        console.log( 'hello', gltf );
        this.scene.add( gltf.scene );
        gltf.scene.scale.set( 0.5, 0.5, 0.5 );

        gltf.scene.traverse( o => {
          if ( o.isMesh ) {
            o.geometry.center();
            o.material = this.material;
          }
        });
      }
    );
  }

  onMouseMove( e ) {
    this.oldMouse = this.mouse;
    this.mouse = new THREE.Vector2( e.clientX / this.width , ( this.height - e.clientY ) / this.height );
    this.oldMouseSpeed = this.mouseSpeed;
    this.mouseSpeed = new THREE.Vector2( Math.abs(Math.min((this.mouse.x - this.oldMouse.x) * 10, 1)), Math.abs(Math.min((this.mouse.y - this.oldMouse.y) * 10), 1));
    this.mouseAcc = new THREE.Vector2( (this.mouse.x - e.clientX) - this.mouseSpeed.x , (this.mouse.y - this.height + e.clientY) - this.mouseSpeed.y );
    this.shaderPass.uniforms.u_mouse.value = this.mouse;
  }

  updateMouse() {
    this.lMouse.x -= ( this.lMouse.x - this.mouse.x) * 0.1;
    this.lMouse.y -= ( this.lMouse.y - this.mouse.y ) * 0.1;
    this.lMouseSpeed.x = this.lMouse.x - this.mouse.x;
    this.lMouseSpeed.y = this.lMouse.y - this.mouse.y;
    this.shaderPass.uniforms.u_mouseSpeed.value = this.lMouseSpeed;
  }

  render() {
    this.time += 0.05;
    this.material.uniforms.u_time.value = this.time;
    this.updateMouse();

    // this.mesh.rotation.x = this.time / 20;
    // this.mesh.rotation.y = this.time / 10;
    if ( this.shaderPass ) {
      this.shaderPass.uniforms.u_time.value = this.time;
    }
    this.composer.render();
    window.requestAnimationFrame( this.render.bind( this ) );
  }
}