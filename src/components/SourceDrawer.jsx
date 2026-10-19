import React from 'react';
import { svgOf, htmlOf } from '../pipeline.js';
const { useState, useEffect } = React;

function Side({ label, kind, text, editable, onApply, id }) {
  const [v, setV] = useState(text);
  useEffect(() => setV(text), [text]);
  return (
    <div>
      <div className="lbl">{label}</div>
      {editable ? (
        <>
          <textarea id={id} spellCheck="false" aria-label={label} value={v} onChange={e => setV(e.target.value)} />
          <div className="row">
            <button className="btn solid" type="button" onClick={() => onApply(v)}>Render edits</button>
            <span className="hint">{kind === 'design' ? 'Saved as your own copy of this design. Its auto layout is not kept, so stretching uses inferred constraints.' : 'Saved as your own copy; the preset stays intact.'} {Math.round(v.length / 1024)} KB.</span>
          </div>
        </>
      ) : <p className="hint">This input is an image, so there is no source to edit.</p>}
    </div>
  );
}

export default function SourceDrawer({ design, build, onApply }) {
  const dText = design.kind === 'image' ? '' : svgOf(design, design.w, design.h);
  const bText = build.kind === 'image' ? '' : htmlOf(build);
  return (
    <section className="drawer" aria-label="Source">
      <div className="src">
        <Side id="src-design" label={`Design · ${design.kind.toUpperCase()} · ${design.w}×${design.h}`} kind="design" text={dText} editable={design.kind !== 'image'} onApply={t => onApply('design', t)} />
        <Side id="src-build" label={`Build · ${build.kind.toUpperCase()}`} kind="build" text={bText} editable={build.kind !== 'image'} onApply={t => onApply('build', t)} />
      </div>
    </section>
  );
}
