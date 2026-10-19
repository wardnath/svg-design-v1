import React from 'react';
import { E } from '../pipeline.js';
const { useState, useEffect, useRef } = React;

export default function AddDialog({ design, onClose, onAdd }) {
  const [kind, setKind] = useState('build');
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState('');
  const nameRef = useRef(null);
  useEffect(() => {
    if (nameRef.current) nameRef.current.focus();
    const esc = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, []);
  const pick = e => {
    const f = e.target.files[0];
    if (!f) return;
    if (!name) setName(f.name.replace(/\.[^.]+$/, ''));
    const rd = new FileReader();
    if (f.type.startsWith('image/') && !f.type.includes('svg')) { rd.onload = () => { setFile({ kind: 'image', src: rd.result }); setText(''); }; rd.readAsDataURL(f); }
    else { rd.onload = () => { setFile(null); setText(String(rd.result)); }; rd.readAsText(f); }
  };
  const add = async () => {
    setMsg('');
    let k = file ? file.kind : null, src = file ? file.src : text.trim();
    if (!src) { setMsg('Paste markup or choose a file first.'); return; }
    if (!k) k = /^\s*(<\?xml[^>]*>\s*)?<svg[\s>]/i.test(src) ? 'svg' : 'html';
    if (kind === 'design' && k === 'html') { setMsg('A design needs to be an SVG or an image, since it sets the frame size. Add HTML as a build instead.'); return; }
    const id = 'u' + Date.now(), nm = name.trim() || (kind === 'design' ? 'My design' : 'My build');
    try {
      if (kind === 'design') {
        const s = await E.nativeSize(k === 'image' ? { type: 'image', url: src } : { type: 'svg', text: src });
        onAdd('design', { id, name: nm, kind: k, src, w: s.w, h: s.h, family: 'Yours' });
      } else onAdd('build', { id, name: nm, kind: k, src, design: design.origin || design.id });
    } catch (e) { setMsg(e.message || String(e)); }
  };
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="addTitle" onClick={e => { if (e.target.classList.contains('modal')) onClose(); }}>
      <div className="card">
        <h3 id="addTitle">Add a design or a build</h3>
        <p>Designs are SVG exports or PNGs and set the frame size; they are stretched to other viewports by inferred constraints. Builds can be HTML, SVG or a PNG screenshot and are rendered at each viewport. External images and web fonts do not load in this renderer; inline them as data URIs, or upload a screenshot.</p>
        <div className="radios">
          <label htmlFor="addKindD"><input type="radio" name="addKind" id="addKindD" checked={kind === 'design'} onChange={() => setKind('design')} />Design</label>
          <label htmlFor="addKindB"><input type="radio" name="addKind" id="addKindB" checked={kind === 'build'} onChange={() => setKind('build')} />Build for “{design.name}”</label>
        </div>
        <label htmlFor="addName" className="lbl">Name</label>
        <input ref={nameRef} type="text" id="addName" placeholder="e.g. Checkout, v2 build" value={name} onChange={e => setName(e.target.value)} />
        <label htmlFor="addText" className="lbl">Paste markup</label>
        <textarea id="addText" spellCheck="false" placeholder={file ? 'Image loaded from file' : '<svg …> for a design, <html …> for a build'} value={text} onChange={e => { setText(e.target.value); setFile(null); }} />
        <label className="file" htmlFor="addFile">Or choose a file <input type="file" id="addFile" accept=".svg,.html,.htm,.png,.jpg,.jpeg,.webp,image/*,text/html,image/svg+xml" onChange={pick} /></label>
        <div className="msg" role="status">{msg}</div>
        <div className="row"><button className="btn" type="button" onClick={onClose}>Cancel</button><button className="btn solid" type="button" onClick={add}>Add and compare</button></div>
      </div>
    </div>
  );
}
