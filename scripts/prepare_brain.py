from pathlib import Path

p = Path('index.html')
s = p.read_text()

marker = '<!-- NEUROVISTA_MODEL_VIEWER_V3 -->'
if marker not in s:
    css = r'''
<style>
.brain-canvas{position:absolute;inset:0;overflow:hidden}
.brain-canvas > canvas{opacity:0!important;pointer-events:none!important}
.nv-real-brain{position:absolute;inset:0;width:100%;height:100%;display:block;background:transparent;--poster-color:transparent;filter:drop-shadow(0 0 28px rgba(65,205,255,.18));z-index:3}
.nv-real-brain::part(default-progress-bar){display:none}
</style>
'''
    js = r'''
<script type="module" src="https://unpkg.com/@google/model-viewer@4.1.0/dist/model-viewer.min.js"></script>
<script>
(function(){
  const palette = [
    [0.20,0.71,1.00,1.0],
    [0.33,0.94,0.70,1.0],
    [1.00,0.69,0.17,1.0],
    [0.66,0.42,1.00,1.0],
    [1.00,0.52,0.72,1.0],
    [0.26,0.90,1.00,1.0]
  ];

  function colorize(mv){
    try{
      const mats = mv.model && mv.model.materials ? mv.model.materials : [];
      mats.forEach((mat,i)=>{
        const c = palette[i % palette.length];
        if(mat && mat.pbrMetallicRoughness){
          mat.pbrMetallicRoughness.setBaseColorFactor(c);
          mat.pbrMetallicRoughness.setMetallicFactor(0.02);
          mat.pbrMetallicRoughness.setRoughnessFactor(0.48);
        }
      });
    }catch(e){ console.warn('NeuroVista material colorization skipped', e); }
  }

  function mount(){
    document.querySelectorAll('.brain-canvas').forEach((host)=>{
      if(host.querySelector('.nv-real-brain')) return;
      const mv = document.createElement('model-viewer');
      mv.className = 'nv-real-brain';
      mv.setAttribute('src','/Neuro-Vista/assets/brain.glb?v=15');
      mv.setAttribute('camera-controls','');
      mv.setAttribute('auto-rotate','');
      mv.setAttribute('rotation-per-second','10deg');
      mv.setAttribute('interaction-prompt','none');
      mv.setAttribute('shadow-intensity','0');
      mv.setAttribute('environment-image','neutral');
      mv.setAttribute('exposure','1.05');
      mv.setAttribute('camera-orbit','0deg 78deg 2.4m');
      mv.setAttribute('min-camera-orbit','auto auto 1.35m');
      mv.setAttribute('max-camera-orbit','auto auto 4.5m');
      mv.setAttribute('field-of-view','28deg');
      mv.setAttribute('touch-action','pan-y');
      mv.addEventListener('load',()=>colorize(mv));
      host.appendChild(mv);
    });
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',mount);
  else mount();
  document.addEventListener('click',()=>setTimeout(mount,80));
  const mo=new MutationObserver(()=>mount());
  mo.observe(document.documentElement,{subtree:true,childList:true});
})();
</script>
'''
    s = s.replace('</head>', css + '\n' + marker + '\n</head>')
    s = s.replace('</body>', js + '\n</body>')

p.write_text(s)
