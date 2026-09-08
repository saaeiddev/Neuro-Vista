from pathlib import Path

p = Path('index.html')
s = p.read_text(encoding='utf-8')

# Keep the existing interactive UI stable while replacing the procedural placeholder
# with a real anatomical GLB viewer at deploy time.
s = s.replace('active?.83:dim?.25:.54', 'active ? .83 : dim ? .25 : .54')
s = s.replace('active?.78:.18', 'active ? .78 : .18')

marker = '<!-- REAL_ANATOMICAL_BRAIN_V2 -->'
if marker not in s:
    addon = r'''
<!-- REAL_ANATOMICAL_BRAIN_V2 -->
<style>
.real-brain-viewer{position:absolute;inset:0;width:100%;height:100%;display:block;background:transparent;--poster-color:transparent;z-index:5;filter:drop-shadow(0 0 28px rgba(71,205,255,.18))}.brain-canvas.real-active canvas{opacity:0!important;pointer-events:none!important}.brain-canvas.real-active{overflow:hidden}.real-brain-credit{position:absolute;left:18px;bottom:16px;z-index:9;font-size:8px;letter-spacing:.04em;color:rgba(185,220,238,.58);background:rgba(3,15,26,.5);border:1px solid rgba(135,210,255,.12);padding:6px 8px;border-radius:10px;backdrop-filter:blur(10px)}
@media(max-width:720px){.real-brain-credit{font-size:7px;left:10px;bottom:10px}.real-brain-viewer{filter:drop-shadow(0 0 18px rgba(71,205,255,.14))}}
</style>
<script type="module" src="https://unpkg.com/@google/model-viewer@4.1.0/dist/model-viewer.min.js"></script>
<script>
(function(){
  const IDS=['heroBrain','aboutBrain','anatomyBrain'];
  const mount=()=>{
    IDS.forEach(id=>{
      const host=document.getElementById(id);
      if(!host || host.dataset.realBrain==='1') return;
      host.dataset.realBrain='1';
      host.classList.add('real-active');
      const mv=document.createElement('model-viewer');
      mv.className='real-brain-viewer';
      mv.setAttribute('src','/Neuro-Vista/models/brain.glb');
      mv.setAttribute('alt','Interactive anatomical 3D model of the human brain');
      mv.setAttribute('camera-controls','');
      mv.setAttribute('auto-rotate','');
      mv.setAttribute('rotation-per-second','10deg');
      mv.setAttribute('interaction-prompt','none');
      mv.setAttribute('shadow-intensity','0');
      mv.setAttribute('exposure','1.15');
      mv.setAttribute('environment-image','neutral');
      mv.setAttribute('camera-orbit','35deg 72deg auto');
      mv.setAttribute('min-camera-orbit','auto 18deg auto');
      mv.setAttribute('max-camera-orbit','auto 162deg auto');
      mv.setAttribute('min-field-of-view','20deg');
      mv.setAttribute('max-field-of-view','48deg');
      mv.style.background='transparent';
      host.appendChild(mv);
      const credit=document.createElement('div');
      credit.className='real-brain-credit';
      credit.textContent='Anatomical model: Z-Anatomy / BodyParts3D · CC BY-SA 4.0';
      host.appendChild(credit);
    });
  };
  if(customElements.get('model-viewer')) mount();
  else customElements.whenDefined('model-viewer').then(mount);
  document.addEventListener('click',()=>setTimeout(mount,50));
})();
</script>
'''
    s = s.replace('</body>', addon + '\n</body>')

p.write_text(s, encoding='utf-8')
