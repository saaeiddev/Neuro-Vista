'use client';
import {useEffect,useRef,useState} from 'react';
import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {Play,Pause,RotateCcw,Maximize,Info} from 'lucide-react';

const transmitters=[
  {id:'dopamine',name:'Dopamine',fa:'دوپامین',color:'#62dcff',tag:'Modulatory · selective · diffuse',text:'Dopamine is a catecholamine neuromodulator involved in movement, motivation, reinforcement learning and many other functions. In this teaching view, release is sparse and diffuse, with selective receptor binding and visible reuptake.'},
  {id:'serotonin',name:'Serotonin',fa:'سروتونین',color:'#ff9bd8',tag:'Modulatory · broad · sustained',text:'Serotonin (5-HT) is a widely distributed neuromodulator involved in sleep, appetite, mood, cognition and many physiological processes. Here it spreads broadly with gentle, sustained receptor engagement.'},
  {id:'glutamate',name:'Glutamate',fa:'گلوتامات',color:'#9cf59e',tag:'Fast excitatory transmission',text:'Glutamate is the principal excitatory neurotransmitter in the mammalian central nervous system. The simulation emphasizes rapid vesicle release, direct receptor binding and fast extracellular clearance.'},
  {id:'gaba',name:'GABA',fa:'گابا',color:'#c2a7ff',tag:'Fast inhibitory transmission',text:'GABA is the principal inhibitory neurotransmitter in the mature mammalian brain. Its animation is fast but controlled, with receptor activation that visibly suppresses the postsynaptic excitation glow.'},
  {id:'acetylcholine',name:'Acetylcholine',fa:'استیل‌کولین',color:'#ffd477',tag:'Precise · targeted · rapidly terminated',text:'Acetylcholine carries signals at the neuromuscular junction and acts throughout the brain. This view highlights targeted receptor binding followed by rapid acetylcholinesterase-like breakdown in the cleft.'}
] as const;

type TransmitterId=(typeof transmitters)[number]['id'];

type Profile={
  count:number;cycle:number;releaseStart:number;releaseSpread:number;travel:number;life:number;
  bindProbability:number;reuptakeProbability:number;diffusion:number;brownian:number;directness:number;
  receptorStrength:number;vesiclePulse:number;clearance:'reuptake'|'eaat'|'diffuse'|'ache';
  dynamics:string;clearanceLabel:string;
};

const profiles:Record<TransmitterId,Profile>={
  dopamine:{count:40,cycle:5.8,releaseStart:.30,releaseSpread:.11,travel:.48,life:1.42,bindProbability:.42,reuptakeProbability:.46,diffusion:1.18,brownian:.18,directness:.42,receptorStrength:.48,vesiclePulse:.72,clearance:'reuptake',dynamics:'Sparse · slower · diffuse',clearanceLabel:'DAT-like reuptake + diffusion'},
  serotonin:{count:52,cycle:6.25,releaseStart:.27,releaseSpread:.16,travel:.56,life:1.52,bindProbability:.50,reuptakeProbability:.40,diffusion:1.36,brownian:.21,directness:.34,receptorStrength:.42,vesiclePulse:.78,clearance:'reuptake',dynamics:'Soft wave · broad · sustained',clearanceLabel:'SERT-like reuptake + diffusion'},
  glutamate:{count:72,cycle:3.05,releaseStart:.20,releaseSpread:.055,travel:.27,life:1.18,bindProbability:.84,reuptakeProbability:.72,diffusion:.38,brownian:.075,directness:.90,receptorStrength:1.00,vesiclePulse:1.00,clearance:'eaat',dynamics:'Dense burst · fastest · direct',clearanceLabel:'Rapid transporter clearance'},
  gaba:{count:58,cycle:3.85,releaseStart:.22,releaseSpread:.075,travel:.34,life:1.28,bindProbability:.72,reuptakeProbability:.58,diffusion:.52,brownian:.095,directness:.73,receptorStrength:.66,vesiclePulse:.90,clearance:'reuptake',dynamics:'Controlled · stable · inhibitory',clearanceLabel:'Transporter-mediated reuptake'},
  acetylcholine:{count:62,cycle:3.55,releaseStart:.21,releaseSpread:.06,travel:.30,life:1.02,bindProbability:.80,reuptakeProbability:0,diffusion:.30,brownian:.07,directness:.92,receptorStrength:.88,vesiclePulse:.96,clearance:'ache',dynamics:'Crisp · targeted · short-lived',clearanceLabel:'Rapid enzymatic breakdown'}
};

const clamp=(v:number,min=0,max=1)=>Math.max(min,Math.min(max,v));
const smooth=(v:number)=>{const x=clamp(v);return x*x*(3-2*x);};
const pulse=(x:number,start:number,end:number)=>{
  if(x<=start||x>=end)return 0;
  const p=(x-start)/(end-start);
  return Math.sin(Math.PI*p);
};

export default function NeurotransmitterScene(){
  const host=useRef<HTMLDivElement>(null),api=useRef<any>(null);
  const [selected,setSelected]=useState<TransmitterId>('dopamine');
  const [playing,setPlaying]=useState(true),[error,setError]=useState('');
  const current=transmitters.find(t=>t.id===selected)!;
  const profile=profiles[selected];

  useEffect(()=>{
    const el=host.current;if(!el)return;
    let renderer:T.WebGLRenderer;
    try{renderer=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});}catch{setError('Your browser cannot start this 3D synapse. Try enabling hardware acceleration.');return;}
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.55));
    renderer.setClearColor(0x071318,1);renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.35;
    el.appendChild(renderer.domElement);renderer.domElement.setAttribute('aria-label',`Animated three-dimensional ${current.name} synapse showing calcium-triggered vesicle fusion, neurotransmitter release, receptor binding and clearance. Drag to rotate and pinch to zoom.`);

    const scene=new T.Scene(),camera=new T.PerspectiveCamera(38,1,.1,100),controls=new OrbitControls(camera,renderer.domElement);
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    controls.enableDamping=!reduced;controls.minDistance=7;controls.maxDistance=28;controls.enablePan=false;controls.target.set(0,.25,0);
    const reset=()=>{camera.position.set(8.2,5.4,11.4);controls.target.set(0,.25,0);controls.update();};reset();
    api.current={reset};

    scene.add(new T.HemisphereLight(0xd7efff,0x3a252d,2.15));
    const key=new T.DirectionalLight(0xffdfcf,4.6);key.position.set(-5,8,7);scene.add(key);
    const rim=new T.DirectionalLight(0x66d9ff,3.8);rim.position.set(7,1,-7);scene.add(rim);
    const fill=new T.PointLight(0xa271ff,18,18,2);fill.position.set(-4,-2,3);scene.add(fill);

    let seed=314159+selected.length*97;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
    const root=new T.Group();root.rotation.x=-.04;scene.add(root);
    const tissue=new T.MeshPhysicalMaterial({color:0xd78f91,roughness:.5,metalness:0,clearcoat:.18,clearcoatRoughness:.72,transparent:true,opacity:.82,side:T.DoubleSide});
    const tissueDark=new T.MeshPhysicalMaterial({color:0xb96e76,roughness:.58,clearcoat:.1});
    const membrane=new T.MeshPhysicalMaterial({color:0xe8a2a4,roughness:.48,metalness:0,clearcoat:.22,clearcoatRoughness:.66,transparent:true,opacity:.88});
    const transmitterColor=new T.Color(current.color);
    const glowMat=new T.MeshStandardMaterial({color:transmitterColor,emissive:transmitterColor,emissiveIntensity:1.7,roughness:.3});

    // Presynaptic axon and terminal bouton.
    const stem=new T.Mesh(new T.CylinderGeometry(.72,.95,5.1,36,5),tissueDark);stem.position.set(0,4.8,0);stem.rotation.z=.03;root.add(stem);
    const boutonGeo=new T.SphereGeometry(2.55,72,52);const pa=boutonGeo.attributes.position;
    for(let i=0;i<pa.count;i++){const x=pa.getX(i),y=pa.getY(i),z=pa.getZ(i);const n=1+.035*Math.sin(x*5.1+y*4.7)*Math.cos(z*5.7);pa.setXYZ(i,x*n,y*(.72+.05*Math.cos(x*1.7))*n,z*.88*n);}boutonGeo.computeVertexNormals();
    const bouton=new T.Mesh(boutonGeo,tissue);bouton.position.y=2.65;root.add(bouton);

    // Active zone and fusion pore.
    const activeZone=new T.Mesh(new T.CylinderGeometry(1.55,1.8,.16,56),new T.MeshPhysicalMaterial({color:0xf0b1ae,roughness:.42,clearcoat:.25}));activeZone.position.y=.82;root.add(activeZone);
    const fusionMat=new T.MeshBasicMaterial({color:transmitterColor,transparent:true,opacity:0,depthWrite:false});
    const fusionPore=new T.Mesh(new T.TorusGeometry(.29,.035,10,36),fusionMat);fusionPore.position.set(.16,.76,.02);fusionPore.rotation.x=Math.PI/2;root.add(fusionPore);

    // Postsynaptic membrane, gently curved for anatomical context.
    const postGeo=new T.PlaneGeometry(8.2,5.4,55,32),p=postGeo.attributes.position;
    for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i);const z=.14*Math.cos(x*.7)+.08*Math.sin(y*1.2);p.setZ(i,z);}postGeo.computeVertexNormals();
    const post=new T.Mesh(postGeo,membrane);post.rotation.x=-Math.PI/2;post.position.y=-1.02;root.add(post);
    const postUnder=new T.Mesh(new T.BoxGeometry(8.1,.46,5.25,28,2,20),new T.MeshPhysicalMaterial({color:0xa75d69,roughness:.66,transparent:true,opacity:.68}));postUnder.position.y=-1.32;root.add(postUnder);
    const postSignalMat=new T.MeshBasicMaterial({color:transmitterColor,transparent:true,opacity:.08,depthWrite:false,blending:T.AdditiveBlending});
    const postSignal=new T.Mesh(new T.PlaneGeometry(5.8,3.7),postSignalMat);postSignal.rotation.x=-Math.PI/2;postSignal.position.y=-1.045;root.add(postSignal);

    // Synaptic vesicles with visible transmitter cargo. Three are positioned at the active zone to show docking.
    const vesicleMat=new T.MeshPhysicalMaterial({color:0xffd8cf,roughness:.3,metalness:0,transparent:true,opacity:.45,transmission:.22,thickness:.35,clearcoat:.35,side:T.DoubleSide,depthWrite:false});
    const vesicles:T.Group[]=[];
    for(let i=0;i<17;i++){
      const g=new T.Group(),shell=new T.Mesh(new T.SphereGeometry(.34,28,20),vesicleMat);g.add(shell);
      for(let j=0;j<5;j++){const dot=new T.Mesh(new T.SphereGeometry(.047,10,8),glowMat);const a=random()*Math.PI*2,b=Math.acos(2*random()-1),r=.12+random()*.11;dot.position.set(Math.sin(b)*Math.cos(a)*r,Math.cos(b)*r,Math.sin(b)*Math.sin(a)*r);g.add(dot);}
      const a=random()*Math.PI*2,r=.35+random()*1.48;g.position.set(Math.cos(a)*r,1.72+random()*2.2,Math.sin(a)*r*.78);g.scale.setScalar(.86+random()*.22);root.add(g);vesicles.push(g);
    }
    const docked=vesicles.slice(0,3);docked[0].position.set(.16,1.18,.02);docked[1].position.set(-.65,1.22,-.28);docked[2].position.set(.78,1.25,.32);

    // Mitochondrion inside the terminal gives anatomical context.
    const mito=new T.Mesh(new T.SphereGeometry(1,36,22),new T.MeshPhysicalMaterial({color:0xa5535f,roughness:.5,clearcoat:.12,transparent:true,opacity:.78}));mito.scale.set(.72,.34,.38);mito.position.set(-1.15,3.05,.75);mito.rotation.z=-.42;root.add(mito);
    for(let i=0;i<5;i++){const ridge=new T.Mesh(new T.TorusGeometry(.22,.025,7,22,Math.PI*1.4),new T.MeshStandardMaterial({color:0xf0a19d,roughness:.55}));ridge.position.copy(mito.position);ridge.position.x+=(-.3+i*.15);ridge.rotation.set(Math.PI/2,.5,-.42);root.add(ridge);}

    // Postsynaptic receptors use independent materials so each transmitter can produce a distinct activation pattern.
    const receptors:T.Group[]=[],receptorMats:T.MeshStandardMaterial[]=[];
    const receptorXs=[-2.2,-1.45,-.72,0,.78,1.5,2.25],receptorZs=[-.58,.58,-.5,.48,-.56,.55,-.47];
    receptorXs.forEach((x,i)=>{const g=new T.Group();const mat=new T.MeshStandardMaterial({color:0x7bc9d5,roughness:.38,metalness:.05,emissive:transmitterColor,emissiveIntensity:.08});receptorMats.push(mat);const body=new T.Mesh(new T.CylinderGeometry(.12,.15,.72,20),mat);body.position.y=-.72;g.add(body);const left=new T.Mesh(new T.SphereGeometry(.19,18,14),mat),right=left.clone();left.position.set(-.16,-.38,0);right.position.set(.16,-.38,0);g.add(left,right);g.position.set(x,-.3,receptorZs[i]+(random()-.5)*.16);root.add(g);receptors.push(g);});

    // Presynaptic reuptake transporters (most visible for monoamines and GABA).
    const reuptakeGroup=new T.Group();root.add(reuptakeGroup);
    const transporterPositions:[number,number,number][]=[[-1.75,.79,.18],[1.75,.79,.18],[-1.3,.79,-.72],[1.35,.79,.72]];
    transporterPositions.forEach(([x,y,z])=>{const ring=new T.Mesh(new T.TorusGeometry(.2,.07,10,26),new T.MeshStandardMaterial({color:transmitterColor,roughness:.42,emissive:transmitterColor,emissiveIntensity:.3}));ring.position.set(x,y,z);ring.rotation.x=Math.PI/2;reuptakeGroup.add(ring);});
    reuptakeGroup.visible=profile.clearance==='reuptake';

    // Lateral clearance sites suggest rapid glutamate uptake from the extracellular space.
    const eaatGroup=new T.Group();root.add(eaatGroup);
    [[-3.25,-.55,-.95],[3.25,-.55,.95],[-3.15,-.55,.95],[3.15,-.55,-.95]].forEach(([x,y,z])=>{const ring=new T.Mesh(new T.TorusGeometry(.19,.065,10,24),new T.MeshStandardMaterial({color:transmitterColor,roughness:.42,emissive:transmitterColor,emissiveIntensity:.32}));ring.position.set(x,y,z);ring.rotation.x=Math.PI/2;eaatGroup.add(ring);});
    eaatGroup.visible=profile.clearance==='eaat';

    // Acetylcholinesterase-like enzyme markers are visible only for acetylcholine.
    const enzymeGroup=new T.Group(),enzymePositions:T.Vector3[]=[];root.add(enzymeGroup);
    [[-1.55,-.1,.85],[-.55,-.18,-.78],[.65,-.08,.82],[1.65,-.18,-.68]].forEach(([x,y,z])=>{const pos=new T.Vector3(x,y,z);enzymePositions.push(pos);const g=new T.Group(),core=new T.Mesh(new T.IcosahedronGeometry(.16,1),new T.MeshStandardMaterial({color:0xffe5a2,roughness:.5,emissive:0x8c5b10,emissiveIntensity:.35}));g.add(core);for(let k=0;k<3;k++){const lobe=new T.Mesh(new T.SphereGeometry(.085,10,8),(core.material as T.Material));lobe.position.set(Math.cos(k*2.094)*.15,(k-1)*.045,Math.sin(k*2.094)*.15);g.add(lobe);}g.position.copy(pos);enzymeGroup.add(g);});
    enzymeGroup.visible=profile.clearance==='ache';

    // Neurotransmitter molecules diffuse through the cleft. Instancing keeps the simulation smooth on mobile.
    const maxCount=72,particleGeo=new T.SphereGeometry(.074,12,9),particleMat=new T.MeshStandardMaterial({color:transmitterColor,emissive:transmitterColor,emissiveIntensity:2.8,roughness:.22});
    const particles=new T.InstancedMesh(particleGeo,particleMat,maxCount);particles.instanceMatrix.setUsage(T.DynamicDrawUsage);root.add(particles);
    const dummy=new T.Object3D();
    const meta=Array.from({length:maxCount},(_,i)=>({
      delay:random(),startX:(random()-.5)*1.35,startZ:(random()-.5)*1.05,target:i%receptorXs.length,
      driftX:(random()-.5)*2,driftZ:(random()-.5)*2,amp:.55+random()*.8,phase:random()*Math.PI*2,
      bind:random()<profile.bindProbability,reuptake:random()<profile.reuptakeProbability,side:random()<.5?-1:1,
      enzyme:i%enzymePositions.length,s:.72+random()*.65
    }));

    // Calcium ions enter the terminal immediately before exocytosis.
    const caGeo=new T.SphereGeometry(.055,10,8),caMat=new T.MeshStandardMaterial({color:0x70bfff,emissive:0x70bfff,emissiveIntensity:2.4});const calcium=new T.InstancedMesh(caGeo,caMat,18);root.add(calcium);const caDummy=new T.Object3D();

    const cleftRing=new T.Mesh(new T.TorusGeometry(1.25,.025,8,70),new T.MeshBasicMaterial({color:transmitterColor,transparent:true,opacity:.18}));cleftRing.rotation.x=Math.PI/2;cleftRing.position.y=-.08;root.add(cleftRing);
    const impulse=new T.Mesh(new T.SphereGeometry(.13,16,12),new T.MeshBasicMaterial({color:0x9eeeff}));root.add(impulse);

    let frame=0,visible=true,start=performance.now();
    const resize=new ResizeObserver(()=>{const w=el.clientWidth,h=el.clientHeight;if(!w||!h)return;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);});resize.observe(el);
    const observer=new IntersectionObserver(es=>visible=es[0]?.isIntersecting??true);observer.observe(el);

    const animate=(time:number)=>{
      frame=requestAnimationFrame(animate);if(!visible||document.hidden)return;
      const t=(time-start)/1000,active=playing&&!reduced;
      const cycle=active?((t/profile.cycle)%1):.48;
      controls.update();

      // Action potential -> calcium entry -> docking/fusion -> release.
      const impulsePhase=clamp(cycle/(profile.releaseStart-.095));
      impulse.visible=active&&cycle<profile.releaseStart-.055;
      impulse.position.set(0,6.8-5.1*impulsePhase,0);impulse.scale.setScalar(1+.24*Math.sin(t*10));
      const caWindow=pulse(cycle,profile.releaseStart-.105,profile.releaseStart+.015);
      for(let i=0;i<18;i++){
        const lane=(i%6)/5,depth=(Math.floor(i/6)-1)*.55;
        caDummy.position.set(-1.25+2.5*lane,1.78-.82*caWindow,depth+.25*Math.sin(i*1.8));
        caDummy.scale.setScalar(active?(.18+.92*caWindow):.35);caDummy.updateMatrix();calcium.setMatrixAt(i,caDummy.matrix);
      }
      calcium.instanceMatrix.needsUpdate=true;

      const fusion=pulse(cycle,profile.releaseStart-.025,profile.releaseStart+.12)*profile.vesiclePulse;
      docked.forEach((v,i)=>{
        const primary=i===0?fusion:fusion*.24;
        const baseY=i===0?1.18:(i===1?1.22:1.25);
        v.position.y=baseY-.27*primary;
        v.scale.set(.9+.16*primary,.9-.34*primary,.9+.16*primary);
      });
      fusionMat.opacity=.05+.55*fusion;fusionPore.scale.setScalar(.7+.75*fusion);

      // Cleft field responds differently to burst-like vs modulatory transmission.
      const field=(selected==='glutamate'?1.18:selected==='gaba'?.78:selected==='acetylcholine'?.92:.62);
      cleftRing.scale.setScalar(1+field*.07*Math.sin(t*(selected==='serotonin'?1.7:2.7)));
      (cleftRing.material as T.MeshBasicMaterial).opacity=.10+field*.12*(.5+.5*Math.sin(t*(selected==='serotonin'?1.6:2.6)));

      let boundNow=0;
      for(let i=0;i<maxCount;i++){
        const m=meta[i];
        if(i>=profile.count){dummy.scale.setScalar(0);dummy.updateMatrix();particles.setMatrixAt(i,dummy.matrix);continue;}
        const releaseAt=profile.releaseStart+m.delay*profile.releaseSpread;
        if(cycle<releaseAt){dummy.scale.setScalar(0);dummy.updateMatrix();particles.setMatrixAt(i,dummy.matrix);continue;}
        const age=(cycle-releaseAt)/Math.max(profile.travel,.001),move=smooth(age),after=Math.max(0,age-1);
        const targetX=receptorXs[m.target],targetZ=receptorZs[m.target];
        let endX=targetX,endY=-.71,endZ=targetZ;
        if(!m.bind){endX=m.startX+m.driftX*profile.diffusion;endY=-.18-.28*clamp(age);endZ=m.startZ+m.driftZ*profile.diffusion;}

        // Curvature and Brownian micro-variation keep molecules from following identical paths.
        const lateral=Math.sin(Math.PI*clamp(age))*profile.diffusion*(1-profile.directness);
        const wave=selected==='serotonin'?Math.sin(age*Math.PI*2+m.phase)*.34:Math.sin(age*Math.PI+m.phase)*.18;
        let x=T.MathUtils.lerp(m.startX,endX,move)+lateral*m.driftX*.52+wave*(selected==='serotonin'?1:.35);
        let y=.71-1.42*move;
        let z=T.MathUtils.lerp(m.startZ,endZ,move)+lateral*m.driftZ*.52+(selected==='serotonin'?Math.cos(age*Math.PI*2+m.phase)*.28:0);
        const brown=profile.brownian*(.35+.65*clamp(age));
        x+=Math.sin(t*(2.1+profile.directness*2.8)+i*1.73)*brown*m.amp;
        z+=Math.cos(t*(1.8+profile.directness*2.2)+i*1.19)*brown*m.amp;

        let scale=m.s;
        if(age>1){
          if(m.bind){
            boundNow++;
            if(selected==='serotonin'){x=targetX+Math.sin(t*1.8+i)*.045;z=targetZ+Math.cos(t*1.6+i)*.04;y=-.70;scale*=clamp(1.48-after*.55);}
            else if(selected==='dopamine'){x=targetX+Math.sin(t*1.5+i)*.035;z=targetZ;y=-.70;scale*=clamp(1.25-after*.95);}
            else if(selected==='glutamate'){scale*=clamp(1.08-after*2.7);}
            else if(selected==='gaba'){scale*=clamp(1.16-after*1.65);}
            else {scale*=clamp(1.05-after*2.2);}
          }else if(profile.clearance==='ache'){
            const enzyme=enzymePositions[m.enzyme];const q=smooth(after/.26);x=T.MathUtils.lerp(x,enzyme.x,q);y=T.MathUtils.lerp(y,enzyme.y,q);z=T.MathUtils.lerp(z,enzyme.z,q);scale*=clamp(1-after*4.4);
          }else if(profile.clearance==='eaat'&&m.reuptake){
            const tx=m.side*3.2,tz=m.side*(m.target%2?.9:-.9),q=smooth(after/.34);x=T.MathUtils.lerp(x,tx,q);y=T.MathUtils.lerp(y,-.56,q);z=T.MathUtils.lerp(z,tz,q);scale*=clamp(1-after*1.8);
          }else if(profile.clearance==='reuptake'&&m.reuptake){
            const tx=m.side*1.72,tz=(m.target%2?.68:-.65),q=smooth(after/.42);x=T.MathUtils.lerp(x,tx,q);y=T.MathUtils.lerp(y,.79,q);z=T.MathUtils.lerp(z,tz,q);scale*=clamp(1-after*1.35);
          }else{
            x+=m.driftX*after*.52;y-=after*.15;z+=m.driftZ*after*.52;scale*=clamp(1-after*(selected==='serotonin'?.58:selected==='dopamine'?.78:1.25));
          }
        }
        if(age>profile.life)scale=0;
        dummy.position.set(x,y,z);dummy.scale.setScalar(scale);dummy.rotation.set(0,0,0);dummy.updateMatrix();particles.setMatrixAt(i,dummy.matrix);
      }
      particles.instanceMatrix.needsUpdate=true;

      // Distinct receptor logic: selective dopamine, broad serotonin, rapid glutamate, inhibitory GABA and targeted ACh.
      const releaseEnergy=pulse(cycle,profile.releaseStart,Math.min(.98,profile.releaseStart+.46));
      receptors.forEach((g,i)=>{
        let selectivity=1;
        if(selected==='dopamine')selectivity=i%3===0?1:.26;
        if(selected==='serotonin')selectivity=.58+.22*Math.sin(i*1.7+t*.6);
        if(selected==='acetylcholine')selectivity=i%2===0?1:.38;
        const response=profile.receptorStrength*selectivity*releaseEnergy;
        const scale=selected==='gaba'?1-.018*response:1+.055*response;
        g.scale.setScalar(scale);
        receptorMats[i].emissiveIntensity=.08+response*(selected==='glutamate'?1.7:selected==='gaba'?.42:.82);
      });

      // Postsynaptic field communicates excitation, inhibition or modulation without changing the site's visual language.
      if(selected==='glutamate')postSignalMat.opacity=.05+.30*releaseEnergy;
      else if(selected==='gaba')postSignalMat.opacity=.055-.035*releaseEnergy;
      else if(selected==='acetylcholine')postSignalMat.opacity=.04+.18*releaseEnergy;
      else if(selected==='serotonin')postSignalMat.opacity=.045+.10*(.5+.5*Math.sin(t*1.15))*releaseEnergy;
      else postSignalMat.opacity=.04+.075*releaseEnergy;

      if(enzymeGroup.visible)enzymeGroup.children.forEach((g,i)=>{const s=1+.12*Math.max(0,Math.sin(t*3.4+i));g.scale.setScalar(s);});
      if(reuptakeGroup.visible)reuptakeGroup.rotation.y=.018*Math.sin(t*.7);
      if(eaatGroup.visible)eaatGroup.children.forEach((g,i)=>{const s=1+.08*Math.max(0,Math.sin(t*5+i));g.scale.setScalar(s);});

      renderer.render(scene,camera);
    };
    frame=requestAnimationFrame(animate);

    return()=>{cancelAnimationFrame(frame);resize.disconnect();observer.disconnect();controls.dispose();scene.traverse(o=>{const m=o as T.Mesh;if(m.geometry)m.geometry.dispose();if(m.material){if(Array.isArray(m.material))m.material.forEach(x=>x.dispose());else m.material.dispose();}});renderer.dispose();renderer.domElement.remove();api.current=null;};
  },[selected,playing]);

  return <section className="ntm-section" aria-labelledby="ntm-title">
    <style>{`
      .ntm-section{margin:78px 0 22px;padding-top:12px;border-top:1px solid rgba(150,210,255,.12)}
      .ntm-head{display:flex;justify-content:space-between;align-items:end;gap:32px;margin:38px 0 26px}.ntm-head h2{font-size:clamp(34px,4vw,50px);letter-spacing:-1.7px;margin:11px 0 10px}.ntm-head h2 small{display:block;font-size:.43em;color:#7db7d0;letter-spacing:0;margin-top:9px;font-weight:500}.ntm-head p{max-width:640px;font-size:15px;line-height:1.8}.ntm-kicker{color:#84adbf;font-size:11px;letter-spacing:1.8px;font-weight:600}.ntm-layout{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(290px,.7fr);gap:16px}.ntm-view{height:640px;position:relative;overflow:hidden;border:1px solid rgba(150,210,255,.14);border-radius:22px;background:radial-gradient(circle at 50% 43%,rgba(45,131,166,.17),transparent 42%),#071318}.ntm-canvas{position:absolute;inset:0}.ntm-canvas canvas{width:100%;height:100%;display:block;touch-action:none}.ntm-meta{position:absolute;top:22px;left:24px;display:grid;gap:3px;pointer-events:none}.ntm-meta span{font:9px/1.4 monospace;letter-spacing:1.6px;color:#5b8298}.ntm-meta strong{font-size:19px;font-weight:500}.ntm-meta small{font-size:10px;color:#6f91a5}.ntm-cleft{position:absolute;left:24px;bottom:22px;display:flex;align-items:center;gap:9px;font-size:10px;color:#80a5b9;letter-spacing:.8px;pointer-events:none}.ntm-cleft i{width:7px;height:7px;border-radius:50%;background:var(--ntm);box-shadow:0 0 14px var(--ntm)}.ntm-stage-labels{position:absolute;inset:92px 18px auto;display:flex;justify-content:space-between;gap:8px;pointer-events:none}.ntm-stage-labels span{padding:5px 8px;border:1px solid rgba(150,210,255,.1);border-radius:999px;background:rgba(4,15,24,.46);backdrop-filter:blur(8px);font:8px/1 monospace;letter-spacing:.8px;color:#668b9f}.ntm-tools{position:absolute;right:18px;top:18px;display:flex;gap:5px;padding:5px;border:1px solid rgba(150,210,255,.15);background:rgba(5,17,27,.72);backdrop-filter:blur(16px);border-radius:11px}.ntm-tools button{width:36px;height:35px;display:grid;place-items:center;border:0;border-radius:7px;background:transparent;color:#8eabbc}.ntm-tools button[aria-pressed=true],.ntm-tools button:hover{background:rgba(125,210,255,.12);color:#c8f2ff}.ntm-panel{padding:24px;border:1px solid rgba(150,210,255,.14);background:linear-gradient(135deg,rgba(255,255,255,.04),rgba(255,255,255,.01));border-radius:22px}.ntm-panel>p{font-size:13px;line-height:1.75}.ntm-list{display:grid;gap:6px;margin:20px 0}.ntm-list button{display:grid;grid-template-columns:10px 1fr auto;align-items:center;gap:10px;width:100%;padding:12px 11px;border:1px solid transparent;border-radius:10px;background:rgba(255,255,255,.02);text-align:left}.ntm-list button:hover,.ntm-list button[aria-pressed=true]{border-color:rgba(150,210,255,.16);background:rgba(130,214,255,.07)}.ntm-list i{width:7px;height:7px;border-radius:50%;background:var(--dot);box-shadow:0 0 10px var(--dot)}.ntm-list strong{font-size:13px;font-weight:560}.ntm-list small{font-size:10px;color:#68889b}.ntm-detail{border-top:1px solid rgba(150,210,255,.12);padding-top:20px;margin-top:8px}.ntm-detail .ntm-tag{font-size:10px;letter-spacing:1px;color:var(--ntm);text-transform:uppercase}.ntm-detail h3{font-size:27px;margin:9px 0 4px}.ntm-fa{color:#88aabd;font-size:13px;margin-bottom:12px}.ntm-detail p{font-size:13px;line-height:1.78}.ntm-dynamics{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:14px}.ntm-dynamics div{padding:9px 10px;border-radius:9px;border:1px solid rgba(150,210,255,.09);background:rgba(255,255,255,.018)}.ntm-dynamics span{display:block;font-size:8px;letter-spacing:1px;color:#5f8498;margin-bottom:5px}.ntm-dynamics strong{font-size:10px;font-weight:560;color:#a9c8d8}.ntm-note{display:flex;gap:9px;margin-top:18px;padding:12px;border-radius:11px;background:rgba(104,194,235,.06);border:1px solid rgba(144,214,244,.1)}.ntm-note svg{flex:none;margin-top:2px;color:#79cce9}.ntm-note p{font-size:11px;line-height:1.65}.ntm-error{position:absolute;inset:auto 20px 70px;background:#280d16d9;border:1px solid #ff9eab3d;padding:12px 14px;border-radius:10px;font-size:12px;color:#ffd4da}.ntm-source{margin-top:15px;font-size:11px;color:#607f92}.ntm-source a{color:#8fcde6;text-decoration:underline;text-underline-offset:3px}
      @media(max-width:1000px){.ntm-layout{grid-template-columns:1fr}.ntm-view{height:590px}.ntm-panel{display:grid;grid-template-columns:1fr 1fr;column-gap:28px}.ntm-panel>.ntm-kicker,.ntm-panel>.ntm-note{grid-column:1/-1}.ntm-detail{border-top:0;margin-top:18px}.ntm-list{margin-bottom:0}}
      @media(max-width:600px){.ntm-section{margin-top:55px}.ntm-head{display:block}.ntm-head h2{font-size:36px}.ntm-view{height:535px}.ntm-meta{left:18px;top:18px}.ntm-stage-labels{top:90px;left:12px;right:12px}.ntm-stage-labels span{font-size:7px;padding:5px 6px}.ntm-cleft{left:18px;bottom:18px;right:92px}.ntm-panel{display:block;padding:20px}.ntm-list{grid-template-columns:1fr 1fr}.ntm-list button{grid-template-columns:8px 1fr;padding:10px 8px}.ntm-list button small{display:none}.ntm-detail{border-top:1px solid rgba(150,210,255,.12);padding-top:18px}}
    `}</style>
    <div className="ntm-head"><div><span className="ntm-kicker">CHEMICAL SYNAPSE / 03</span><h2 id="ntm-title">Neurotransmitters <small>نوروترنسمیترها</small></h2></div><p>Watch calcium-triggered vesicle fusion, molecular diffusion, receptor binding and transmitter-specific clearance inside a polished 3D synapse simulation.</p></div>
    <div className="ntm-layout" style={{'--ntm':current.color} as any}>
      <div className="ntm-view"><div className="ntm-canvas" ref={host}/><div className="ntm-meta"><span>MOLECULAR COMMUNICATION</span><strong>{current.name} release</strong><small>{profile.dynamics} · illustrative scale</small></div><div className="ntm-stage-labels" aria-hidden="true"><span>Ca²⁺ trigger</span><span>vesicle docking / fusion</span><span>receptor + clearance</span></div><div className="ntm-cleft"><i/> PRESYNAPTIC TERMINAL → SYNAPTIC CLEFT → POSTSYNAPTIC RECEPTORS</div>{error&&<p className="ntm-error" role="status">{error}</p>}<div className="ntm-tools" role="toolbar" aria-label="Neurotransmitter animation controls"><button aria-label="Reset synapse view" title="Reset view" onClick={()=>api.current?.reset()}><RotateCcw size={17}/></button><button aria-label={playing?'Pause neurotransmitter release':'Play neurotransmitter release'} title={playing?'Pause release':'Play release'} aria-pressed={playing} onClick={()=>setPlaying(!playing)}>{playing?<Pause size={17}/>:<Play size={17}/>}</button><button aria-label="Fullscreen synapse" title="Fullscreen" onClick={()=>{const node=host.current?.parentElement;if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});else node?.requestFullscreen?.().catch(()=>setError('Fullscreen is unavailable in this browser.'));}}><Maximize size={17}/></button></div></div>
      <aside className="ntm-panel"><span className="ntm-kicker">SELECT A MESSENGER</span><div className="ntm-list">{transmitters.map(t=><button key={t.id} aria-pressed={selected===t.id} onClick={()=>setSelected(t.id)} style={{'--dot':t.color} as any}><i/><strong>{t.name}</strong><small>{t.fa}</small></button>)}</div><div className="ntm-detail" aria-live="polite"><span className="ntm-tag">{current.tag}</span><h3>{current.name}</h3><div className="ntm-fa">{current.fa}</div><p>{current.text}</p><div className="ntm-dynamics"><div><span>ANIMATION</span><strong>{profile.dynamics}</strong></div><div><span>CLEARANCE</span><strong>{profile.clearanceLabel}</strong></div></div></div><div className="ntm-note"><Info size={16}/><p>The animation is intentionally slowed and enlarged for teaching. Neurotransmitters are molecules, not visible glowing particles, and real synapses operate at microscopic scales. The five modes emphasize characteristic signaling patterns rather than claiming every synapse behaves identically.</p></div></aside>
    </div>
    <p className="ntm-source">Educational 3D visualization based on standard chemical-synapse anatomy. Learn more from <a href="https://www.ninds.nih.gov/health-information/public-education/brain-basics/brain-basics-life-and-death-neuron" target="_blank" rel="noreferrer">NINDS — The Life and Death of a Neuron</a>.</p>
  </section>;
}
