import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
// Procedural primitives, not CAD or physical simulation.
export function initScene(initial,log){
 const host=document.getElementById('viewport'),marker=document.getElementById('fault-marker');
 const scene=new THREE.Scene();scene.background=new THREE.Color('#09192f');scene.fog=new THREE.Fog('#09192f',20,42);
 const camera=new THREE.PerspectiveCamera(38,1,.1,100),renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;host.prepend(renderer.domElement);renderer.domElement.setAttribute('aria-label','Illustrative rail wheel production line. Drag to orbit and scroll to zoom. Evidence is also available in the adjacent panel.');
 const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.minDistance=7;controls.maxDistance=25;controls.maxPolarAngle=Math.PI/2.05;
 function reset(){camera.position.set(11,9,14);controls.target.set(-.7,1,0);controls.update();}reset();
 scene.add(new THREE.HemisphereLight(0xcceaff,0x294049,2.7));const light=new THREE.DirectionalLight(0xffffff,3.3);light.position.set(2,10,6);light.castShadow=true;light.shadow.mapSize.set(2048,2048);Object.assign(light.shadow.camera,{left:-12,right:12,top:9,bottom:-9});scene.add(light);const rim=new THREE.PointLight(0x38aaff,28,18);rim.position.set(2,4,-4);scene.add(rim);
 const mat=(color,metalness=.4,roughness=.5)=>new THREE.MeshStandardMaterial({color,metalness,roughness});const steel=mat('#a3b7bf',.85,.25),dark=mat('#2b4651'),body=mat('#5d7b86'),teal=mat('#287dd0'),amber=mat('#ffbb5c');
 function box(w,h,d,x,y,z,m=body){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;scene.add(o);return o;}
 function cyl(r,h,x,y,z,m=steel){const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,40),m);o.position.set(x,y,z);o.castShadow=true;scene.add(o);return o;}
 box(17,.16,7,0,-.12,0,mat('#112d4c',.1,.9));const grid=new THREE.GridHelper(25,50,0x274d78,0x142d49);grid.position.y=-.02;scene.add(grid);
 for(const z of [-1,1])box(14,.14,.14,-.5,.62,z,steel);for(let x=-6.6;x<6.2;x+=.5){const o=cyl(.11,2.2,x,.6,0,dark);o.rotation.x=Math.PI/2;}
 for(const x of [-6,-3,0,3,6])for(const z of [-1,1])box(.16,.6,.16,x,.3,z,dark);
 // Heat treatment enclosure.
 box(2.8,.35,2.7,-5,.62,0);for(const x of [-6.3,-3.7])box(.4,2.6,2.7,x,1.9,0);box(3,.4,2.7,-5,3.2,0);box(2.3,2.4,.15,-5,1.9,-1.3,dark);box(2.1,.25,1.8,-5,.95,0,amber);box(1.2,.5,.8,-5,3.6,0,dark);
 // CNC and separate control console.
 box(2.8,.5,2.6,-1,.5,0);box(.65,2.8,.65,-1,1.9,-1.1);box(2.5,.6,.75,-1,3.1,-.7);cyl(.2,.9,-1,2.5,0);box(.6,.8,.25,.6,2.2,.5,dark);box(.45,.5,.03,.6,2.25,.65,teal);box(.1,1.1,.1,.6,1.2,.5);
 // Optical gantry.
 for(const z of [-1.45,1.45])box(.16,2.9,.16,3,1.5,z,steel);box(.22,.2,3.05,3,2.95,0,teal);box(.6,.4,.65,3,2.6,0,dark);for(const z of [-1.35,1.35])box(.1,1.3,.07,3,1.7,z,teal);
 const wheels=[];for(const x of [-5,-1,3,5.5]){const g=new THREE.Group();g.add(new THREE.Mesh(new THREE.TorusGeometry(.72,.19,16,64),steel));const flange=new THREE.Mesh(new THREE.TorusGeometry(.78,.06,12,64),dark);flange.position.z=-.14;g.add(flange);const web=new THREE.Mesh(new THREE.CylinderGeometry(.64,.64,.12,48),body);web.rotation.x=Math.PI/2;g.add(web);const hub=new THREE.Mesh(new THREE.TorusGeometry(.19,.09,12,40),steel);hub.position.z=.12;g.add(hub);for(let i=0;i<8;i++){const a=i*Math.PI/4,o=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,.15,8),dark);o.rotation.x=Math.PI/2;o.position.set(Math.cos(a)*.32,Math.sin(a)*.32,.15);g.add(o);}g.position.set(x,1.45,0);g.traverse(o=>{if(o.isMesh)o.castShadow=true});scene.add(g);wheels.push(g);}
 const position=new THREE.Vector3(...initial.marker),halo=new THREE.Mesh(new THREE.TorusGeometry(.19,.025,8,32),new THREE.MeshBasicMaterial({color:0xffbd5b}));halo.position.copy(position);scene.add(halo);window.addEventListener('scenario-change',e=>{position.set(...e.detail.marker);halo.position.copy(position);});
 let paused=matchMedia('(prefers-reduced-motion: reduce)').matches;const pause=document.getElementById('pause');pause.textContent=paused?'Resume motion':'Pause motion';pause.onclick=()=>{paused=!paused;pause.textContent=paused?'Resume motion':'Pause motion';log('animation',paused?'Paused illustrative motion':'Resumed illustrative motion');};document.getElementById('camera').onclick=()=>{reset();log('camera','Reset 3D camera');};controls.addEventListener('end',()=>log('camera','Adjusted 3D camera'));
 const resize=()=>{const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();};new ResizeObserver(resize).observe(host);resize();document.getElementById('scene-status').hidden=true;const clock=new THREE.Clock();
 renderer.setAnimationLoop(()=>{const dt=Math.min(clock.getDelta(),.05);if(!paused)wheels.forEach(w=>w.rotation.z-=dt*.25);controls.update();const p=position.clone().project(camera);marker.style.left=`${(p.x*.5+.5)*host.clientWidth}px`;marker.style.top=`${(-p.y*.5+.5)*host.clientHeight}px`;marker.hidden=p.z>1||p.z< -1||Math.abs(p.x)>1||Math.abs(p.y)>1;halo.quaternion.copy(camera.quaternion);renderer.render(scene,camera);});
}
