'use client';
import { useState } from 'react';
import { img } from '@/lib';

type Row = { name: string; short: string; steps: string[]; note?: string; out: string; status: 'Established' | 'Assessment' | 'Trial'; thumb?: string };
export const STREAMS: Row[] = [
  { name: 'Mattresses & bedding components', short: 'Mattresses & bedding', steps: ['Dismantle', 'Shred', 'Separate'], note: 'foam / spring / timber / textile', out: 'Separated steel, foam, timber fibre and textile fractions for downstream recovery', status: 'Established', thumb: 'th-mattress.webp' },
  { name: 'Pocket spring units', short: 'Pocket spring units', steps: ['Shred', 'Separate steel from fabric pocket wrap'], out: 'Clean steel and separated textile wrap recovered as two distinct commodity streams rather than one mixed fraction', status: 'Assessment', thumb: 'th-pocket.webp' },
  { name: 'Timber & bed bases', short: 'Timber & bed bases', steps: ['Shred', 'Chip', 'Size reduce'], note: 'ferrous extraction', out: 'Graded timber chip; recovered ferrous metal from staples, springs and fixings', status: 'Established', thumb: 'th-timber.webp' },
  { name: 'Polystyrene (EPS)', short: 'Polystyrene (EPS)', steps: ['Granulate', 'Densify'], note: 'compaction to ingot', out: 'Densified EPS suitable for onward reprocessing; volume reduced up to 50:1', status: 'Established', thumb: 'th-eps.webp' },
  { name: 'Plastics & polymer product', short: 'Plastics & polymer', steps: ['Shred', 'Size reduce', 'Granulate to specification'], out: 'Shredded or granulated polymer to an agreed particle size for reprocessing or energy recovery', status: 'Established', thumb: 'th-plastic.webp' },
  { name: 'Concrete, brick & construction material', short: 'Concrete & brick', steps: ['Crush', 'Screen', 'Grade'], note: 'contamination removal', out: 'Graded aggregate, subject to contamination limits and end-use specification', status: 'Established', thumb: 'th-concrete.webp' },
  { name: 'Commercial green waste', short: 'Commercial green waste', steps: ['Shred', 'Chip', 'Screen'], out: 'Mulch or chip fractions from suitable commercial green-waste volumes', status: 'Established', thumb: 'th-green.webp' },
  { name: 'Mixed metals in construction & steel streams', short: 'Mixed metal streams', steps: ['Assess', 'Size reduce', 'Eddy current separation'], out: 'Aluminium separated from steel and construction material, as a paid separation service for product you already hold', status: 'Assessment' },
  { name: 'Tyres', short: 'Tyres', steps: ['Assess', 'Shred'], note: 'size subject to type', out: 'Tyre shred sized to downstream requirement; passenger, truck and OTR assessed separately', status: 'Assessment' },
  { name: 'Defective manufactured product', short: 'Defective product', steps: ['Composition assessment', 'Destruction', 'Separation'], out: 'Evidenced destruction plus recovery of separable material fractions where viable', status: 'Trial' },
  { name: 'Unlisted & mixed streams', short: 'Unlisted & mixed streams', steps: ['Sample', 'Controlled trial', 'Method development'], out: 'A documented processing method, or a clear answer that no viable pathway exists', status: 'Trial' },
];

export default function Explorer() {
  const [sel, setSel] = useState(0);
  const r = STREAMS[sel];
  return (
    <div className="explorer rv">
      <div className="ex-list" role="tablist" aria-label="Material streams" aria-orientation="vertical">
        {STREAMS.map((s, i) => (
          <button key={s.name} role="tab" aria-selected={i === sel} aria-controls="ex-panel" id={`ex-tab-${i}`}
            className={`ex-item${i === sel ? ' on' : ''}`} onClick={() => setSel(i)}>
            <span className="ex-num">{String(i + 1).padStart(2, '0')}</span>
            <span className="ex-name">{s.short}</span>
            <span className={`dot ${s.status === 'Established' ? 'live' : ''}`} aria-hidden="true" />
          </button>
        ))}
      </div>
      <div className="ex-panel" id="ex-panel" role="tabpanel" aria-labelledby={`ex-tab-${sel}`} key={sel}>
        <div className="ex-head">
          {r.thumb ? <span className="ex-thumb" style={{ backgroundImage: `url(${img(r.thumb)})` }} /> : <span className="ex-thumb ph" />}
          <div>
            <span className={`pill ${r.status === 'Established' ? 'live' : ''}`}>{r.status === 'Established' ? 'Established stream' : `${r.status} required`}</span>
            <h3>{r.name}</h3>
          </div>
        </div>
        <div className="ex-block">
          <p className="lab">Process applied</p>
          <ol className="flow">
            {r.steps.map((s, i) => (<li key={s} style={{ animationDelay: `${i * 90}ms` }}>{s}</li>))}
          </ol>
          {r.note && <p className="ex-note">{r.note}</p>}
        </div>
        <div className="ex-block">
          <p className="lab">Typical output</p>
          <p className="ex-out">{r.out}</p>
        </div>
        <a className="ex-cta" href="#submit">Submit this material for assessment <span aria-hidden="true">→</span></a>
      </div>
    </div>
  );
}
