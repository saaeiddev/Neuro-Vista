'use client';
import {useEffect,useRef,useState} from 'react';
import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {Play,Pause,RotateCcw,Maximize,Info} from 'lucide-react';

const transmitters=[
  {id:'dopamine',name:'Dopamine',fa:'دوپامین',color:'#62dcff',tag:'Reward · movement · learning',text:'Dopamine is a catecholamine neuromodulator involved in movement, motivation, reinforcement learning and many other functions. Its effects depend on the receptor type and neural circuit.'},
  {id:'serotonin',name:'Serotonin',fa:'سروتونین',color:'#ff9bd8',tag:'Mood · sleep · appetite',text:'Serotonin (5-HT) is a widely distributed neuromodulator involved in sleep, appetite, mood, cognition and many physiological processes. Different 5-HT receptors can produce different effects.'},
  {id:'glutamate',name:'Glutamate',fa:'گلوتامات',color:'#9cf59e',tag:'Major excitatory transmitter',text:'Glutamate is the principal excitatory neurotransmitter in the mammalian central nervous system and is central to synaptic plasticity, learning and memory.'},
  {id:'gaba',name:'GABA',fa:'گابا',color:'#c2a7ff',tag:'Major inhibitory transmitter',text:'GABA is the principal inhibitory neurotransmitter in the mature mammalian brain. By acting on GABA receptors it helps regulate neuronal excitability and network timing.'},
  {id:'acetylcholine',name:'Acetylcholine',fa:'استیل‌کولین',color:'#ffd477',tag:'Attention · memory · muscle',text:'Acetylcholine carries signals at the neuromuscular junction and also acts throughout the brain in systems related to attention, learning, memory and arousal.'}
] as const;

export default function NeurotransmitterScene(){
  const host=useRef<HTMLDivElement>(null),api=useRef<any>(null);
  const [selected,setSelected]=useState<(typeof transmitters)[number]['id']>('dopamine');
  const [playing,setPlaying]=useState(true),[error,setError]=useState('');
  const current=transmitters.find(t=>t.id===selected)!;

  useEffect(()=>{
    const el=host.current;if(!el)return;
    let renderer:T.WebGLRenderer;
    try{renderer=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});}catch{setError('Your browser cannot start this 3D synapse. Try enabling hardware acceleration.');return;}
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.55));
    renderer.setClearColor(0x071318,1);renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.35;
    el.appendChild(renderer.domElement);renderer.domElement.setAttribute('aria-label','Animated three-dimensional chemical synapse showing neurotransmitter release from vesicles into the synaptic cleft. Drag to rotate and pinch to zoom.');

    const scene=new T.Scene(),camera=new T.PerspectiveCamera(38,1,.1,100),controls=new OrbitControls(camera,renderer.domElement);
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    controls.enableDamping=!reduced;controls.minDistance=7;controls.maxDistance=28;controls.enablePan=false;controls.target.set(0,.25,0);
    const reset=()=>{camera.position.set(8.2,5.4,11.4);controls.target.set(0,.25,0);controls.update();};reset();
    api.current={reset};

    scene.add(new T.HemisphereLight(0xd7efff,0x3a252d,2.15));
    const key=new T.DirectionalLight(0xffdfcf,4.6);key.position.set(-5,8,7);scene.add(key);
    const rim=new T.DirectionalLight(0x66d9ff,3.8);rim.position.set(7,1,-7);scene.add(rim);
    const fill=new T.PointLight(0xa271ff,18,18,2);fill.position.set(-4,-2,3);scene.add(fill);

    let seed=314159;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
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

    // Active zone: slightly denser membrane facing the cleft.
    const activeZone=new T.Mesh(new T.CylinderGeometry(1.55,1.8,.16,56),new T.MeshPhysicalMaterial({color:0xf0b1ae,roughness:.42,clearcoat:.25}));activeZone.position.y=.82;root.add(activeZone);

    // Postsynaptic membrane, gently curved for a more anatomical cross-section.
    const postGeo=new T.PlaneGeometry(8.2,5.4,55,32),p=postGeo.attributes.position;
    for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i);const z=.14*Math.cos(x*.7)+.08*Math.sin(y*1.2);p.setZ(i,z);}postGeo.computeVertexNormals();
    const post=new T.Mesh(postGeo,membrane);post.rotation.x=-Math.PI/2;post.position.y=-1.02;root.add(post);
    const postUnder=new T.Mesh(new T.BoxGeometry(8.1,.46,5.25,28,2,20),new T.MeshPhysicalMaterial({color:0xa75d69,roughness:.66,transparent:true,opacity:.68}));postUnder.position.y=-1.32;root.add(postUnder);

    // Synaptic vesicles with visible transmitter cargo.
    const vesicleMat=new T.MeshPhysicalMaterial({color:0xffd8cf,roughness:.3,metalness:0,transparent:true,opacity:.45,transmission:.22,thickness:.35,clearcoat:.35,side:T.DoubleSide,depthWrite:false});
    const vesicles:T.Group[]=[];
    for(let i=0;i<17;i++){
      const g=new T.Group(),shell=new T.Mesh(new T.SphereGeometry(.34,28,20),vesicleMat);g.add(shell);
      for(let j=0;j<5;j++){const dot=new T.Mesh(new T.SphereGeometry(.047,10,8),glowMat);const a=random()*Math.PI*2,b=Math.acos(2*random()-1),r=.12+random()*.11;dot.position.set(Math.sin(b)*Math.cos(a)*r,Math.cos(b)*r,Math.sin(b)*Math.sin(a)*r);g.add(dot);}
      const a=random()*Math.PI*2,r=.35+random()*1.48;g.position.set(Math.cos(a)*r,1.72+random()*2.2,Math.sin(a)*r*.78);g.scale.setScalar(.86+random()*.22);root.add(g);vesicles.push(g);
    }
    const releaseVesicle=vesicles[0];releaseVesicle.position.set(.2,1.25,.05);

    // Mitochondrion inside the terminal gives anatomical context.
    const mito=new T.Mesh(new T.SphereGeometry(1,36,22),new T.MeshPhysicalMaterial({color:0xa5535f,roughness:.5,clearcoat:.12,transparent:true,opacity:.78}));mito.scale.set(.72,.34,.38);mito.position.set(-1.15,3.05,.75);mito.rotation.z=-.42;root.add(mito);
    for(let i=0;i<5;i++){const ridge=new T.Mesh(new T.TorusGeometry(.22,.025,7,22,Math.PI*1.4),new T.MeshStandardMaterial({color:0xf0a19d,roughness:.55}));ridge.position.copy(mito.position);ridge.position.x+=(-.3+i*.15);ridge.rotation.set(Math.PI/2,.5,-.42);root.add(ridge);}

    // Postsynaptic receptors concentrated opposite the active zone.
    const receptors:T.Group[]=[];const receptorMat=new T.MeshStandardMaterial({color:0x7bc9d5,roughness:.38,metalness:.05,emissive:0x16343c,emissiveIntensity:.55});
    const receptorXs=[-2.2,-1.45,-.72,0,.78,1.5,2.25];
    receptorXs.forEach((x,i)=>{const g=new T.Group();const body=new T.Mesh(new T.CylinderGeometry(.12,.15,.72,20),receptorMat);body.position.y=-.72;g.add(body);const left=new T.Mesh(new T.SphereGeometry(.19,18,14),receptorMat),right=left.clone();left.position.set(-.16,-.38,0);right.position.set(.16,-.38,0);g.add(left,right);g.position.set(x,-.3,(i%2?.6:-.55)+(random()-.5)*.22);root.add(g);receptors.push(g);});

    // Reuptake transporters on the presynaptic side.
    for(const x of [-1.75,1.75]){const ring=new T.Mesh(new T.TorusGeometry(.2,.07,10,26),new T.MeshStandardMaterial({color:0xd1b3ff,roughness:.42,emissive:0x33204b,emissiveIntensity:.45}));ring.position.set(x,.79,.18);ring.rotation.x=Math.PI/2;root.add(ring);}

    // Neurotransmitter molecules diffuse through the cleft. Instancing keeps it smooth on mobile.
    const count=72,particleGeo=new T.SphereGeometry(.074,12,9),particleMat=new T.MeshStandardMaterial({color:transmitterColor,emissive:transmitterColor,emissiveIntensity:2.8,roughness:.22});
    const particles=new T.InstancedMesh(particleGeo,particleMat,count);particles.instanceMatrix.setUsage(T.DynamicDrawUsage);root.add(particles);
    const dummy=new T.Object3D(),meta=Array.from({length:count},()=>({delay:random(),x:(random()-.5)*2.65,z:(random()-.5)*1.9,drift:(random()-.5)*.45,s:.7+random()*.7}));

    // Calcium ions enter the bouton immediately before release.
    const caGeo=new T.SphereGeometry(.055,10,8),caMat=new T.MeshStandardMaterial({color:0x70bfff,emissive:0x70bfff,emissiveIntensity:2.4});const calcium=new T.InstancedMesh(caGeo,caMat,18);root.add(calcium);const caDummy=new T.Object3D();

    const cleftRing=new T.Mesh(new T.TorusGeometry(1.25,.025,8,70),new T.MeshBasicMaterial({color:transmitterColor,transparent:true,opacity:.22}));cleftRing.rotation.x=Math.PI/2;cleftRing.position.y=-.08;root.add(cleftRing);
    const impulse=new T.Mesh(new T.SphereGeometry(.13,16,12),new T.MeshBasicMaterial({color:0x9eeeff}));root.add(impulse);

    let frame=0,visible=true,start=performance.now();
    const resize=new ResizeObserver(()=>{const w=el.clientWidth,h=el.clientHeight;if(!w||!h)return;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);});resize.observe(el);
    const observer=new IntersectionObserver(es=>visible=es[0]?.isIntersecting??true);observer.observe(el);

    const animate=(time:number)=>{frame=requestAnimationFrame(animate);if(!visible||document.hidden)return;const t=(time-start)/1000,active=playing&&!reduced;
      controls.update();
      impulse.visible=active;impulse.position.set(0,6.8-(t*2.25%5.25),0);impulse.scale.setScalar(1+.28*Math.sin(t*10));
      cleftRing.scale.setScalar(1+.08*Math.sin(t*2.7));
      (cleftRing.material as T.MeshBasicMaterial).opacity=.16+.08*(.5+.5*Math.sin(t*2.7));
      releaseVesicle.position.y=active?1.18-.18*(.5+.5*Math.sin(t*3.5)):1.18;releaseVesicle.scale.setScalar(active?.86+.1*Math.sin(t*3.5):.9);
      for(let i=0;i<count;i++){const m=meta[i];let phase=active?((t*.34+m.delay)%1):m.delay*.86;const release=Math.max(0,Math.min(1,(phase-.08)/.78));const ease=release*release*(3-2*release);const targetX=receptorXs[i%receptorXs.length]+m.drift;dummy.position.set(m.x*(1-ease)+targetX*ease,.68-1.72*ease,m.z*(1-ease)+((i%2?.58:-.55))*ease);dummy.position.x+=Math.sin(t*2.6+i)*.08*ease;dummy.position.z+=Math.cos(t*2.1+i*.7)*.07*ease;const fade=phase<.08||phase>.93?.01:1;dummy.scale.setScalar(m.s*fade);dummy.rotation.set(0,0,0);dummy.updateMatrix();particles.setMatrixAt(i,dummy.matrix);}
      particles.instanceMatrix.needsUpdate=true;
      for(let i=0;i<18;i++){const ph=((t*.5+i/18)%1);caDummy.position.set(-1.25+2.5*(i%6)/5,2.1+1.9*(1-ph),1.55-.45*(i%3));caDummy.scale.setScalar(active?.8:0);caDummy.updateMatrix();calcium.setMatrixAt(i,caDummy.matrix);}calcium.instanceMatrix.needsUpdate=true;
      receptors.forEach((g,i)=>{const s=1+(active?.05*Math.max(0,Math.sin(t*4-i*.55)):0);g.scale.setScalar(s)});
      renderer.render(scene,camera);
    };frame=requestAnimationFrame(animate);

    return()=>{cancelAnimationFrame(frame);resize.disconnect();observer.disconnect();controls.dispose();scene.traverse(o=>{const m=o as T.Mesh;if(m.geometry)m.geometry.dispose();if(m.material){if(Array.isArray(m.material))m.material.forEach(x=>x.dispose());else m.material.dispose();}});renderer.dispose();renderer.domElement.remove();api.current=null;};
  },[selected,playing]);

  return <section className="ntm-section" aria-labelledby="ntm-title">
    <style>{`
      .ntm-section{margin:78px 0 22px;padding-top:12px;border-top:1px solid rgba(150,210,255,.12)}
      .ntm-head{display:flex;justify-content:space-between;align-items:end;gap:32px;margin:38px 0 26px}.ntm-head h2{font-size:clamp(34px,4vw,50px);letter-spacing:-1.7px;margin:11px 0 10px}.ntm-head h2 small{display:block;font-size:.43em;color:#7db7d0;letter-spacing:0;margin-top:9px;font-weight:500}.ntm-head p{max-width:640px;font-size:15px;line-height:1.8}.ntm-kicker{color:#84adbf;font-size:11px;letter-spacing:1.8px;font-weight:600}.ntm-layout{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(290px,.7fr);gap:16px}.ntm-view{height:640px;position:relative;overflow:hidden;border:1px solid rgba(150,210,255,.14);border-radius:22px;background:radial-gradient(circle at 50% 43%,rgba(45,131,166,.17),transparent 42%),#071318}.ntm-canvas{position:absolute;inset:0}.ntm-canvas canvas{width:100%;height:100%;display:block;touch-action:none}.ntm-meta{position:absolute;top:22px;left:24px;display:grid;gap:3px;pointer-events:none}.ntm-meta span{font:9px/1.4 monospace;letter-spacing:1.6px;color:#5b8298}.ntm-meta strong{font-size:19px;font-weight:500}.ntm-meta small{font-size:10px;color:#6f91a5}.ntm-cleft{position:absolute;left:24px;bottom:22px;display:flex;align-items:center;gap:9px;font-size:10px;color:#80a5b9;letter-spacing:.8px;pointer-events:none}.ntm-cleft i{width:7px;height:7px;border-radius:50%;background:var(--ntm);box-shadow:0 0 14px var(--ntm)}.ntm-tools{position:absolute;right:18px;top:18px;display:flex;gap:5px;padding:5px;border:1px solid rgba(150,210,255,.15);background:rgba(5,17,27,.72);backdrop-filter:blur(16px);border-radius:11px}.ntm-tools button{width:36px;height:35px;display:grid;place-items:center;border:0;border-radius:7px;background:transparent;color:#8eabbc}.ntm-tools button[aria-pressed=true],.ntm-tools button:hover{background:rgba(125,210,255,.12);color:#c8f2ff}.ntm-panel{padding:24px;border:1px solid rgba(150,210,255,.14);background:linear-gradient(135deg,rgba(255,255,255,.04),rgba(255,255,255,.01));border-radius:22px}.ntm-panel>p{font-size:13px;line-height:1.75}.ntm-list{display:grid;gap:6px;margin:20px 0}.ntm-list button{display:grid;grid-template-columns:10px 1fr auto;align-items:center;gap:10px;width:100%;padding:12px 11px;border:1px solid transparent;border-radius:10px;background:rgba(255,255,255,.02);text-align:left}.ntm-list button:hover,.ntm-list button[aria-pressed=true]{border-color:rgba(150,210,255,.16);background:rgba(130,214,255,.07)}.ntm-list i{width:7px;height:7px;border-radius:50%;background:var(--dot);box-shadow:0 0 10px var(--dot)}.ntm-list strong{font-size:13px;font-weight:560}.ntm-list small{font-size:10px;color:#68889b}.ntm-detail{border-top:1px solid rgba(150,210,255,.12);padding-top:20px;margin-top:8px}.ntm-detail .ntm-tag{font-size:10px;letter-spacing:1px;color:var(--ntm);text-transform:uppercase}.ntm-detail h3{font-size:27px;margin:9px 0 4px}.ntm-fa{color:#88aabd;font-size:13px;margin-bottom:12px}.ntm-detail p{font-size:13px;line-height:1.78}.ntm-note{display:flex;gap:9px;margin-top:18px;padding:12px;border-radius:11px;background:rgba(104,194,235,.06);border:1px solid rgba(144,214,244,.1)}.ntm-note svg{flex:none;margin-top:2px;color:#79cce9}.ntm-note p{font-size:11px;line-height:1.65}.ntm-error{position:absolute;inset:auto 20px 70px;background:#280d16d9;border:1px solid #ff9eab3d;padding:12px 14px;border-radius:10px;font-size:12px;color:#ffd4da}.ntm-source{margin-top:15px;font-size:11px;color:#607f92}.ntm-source a{color:#8fcde6;text-decoration:underline;text-underline-offset:3px}
      @media(max-width:1000px){.ntm-layout{grid-template-columns:1fr}.ntm-view{height:590px}.ntm-panel{display:grid;grid-template-columns:1fr 1fr;column-gap:28px}.ntm-panel>.ntm-kicker,.ntm-panel>.ntm-note{grid-column:1/-1}.ntm-detail{border-top:0;margin-top:18px}.ntm-list{margin-bottom:0}}
      @media(max-width:600px){.ntm-section{margin-top:55px}.ntm-head{display:block}.ntm-head h2{font-size:36px}.ntm-view{height:535px}.ntm-meta{left:18px;top:18px}.ntm-cleft{left:18px;bottom:18px}.ntm-panel{display:block;padding:20px}.ntm-list{grid-template-columns:1fr 1fr}.ntm-list button{grid-template-columns:8px 1fr;padding:10px 8px}.ntm-list button small{display:none}.ntm-detail{border-top:1px solid rgba(150,210,255,.12);padding-top:18px}}
    `}</style>
    <div className="ntm-head"><div><span className="ntm-kicker">CHEMICAL SYNAPSE / 03</span><h2 id="ntm-title">Neurotransmitters <small>نوروترنسمیترها</small></h2></div><p>Watch chemical messengers leave a presynaptic terminal, diffuse across the synaptic cleft and interact with receptors on the receiving cell.</p></div>
    <div className="ntm-layout" style={{'--ntm':current.color} as any}>
      <div className="ntm-view"><div className="ntm-canvas" ref={host}/><div className="ntm-meta"><span>MOLECULAR COMMUNICATION</span><strong>{current.name} release</strong><small>Animated synaptic transmission · illustrative scale</small></div><div className="ntm-cleft"><i/> PRESYNAPTIC TERMINAL → SYNAPTIC CLEFT → RECEPTORS</div>{error&&<p className="ntm-error" role="status">{error}</p>}<div className="ntm-tools" role="toolbar" aria-label="Neurotransmitter animation controls"><button aria-label="Reset synapse view" title="Reset view" onClick={()=>api.current?.reset()}><RotateCcw size={17}/></button><button aria-label={playing?'Pause neurotransmitter release':'Play neurotransmitter release'} title={playing?'Pause release':'Play release'} aria-pressed={playing} onClick={()=>setPlaying(!playing)}>{playing?<Pause size={17}/>:<Play size={17}/>}</button><button aria-label="Fullscreen synapse" title="Fullscreen" onClick={()=>{const node=host.current?.parentElement;if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});else node?.requestFullscreen?.().catch(()=>setError('Fullscreen is unavailable in this browser.'));}}><Maximize size={17}/></button></div></div>
      <aside className="ntm-panel"><span className="ntm-kicker">SELECT A MESSENGER</span><div className="ntm-list">{transmitters.map(t=><button key={t.id} aria-pressed={selected===t.id} onClick={()=>setSelected(t.id)} style={{'--dot':t.color} as any}><i/><strong>{t.name}</strong><small>{t.fa}</small></button>)}</div><div className="ntm-detail" aria-live="polite"><span className="ntm-tag">{current.tag}</span><h3>{current.name}</h3><div className="ntm-fa">{current.fa}</div><p>{current.text}</p></div><div className="ntm-note"><Info size={16}/><p>The animation is intentionally slowed and enlarged for teaching. Neurotransmitters are molecules, not visible glowing particles, and real synapses operate at microscopic scales.</p></div></aside>
    </div>
    <p className="ntm-source">Educational 3D visualization based on standard chemical-synapse anatomy. Learn more from <a href="https://www.ninds.nih.gov/health-information/public-education/brain-basics/brain-basics-life-and-death-neuron" target="_blank" rel="noreferrer">NINDS — The Life and Death of a Neuron</a>.</p>
  </section>;
}
