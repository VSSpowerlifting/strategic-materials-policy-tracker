"use client";

import { useState, useSyncExternalStore } from "react";
import { fi002Screens } from "@/lib/fi002";

const subscribe = () => () => {};

export function Fi002Screen() {
  const [selected, setSelected] = useState(0);
  const screen = fi002Screens[selected];
  const interactive = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  return (
    <div className="fi-screen">
      <fieldset>
        <legend className="fi-eyebrow">
          Compare capital-recovery scenarios
        </legend>
        <div className="fi-options">
          {fi002Screens.map((s, i) => (
            <label
              key={s.name}
              className={selected === i ? "fi-option fi-selected" : "fi-option"}
            >
              <input
                type="radio"
                name="screen"
                value={i}
                disabled={!interactive}
                checked={selected === i}
                onChange={() => setSelected(i)}
              />
              {s.name}
            </label>
          ))}
        </div>
        <noscript>
          <p className="fi-note">
            With JavaScript disabled, the base scenario is displayed. The table
            below lists all four scenarios.
          </p>
        </noscript>
      </fieldset>
      <div
        className="fi-screen-result"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <div>
          <p className="fi-eyebrow">Required production-equivalent benefit</p>
          <p className="fi-result">
            {screen.ktpa}
            <span> ktpa</span>
          </p>
          <p className="fi-screen-explanation">{screen.explanation}</p>
        </div>
        <dl className="fi-assumptions">
          <div>
            <dt>Gross capital</dt>
            <dd>{screen.capital}</dd>
          </div>
          <div>
            <dt>Long-term copper</dt>
            <dd>{screen.price}</dd>
          </div>
          <div>
            <dt>Benefit period</dt>
            <dd>{screen.years}</dd>
          </div>
          <div>
            <dt>Annual after-tax benefit</dt>
            <dd>{screen.benefit}</dd>
          </div>
        </dl>
      </div>
      <details className="fi-details">
        <summary>All four scenarios and assumptions</summary>
        <div
          className="fi-table-scroll"
          role="region"
          aria-label="Screen comparison"
          tabIndex={0}
        >
          <table>
            <caption>
              Capital-recovery scenarios. Required production-equivalent benefit in
              thousand tonnes per year (ktpa), rounded.
            </caption>
            <thead>
              <tr>
                <th scope="col">Scenario</th>
                <th scope="col">Benefit period</th>
                <th scope="col">Required ktpa</th>
              </tr>
            </thead>
            <tbody>
              {fi002Screens.map((s) => (
                <tr key={s.name}>
                  <th scope="row">{s.name}</th>
                  <td>{s.years}</td>
                  <td>{s.ktpa}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          End-2026 valuation origin; 10% nominal discount rate; five equal
          year-end capital draws in 2027–31; $4,000/t all-in net burden; 35%
          assumed cash-tax wedge. Price and contribution stay flat in nominal
          dollars. Ramp-up and terminal value are excluded. The workbook includes six
          selectable scenarios and additional sensitivities; these four tests
          explain duration, timing and combined stress.
        </p>
      </details>
      <p className="fi-note">
        Source: SMPT reverse appraisal,{" "}
        <a href="/research/fi002/threshold-sensitivities.csv" download>
          published sensitivity calculations (CSV)
        </a>
        . Equivalent benefit includes output preserved or added against no
        build. These scenarios estimate the annual benefit needed for capital
        recovery under the stated assumptions. A full project viability
        assessment requires a mine-wide with-build/no-build cash-flow model.
      </p>
    </div>
  );
}
