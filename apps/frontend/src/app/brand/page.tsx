"use client";

import { useState, useEffect } from "react";

export default function BrandPage() {
  const [theme, setTheme] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme");
    }
    return null;
  });

  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("umtas-theme", next);
  }

  return (
    <div>
      <nav>
        <span>[sit logo hier]</span>
        <a href="#colours">Colours</a>
        <a href="#typography">Typography</a>
        <a href="#spacing">Spacing</a>
        <a href="#radius">Radius</a>
        <a href="#shadows">Shadows</a>
        <a href="#motion">Motion</a>
        <a href="#icons">Icons</a>
        <a href="#components">Components</a>
        <a href="#dos-donts">Dos &amp; Don&apos;ts</a>
        <button
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? "Moon" : "Sun"}
        </button>
      </nav>

      <main>
        <section id="hero">
          <span>[sit logo hier]</span>
          <h1>UMTAS</h1>
          <p>University Modular Timetable &amp; Analytics System</p>
          <p>Brand Style Guide · Version 2.0 · Team Vigil for Tyto Insights</p>
        </section>

        <section id="colours">
          <p>Colour</p>
          <h2>Colour System</h2>
          <div>
            <div>
              <h3>Light Mode</h3>
            </div>
            <div>
              <h3>Dark Mode</h3>
            </div>
          </div>
          <div>
            <span>Error</span>
            <span>Success</span>
            <span>Warning</span>
          </div>
        </section>

        <section id="typography">
          <p>Typography</p>
          <h2>Type Scale</h2>
          <div>
            <span>Display</span>
            <span>Heading 1</span>
            <span>Heading 2</span>
            <span>Heading 3</span>
            <span>Body</span>
            <span>Small</span>
            <span>Micro</span>
          </div>
        </section>

        <section id="spacing">
          <p>Spacing</p>
          <h2>Spacing Scale</h2>
          <div>
            {[
              "space-1",
              "space-2",
              "space-3",
              "space-4",
              "space-6",
              "space-8",
              "space-12",
            ].map((token) => (
              <div key={token}>
                <div />
                <span>{token}</span>
              </div>
            ))}
          </div>
        </section>

        <section id="radius">
          <p>Radius</p>
          <h2>Border Radius</h2>
          <div>
            {[
              "Cards",
              "Buttons",
              "Inputs",
              "Modals",
              "Badges",
              "Tooltips",
              "Grid cells",
            ].map((el) => (
              <div key={el}>
                <div />
                <span>{el}</span>
              </div>
            ))}
          </div>
        </section>

        <section id="shadows">
          <p>Shadows</p>
          <h2>Elevation</h2>
          <div>
            {["None", "Low", "Medium", "High"].map((level) => (
              <div key={level}>
                <p>{level}</p>
                <p>Placeholder text for shadow demo.</p>
              </div>
            ))}
          </div>
        </section>

        <section id="motion">
          <p>Motion</p>
          <h2>Motion Tokens</h2>
          <div>
            <button>Fast (150ms)</button>
            <button>Normal (250ms)</button>
            <button>Slow (400ms)</button>
          </div>
          <table>
            <thead>
              <tr>
                <th>Token</th>
                <th>Value</th>
                <th>Usage</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>fast</td>
                <td>150ms</td>
                <td>Micro-interactions</td>
              </tr>
              <tr>
                <td>normal</td>
                <td>250ms</td>
                <td>Standard transitions</td>
              </tr>
              <tr>
                <td>slow</td>
                <td>400ms</td>
                <td>Page-level transitions</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section id="icons">
          <p>Icons</p>
          <h2>Icon Set</h2>
          <div>
            {[
              "CalendarDays",
              "Clock",
              "MapPin",
              "BookOpen",
              "User",
              "Settings",
              "Bell",
              "Search",
              "ChevronDown",
              "ChevronRight",
              "X",
              "Check",
              "AlertCircle",
              "Info",
              "Moon",
              "Sun",
            ].map((name) => (
              <div key={name}>
                <span>16px</span>
                <span>20px</span>
                <span>{name}</span>
              </div>
            ))}
          </div>
        </section>

        <section id="components">
          <p>Components</p>
          <h2>Component Library</h2>

          <div>
            <div data-theme="light">
              <h3>Buttons — Light</h3>
              <button>Primary</button>
              <button>Secondary</button>
              <button>Ghost</button>
              <button>Destructive</button>
            </div>
            <div data-theme="dark">
              <h3>Buttons — Dark</h3>
              <button>Primary</button>
              <button>Secondary</button>
              <button>Ghost</button>
              <button>Destructive</button>
            </div>
          </div>

          <div>
            <div data-theme="light">
              <h3>Card — Light</h3>
              <div>
                <h4>Card heading</h4>
                <p>Body text inside a card component.</p>
                <span>Badge</span>
                <button>Action</button>
              </div>
            </div>
            <div data-theme="dark">
              <h3>Card — Dark</h3>
              <div>
                <h4>Card heading</h4>
                <p>Body text inside a card component.</p>
                <span>Badge</span>
                <button>Action</button>
              </div>
            </div>
          </div>

          <div>
            <div data-theme="light">
              <h3>Inputs — Light</h3>
              <label>
                Default
                <input placeholder="Placeholder" />
              </label>
              <label>
                Focus
                <input placeholder="Focused state" />
              </label>
              <label>
                Error
                <input placeholder="Error state" />
              </label>
            </div>
            <div data-theme="dark">
              <h3>Inputs — Dark</h3>
              <label>
                Default
                <input placeholder="Placeholder" />
              </label>
              <label>
                Focus
                <input placeholder="Focused state" />
              </label>
              <label>
                Error
                <input placeholder="Error state" />
              </label>
            </div>
          </div>

          <div>
            <h3>Weekly Schedule Grid</h3>
            <table>
              <thead>
                <tr>
                  <th></th>
                  <th>Mon</th>
                  <th>Tue</th>
                  <th>Wed</th>
                </tr>
              </thead>
              <tbody>
                {[
                  "08:00–09:00",
                  "09:00–10:00",
                  "10:00–11:00",
                  "11:00–12:00",
                ].map((slot) => (
                  <tr key={slot}>
                    <td>{slot}</td>
                    <td></td>
                    <td></td>
                    <td></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section id="dos-donts">
          <p>Usage</p>
          <h2>Dos &amp; Don&apos;ts</h2>
          <div>
            {[
              {
                do: "Use tone and weight for hierarchy",
                dont: "Add a blue accent to make something 'pop'",
              },
              {
                do: "SemiBold for headings only",
                dont: "Use Bold (700) or mix weights arbitrarily",
              },
              {
                do: "Use 4px-multiple tokens",
                dont: "Use arbitrary values like 13px or 22px",
              },
              {
                do: "Verb labels — 'Save changes'",
                dont: "Vague labels — 'Click here'",
              },
              {
                do: "'Module code not found. Try COS301.'",
                dont: "'An error occurred.'",
              },
              {
                do: "Pair every icon with a label or aria-label",
                dont: "Use a standalone icon with no description",
              },
            ].map((pair, i) => (
              <div key={i}>
                <div>
                  <span>Do</span>
                  <p>{pair.do}</p>
                </div>
                <div>
                  <span>Don&apos;t</span>
                  <p>{pair.dont}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
