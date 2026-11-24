import LineScene from '@/components/LineScene';
import Explorer from '@/components/Explorer';
import Effects from '@/components/Effects';
import SubmitForm from '@/components/SubmitForm';
import { img } from '@/lib';

const RISKS = [
  ['Brand exposure', 'Product that reaches a landfill floor intact can be pulled off it, resold, or photographed with your logo still on it.'],
  ['Warehouse drag', 'Rejected stock ties up racking, floor space and forklift hours for months while someone works out what to do with it. That someone has a day job.'],
  ['Reporting gaps', 'Landfill disposal produces no recovery data. If you report on diversion, packaging obligations or Scope 3, unprocessed material is a hole in the numbers.'],
  ['Escalating cost', 'Landfill levies go up every year, and mixed waste pays the highest gate rate in the schedule.'],
];
const WHO = [
  ['Manufacturing & operations', 'Recurring production waste', 'Offcuts, rejected components and by-products generated on the same line every week. You need a repeatable, costed program — not a skip and a phone call.'],
  ['Supply chain & quality', 'Defective & recalled product', 'Stock that cannot be sold, returned or reworked. You need it destroyed properly, evidenced, and off your balance sheet without becoming a brand incident.'],
  ['Retail & distribution', 'Obsolete and damaged stock', 'Discontinued lines, damaged returns and end-of-range inventory that must be permanently removed from circulation rather than quietly leaking into secondary markets.'],
  ['Sustainability & ESG', 'Diversion you can evidence', 'You need recovery outcomes you can put in a report and defend — tonnages, destinations and processing method, not a generic “recycled responsibly” claim.'],
  ['Waste & recycling operators', 'Streams you can’t process', 'Material that arrives at your facility outside your equipment’s capability. SHRED works as processing capacity behind you rather than in competition with you.'],
  ['Facilities & site management', 'Accumulated legacy material', 'Years of stored material across a yard, warehouse or decommissioned site that has to be cleared, sorted and processed as a defined project.'],
];
const CHAIN = [
  ['Sealed collection', 'Material is loaded, secured and manifested at your site with item counts recorded against the agreed scope.'],
  ['Direct to processing', 'Consignments are directed to the nominated processing site without intermediate handling or resale exposure.'],
  ['Irreversible size reduction', 'Product is shredded or granulated to a state where the item cannot be reconstituted, identified or resold.'],
  ['Documented outcome', 'You receive processing records covering quantity, method and destination for each consignment.'],
];
const DOCS = ['Consignment manifest', 'Weighbridge records', 'Processing method statement', 'Diversion & recovery summary', 'Downstream destination record'];
const PROC = [
  ['Show us the material', 'Photographs, specifications, dimensions, approximate quantity, location and the outcome you need.', 'You: 10 minutes'],
  ['We assess it', 'Composition, contamination, handling requirements, processing options and realistic downstream pathways.', 'Us: 2 business days'],
  ['Trial or scope', 'Where the material warrants it, a controlled trial. Where it doesn’t, a direct scope — method, logistics, cost, outputs and reporting.', 'Us: 2–6 weeks'],
  ['We process', 'Material is processed to the agreed method and directed to the agreed recovery or disposal pathway.', 'Per agreed schedule'],
  ['We report', 'Quantities, method, recovery outcome and destination — in a form your reporting can actually use.', 'On completion / monthly'],
];
const CASES: [string, string, React.ReactNode][] = [
  ['Bedding manufacturer', 'We generate rejected pocket springs and foam offcuts every week and it’s all going to landfill.', <>SHRED assesses whether the stream can be separated at volume and converted into a <strong>recurring, costed processing program</strong> with monthly recovery reporting — rather than a weekly waste charge that grows with the levy.</>],
  ['Manufacturer — defective product', 'We have multiple pallets of product that failed QA and cannot be sold or reworked.', <>SHRED assesses the product’s construction and develops a <strong>destruction and separation plan</strong> that renders the item unusable, recovers what can be recovered, and documents the outcome for your quality and legal teams.</>],
  ['Retailer / distributor', 'This range is discontinued. It cannot end up on a marketplace with our logo on it.', <>SHRED runs the project under a <strong>controlled chain of custody</strong>, with irreversible size reduction and consignment-level records — so removal from circulation is evidenced, not assumed.</>],
  ['Industrial site', 'We’ve accumulated years of mixed material across the yard and no one will quote it.', <>SHRED assesses the site material as a <strong>defined clearance and processing project</strong> — sorting, size reduction, logistics and recovery pathways scoped and priced before work begins.</>],
];
const GIVES = [
  ['Method, not just machinery', 'Preparation, processing and post-processing designed as one pathway.'],
  ['Downstream that already exists', 'Recovered fractions directed to established outlets rather than stockpiled.'],
  ['Operational scale', 'Capacity to take on recurring contract volume, not only one-off batches.'],
  ['A straight answer', 'If your material has no viable pathway, we say so at assessment stage.'],
];
const PLANT = [
  ['825 TDS twin-shaft shredder', 'Primary size reduction'],
  ['820 TD15 twin-shaft shredder', 'Primary size reduction'],
  ['Non-ferrous baler', 'Metal fraction baling'],
  ['Cardboard baler', 'Fibre baling'],
  ['Plastic baler', 'Polymer baling'],
  ['Cable granulators', 'Cable processing & copper recovery'],
];

function Head({ n, a, b }: { n: string; a: string; b: string }) {
  return (
    <div className="sechead rv">
      <span><b>{n}</b>{a}</span>
      <span>{b}</span>
    </div>
  );
}

export default function Page() {
  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <header className="top">
        <div className="hazard" aria-hidden="true" />
        <div className="wrap nav">
          <a className="brand" href="#line" aria-label="SHRED — a Recycle Group brand">
            <span className="logo">SHR<span>E</span>D</span>
            <span className="endorse">A <b>RECYCLE GROUP</b><br />BRAND</span>
          </a>
          <nav className="navlinks" aria-label="Primary">
            <a href="#problem">The problem</a>
            <a href="#capability">Capability</a>
            <a href="#custody">Chain of custody</a>
            <a href="#process">Process</a>
            <a href="#group">Recycle Group</a>
          </nav>
          <a href="#submit" className="btn btn-g btn-sm">Submit material</a>
        </div>
      </header>

      <main id="main">
        <LineScene />

        {/* ---------------- intro */}
        <section className="intro">
          <div className="intro-bg" aria-hidden="true"><div data-par="50" style={{ backgroundImage: `url(${img('hero-spring-steel.webp')})` }} /></div>
          <div className="wrap">
            <p className="statement rv">Standard recycling is built for predictable streams. <b>SHRED is built for the loads that fall outside them</b> — assessed on composition, trialled where it&rsquo;s warranted, and either given a workable process or a straight no.</p>
            <div className="stats">
              <div className="stat rv"><div className="n">5</div><div className="l">Processing sites,<br />Vic &amp; Qld</div></div>
              <div className="stat rv"><div className="n">2<small>days</small></div><div className="l">Initial assessment<br />response</div></div>
              <div className="stat rv"><div className="n">2–6<small>wks</small></div><div className="l">Trial to<br />agreed scope</div></div>
              <div className="stat rv"><div className="n">50:1</div><div className="l">EPS volume reduction,<br />up to</div></div>
            </div>
            <p className="finep rv">Every material is assessed before acceptance. No asbestos. No hazardous waste.</p>
          </div>
        </section>

        {/* ---------------- problem */}
        <section className="sec" id="problem">
          <div className="wrap">
            <Head n="01" a="The gap" b="Why difficult material stalls" />
            <div className="split">
              <h2 className="d1 rv">The material <span className="knock">nobody quotes.</span></h2>
              <div className="rv">
                <p>Waste contractors are set up for predictable streams. Clean cardboard. Sorted plastics. General waste. The moment a material is <b>bonded, oversized, contaminated or carrying your brand</b>, it falls outside the service. It gets quoted as landfill, or it doesn&rsquo;t get quoted at all.</p>
                <p>Meanwhile it sits in your racking, and the cost of it never appears on a waste invoice.</p>
              </div>
            </div>
            <div className="risks">
              {RISKS.map(([h, p], i) => (
                <article key={h} className="risk rv" style={{ transitionDelay: `${i * 70}ms` }}>
                  <span className="rn">0{i + 1}</span>
                  <h3>{h}</h3>
                  <p>{p}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <div className="band" role="img" aria-label="Compactor working mixed waste in a landfill cell">
          <div className="band-img" data-par="70" style={{ backgroundImage: `url(${img('landfill.webp')})` }} />
          <div className="band-shade" />
          <div className="wrap band-cap">
            <h3 className="rv">Where it otherwise ends: mixed waste, at the highest gate rate in the schedule.</h3>
            <span className="mono rv">Levies rise every year</span>
          </div>
        </div>

        {/* ---------------- who */}
        <section className="sec">
          <div className="wrap">
            <Head n="02" a="Who calls us" b="Six situations, one assessment" />
            <h2 className="d2 rv">If one of these is your week, we should talk.</h2>
            <div className="who">
              {WHO.map(([role, h, p], i) => (
                <article key={h} className="who-card rv" style={{ transitionDelay: `${(i % 3) * 70}ms` }}>
                  <span className="role">{role}</span>
                  <h3>{h}</h3>
                  <p>{p}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- capability */}
        <section className="sec cap" id="capability">
          <div className="wrap">
            <Head n="03" a="Processing capability" b="Input → method → output" />
            <div className="split end">
              <h2 className="d2 rv">What goes in.<br />What comes out.</h2>
              <div className="rv">
                <p>A list of accepted materials tells you nothing about whether yours can actually be processed. So here&rsquo;s the input, the method applied, and what comes out the other end.</p>
                <div className="keys"><span className="pill live">Established stream</span><span className="pill">Assessment / trial required</span></div>
              </div>
            </div>
            <Explorer />
            <div className="capfoot rv">
              <p>SHRED does not accept asbestos or hazardous waste. Material specifications, contamination limits and downstream pathways are confirmed per project before acceptance.</p>
              <a href="#submit" className="btn btn-o">My material isn&rsquo;t listed</a>
            </div>
          </div>

          <div className="wrap outhead">
            <h2 className="d2 rv">Out the other side.</h2>
            <p className="rv">Fractions a downstream buyer will actually take — not a mixed load headed for the gate.</p>
          </div>
          <div className="trip">
            {[
              ['out-copper.webp', 'Granulated copper pouring from a cable granulation line into a bulk bag', 'Granulated copper', 'Recovered from cable processing'],
              ['out-steel.webp', 'Shredded light-gauge steel fraction', 'Shredded steel fraction', 'Sized for downstream reprocessing'],
              ['out-eps.webp', 'Densified polystyrene blocks stacked for export', 'Densified EPS', 'Volume reduced up to 50:1'],
            ].map(([f, alt, b, s], i) => (
              <figure key={f} className="rv" style={{ transitionDelay: `${i * 90}ms` }}>
                <img src={img(f)} alt={alt} loading="lazy" />
                <figcaption><span className="mono">0{i + 1}</span><b>{b}</b><span>{s}</span></figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* ---------------- paper */}
        <div className="paper">
          <section className="sec" id="custody">
            <div className="wrap">
              <Head n="04" a="Chain of custody" b="For recalled, branded & defective product" />
              <div className="split top">
                <div className="sticky-col">
                  <h2 className="d1 rv">Gone, and <span className="knock">provable.</span></h2>
                  <p className="rv">With recalled, branded or defective product, the real risk is the product turning up again. The disposal cost is a footnote. SHRED runs these projects as a controlled chain, and what you get back is a documented outcome, not a weighbridge docket.</p>
                  <div className="why rv">
                    <p>Your quality, legal and sustainability people all want the same thing: <b>proof of what happened to it.</b> A weighbridge docket doesn&rsquo;t give them that. Processing records do.</p>
                  </div>
                </div>
                <div>
                  <h3 className="d3 rv">The controlled chain</h3>
                  <ol className="chain">
                    {CHAIN.map(([b, p], i) => (
                      <li key={b} className="rv"><i>0{i + 1}</i><div><b>{b}</b>{p}</div></li>
                    ))}
                  </ol>
                  <h3 className="d3 rv">What you receive</h3>
                  <ul className="docs rv">
                    {DOCS.map((d) => <li key={d}>{d}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <div className="marquee" aria-hidden="true">
            <div>
              {[0, 1].map((k) => (
                <span key={k}>Assess <i /> Trial <i /> Scope <i /> Process <i /> Report <i /> </span>
              ))}
            </div>
          </div>

          <section className="sec" id="process">
            <div className="wrap">
              <Head n="05" a="How it works" b="Five steps, each with a clock on it" />
              <div className="split end">
                <h2 className="d2 rv">Five steps.<br />Each on a clock.</h2>
                <p className="rv">You don&rsquo;t need a finished brief. A few photographs, a rough quantity and the outcome you&rsquo;re after are enough for us to tell you whether this is worth pursuing.</p>
              </div>
              <div className="proc">
                {PROC.map(([h, p, t], i) => (
                  <article key={h} className="rv">
                    <span className="pn">0{i + 1}</span>
                    <h3>{h}</h3>
                    <p>{p}</p>
                    <span className="time">{t}</span>
                  </article>
                ))}
              </div>
              <p className="procfoot rv">Submitting material for assessment does not confirm acceptance or guarantee a recovery outcome. Where no viable pathway exists, we will tell you that directly rather than take the material anyway.</p>
            </div>
          </section>

          <section className="sec" id="applications">
            <div className="wrap">
              <Head n="06" a="Applications" b="The calls we get" />
              <div className="cases">
                {CASES.map(([top, q, a], i) => (
                  <article key={top} className="case rv" style={{ transitionDelay: `${(i % 2) * 80}ms` }}>
                    <span className="top">{top}</span>
                    <p className="q">&ldquo;{q}&rdquo;</p>
                    <p className="a">{a}</p>
                  </article>
                ))}
              </div>
              <p className="casefoot rv">Illustrative applications. Every project is assessed individually.</p>
            </div>
          </section>
        </div>

        {/* ---------------- group */}
        <section className="group" id="group">
          <div className="group-bg" aria-hidden="true"><div data-par="60" style={{ backgroundImage: `url(${img('render-cutters.webp')})` }} /></div>
          <div className="wrap">
            <Head n="07" a="Backed by Recycle Group" b="Plant, method & downstream" />
            <div className="split top">
              <div>
                <h2 className="d1 rv">Anyone can buy a <span className="knock">shredder.</span></h2>
                <p className="rv">What&rsquo;s hard is knowing where the material goes once it comes out the other side. That&rsquo;s where most difficult-material projects fall over.</p>
                <p className="rv">SHRED is Recycle Group&rsquo;s specialist brand for customised commercial shredding and material processing. It draws on the group&rsquo;s shredding, granulation, crushing and size-reduction capability, and on established downstream relationships for the fractions that come out.</p>
              </div>
              <ul className="gives">
                {GIVES.map(([b, p]) => <li key={b} className="rv"><b>{b}</b>{p}</li>)}
              </ul>
            </div>
          </div>
          <div className="plantband">
            {[
              ['plant-crusher.webp', 'Terex Finlay tracked impact crusher working a concrete and rubble stockpile', 'Concrete & rock crushing', 'Nunjara Resources'],
              ['plant-grinder.webp', 'Terex Ecotec horizontal grinder shredding green waste, fed by a material handler', 'Green-waste shredding', 'Nunjara Bio Organics'],
              ['plant-screen.webp', 'Tracked screening plant and impact crusher producing graded aggregate stockpiles', 'Aggregate screening', 'Nunjara Resources'],
            ].map(([f, alt, b, em]) => (
              <figure key={f} className="rv"><img src={img(f)} alt={alt} loading="lazy" /><figcaption><b>{b}</b><em>{em}</em></figcaption></figure>
            ))}
          </div>
          <div className="wrap">
            <div className="plantlist rv">
              <div className="plantlist-head"><h3>Installed plant</h3><span>North Geelong site</span></div>
              <ul>
                {PLANT.map(([b, s], i) => <li key={b}><i>{String(i + 1).padStart(2, '0')}</i><b>{b}</b><span>{s}</span></li>)}
              </ul>
            </div>
          </div>
        </section>

        {/* ---------------- CTA */}
        <section className="cta" id="submit">
          <div className="wrap ctagrid">
            <div>
              <h2 className="d1 rv">What are you <span className="knock nw">stuck with?</span></h2>
              <p className="rv">You don&rsquo;t need a finished project brief. Tell us what the material is, roughly how much there is, where it sits and what outcome matters to you.</p>
              <p className="rv"><b>Photographs are the fastest place to start.</b> A clear photo of the material and one of the storage area usually tells us more than a page of description.</p>
              <div className="assure rv">We assess every submission before acceptance. If there&rsquo;s no technically or commercially viable pathway, we&rsquo;ll tell you at assessment stage — and where possible, point you at who can help.</div>
            </div>
            <SubmitForm />
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap">
          <div className="frow">
            <div>
              <span className="logo">SHR<span>E</span>D</span>
              <p className="fine">Industrial shredding &amp; material processing<br />A <span className="g">Recycle Group</span> brand</p>
            </div>
            <p className="fine">SHRED does not accept asbestos or hazardous waste. All material is assessed before acceptance. Submitting an enquiry does not confirm acceptance or guarantee a recovery outcome. Processing methods, outputs and downstream pathways are confirmed per project and are subject to what is safe, lawful, technically practical and commercially viable for the material.<br />© 2026 Recycle Group.</p>
          </div>
        </div>
        <div className="wordmark" aria-hidden="true">SHR<span>E</span>D</div>
      </footer>
      <Effects />
    </>
  );
}
