'use client';
import { useState } from 'react';

export default function SubmitForm() {
  const [sent, setSent] = useState(false);
  return (
    <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} className="rv">
      <div className="f2">
        <div className="f"><label htmlFor="n">Name</label><input id="n" type="text" required autoComplete="name" /></div>
        <div className="f"><label htmlFor="c">Company</label><input id="c" type="text" required autoComplete="organization" /></div>
      </div>
      <div className="f2">
        <div className="f"><label htmlFor="e">Email</label><input id="e" type="email" required autoComplete="email" /></div>
        <div className="f"><label htmlFor="p">Phone</label><input id="p" type="tel" autoComplete="tel" /></div>
      </div>
      <div className="f">
        <label htmlFor="t">Material type</label>
        <select id="t" defaultValue="Defective or recalled product">
          <option>Defective or recalled product</option>
          <option>Recurring manufacturing waste / offcuts</option>
          <option>Obsolete or damaged stock</option>
          <option>Mattresses &amp; bedding components</option>
          <option>Timber / bed bases</option>
          <option>Polystyrene (EPS)</option>
          <option>Plastics / polymer product</option>
          <option>Concrete / brick / construction material</option>
          <option>Mixed metals for separation</option>
          <option>Tyres</option>
          <option>Commercial green waste</option>
          <option>Something not listed</option>
        </select>
      </div>
      <div className="f2">
        <div className="f"><label htmlFor="v">Approximate volume</label>
          <select id="v" defaultValue="Under 5 tonnes / one-off">
            <option>Under 5 tonnes / one-off</option>
            <option>5–50 tonnes</option>
            <option>50–500 tonnes</option>
            <option>500+ tonnes</option>
            <option>Recurring — weekly or monthly</option>
            <option>Not sure yet</option>
          </select>
        </div>
        <div className="f"><label htmlFor="l">Location</label><input id="l" type="text" placeholder="Suburb & state" /></div>
      </div>
      <div className="f"><label htmlFor="o">What outcome matters most?</label><textarea id="o" placeholder="e.g. evidenced destruction, maximum diversion from landfill, lowest cost, site cleared by a fixed date, recurring program" /></div>
      <div className="f"><label htmlFor="ph">Photographs</label><input id="ph" type="file" multiple accept="image/*" /></div>
      <button type="submit" className="btn btn-k" disabled={sent}>{sent ? 'Submission received' : 'Submit for assessment'}</button>
      <p className="fnote" role="status">Assessment response within 2 business days. Submission does not confirm material acceptance.</p>
    </form>
  );
}
