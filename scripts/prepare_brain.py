from pathlib import Path

p = Path('index.html')
s = p.read_text()

three_import = "import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.171.0/build/three.module.js';"
loader_import = "import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.171.0/examples/jsm/loaders/GLTFLoader.js?module';"
if 'GLTFLoader' not in s:
    s = s.replace(three_import, three_import + '\n' + loader_import)
else:
    s = s.replace("import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.171.0/examples/jsm/loaders/GLTFLoader.js';", loader_import)

marker = "this.group=new THREE.Group();this.group.rotation.set(.08,-.12,0);this.scene.add(this.group);"
start = s.find(marker)
if start != -1:
    after = start + len(marker)
    shell_idx = s.find('const shell=new THREE.MeshPhysicalMaterial', after)
    if shell_idx != -1:
        prefix = s[:after]
        suffix = s[shell_idx:]
        inject = """
this.realBrainModel=true;
this.regionMeshes={};
const loader=new GLTFLoader();
loader.load('assets/brain.glb',g=>{
  const root=g.scene;
  root.name='AnatomicalBrain';
  this.group.add(root);
  root.updateMatrixWorld(true);
  const box0=new THREE.Box3().setFromObject(root);
  const size0=box0.getSize(new THREE.Vector3());
  const center0=box0.getCenter(new THREE.Vector3());
  root.position.sub(center0);
  const scale=2.85/Math.max(size0.x,size0.y,size0.z);
  root.scale.setScalar(scale);
  root.rotation.set(.06,-.34,0);
  root.updateMatrixWorld(true);

  const all=[];
  root.traverse(o=>{if(o.isMesh){
    if(o.geometry.computeBoundingBox)o.geometry.computeBoundingBox();
    const c=o.geometry.boundingBox?o.geometry.boundingBox.getCenter(new THREE.Vector3()):new THREE.Vector3();
    o.localToWorld(c);
    all.push({o:o,c:c,name:(o.name+' '+((o.parent&&o.parent.name)||'')).toLowerCase()});
  }});
  const bbox=new THREE.Box3().setFromObject(root);
  const bsize=bbox.getSize(new THREE.Vector3());
  const bmin=bbox.min;
  const norm=v=>new THREE.Vector3((v.x-bmin.x)/(bsize.x||1),(v.y-bmin.y)/(bsize.y||1),(v.z-bmin.z)/(bsize.z||1));
  const colors={
    'Frontal Lobe':0x34b6ff,
    'Parietal Lobe':0x55efb3,
    'Temporal Lobe':0xffb12b,
    'Occipital Lobe':0xa96cff,
    'Cerebellum':0xff85b8,
    'Brain Stem':0x43e6ff
  };
  const byName=n=>{
    if(/frontal|precentral|orbitofrontal|frontopolar/.test(n))return 'Frontal Lobe';
    if(/parietal|postcentral|precuneus|supramarginal|angular gyrus/.test(n))return 'Parietal Lobe';
    if(/temporal|hippocamp|amygdal|fusiform/.test(n))return 'Temporal Lobe';
    if(/occipital|calcarine|cuneus|lingual/.test(n))return 'Occipital Lobe';
    if(/cerebell|vermis/.test(n))return 'Cerebellum';
    if(/brain.?stem|medulla|pons|midbrain|mesenceph|peduncle/.test(n))return 'Brain Stem';
    return null;
  };
  const byPosition=v=>{
    const n=norm(v);
    if(n.y<.28&&n.z<.58)return 'Cerebellum';
    if(n.y<.30&&n.z>=.58)return 'Brain Stem';
    if(n.z>.66)return 'Frontal Lobe';
    if(n.z<.28)return 'Occipital Lobe';
    if(n.y<.48)return 'Temporal Lobe';
    return 'Parietal Lobe';
  };
  this.meshes={};
  all.forEach(item=>{
    const o=item.o;
    const region=byName(item.name)||byPosition(item.c);
    const col=new THREE.Color(colors[region]);
    o.material=new THREE.MeshPhysicalMaterial({color:col,emissive:col,emissiveIntensity:.12,roughness:.36,metalness:.015,clearcoat:.52,clearcoatRoughness:.24,transparent:true,opacity:.90,side:THREE.DoubleSide});
    o.userData.region=region;
    if(!this.regionMeshes[region])this.regionMeshes[region]=[];
    this.regionMeshes[region].push(o);
    if(!this.meshes[region])this.meshes[region]=o;
  });
},undefined,e=>console.error('Brain model failed to load',e));
"""
        if 'this.realBrainModel=true;' not in prefix:
            suffix = suffix.replace('const shell=new THREE.MeshPhysicalMaterial', 'if(!this.realBrainModel){const shell=new THREE.MeshPhysicalMaterial', 1)
            suffix = suffix.replace('this.group.add(this.points);', 'this.group.add(this.points);}', 1)
            s = prefix + inject + suffix

s = s.replace("const h=this.ray.intersectObjects(Object.values(this.meshes),false)[0];this.hover=h?.object.userData.region||null;", "const hitTargets=this.regionMeshes?Object.values(this.regionMeshes).flat():Object.values(this.meshes);const h=this.ray.intersectObjects(hitTargets,false)[0];this.hover=h?.object.userData.region||null;")
s = s.replace('active?.83:dim?.25:.54','active ? .83 : dim ? .25 : .54')
s = s.replace('active?.78:.18','active ? .78 : .18')
p.write_text(s)
