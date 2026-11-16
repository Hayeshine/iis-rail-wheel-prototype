# AXIS rail wheel diagnostic interaction prototype

Prose word count: 808 (headings, this count line and fenced commands excluded; whitespace-separated).

## Scope and status

This Assignment 2 prototype continues Assignment 1 on overreliance on AI diagnostic recommendations. It demonstrates candidate selection, explanation use, independent inspection and operator decisions in a simulated rail wheel production setting.

Implemented: a procedural Three.js scene, camera controls, motion pause, anomaly markers, four scenarios, two selectable candidates, an insufficient-evidence option, a Why dialog with scripted follow-ups, inspection request and acknowledgement, decision validation and JSON log export.

Simulated: geometry, readings, baselines, diagnostic suggestions, explanations and inspection findings. There is no live AI model, industrial sensor integration or equipment control. Opening Why is not verification; acknowledging a result does not prove understanding or physical inspection. No reduction in automation bias has been demonstrated.

## Technology and project files

- HTML and CSS: interface structure and responsive navy styling.
- JavaScript: scenario state, controls, validation and logging.
- Three.js 0.170.0 and OrbitControls: illustrative 3D geometry and camera interaction, bundled in vendor/.
- src/model.js: fixtures and state rules.
- src/app.js: interface events and session log.
- src/scene.js: 3D display.
- tests/model.test.js: automated rule tests.
- DESIGN.md: design notes, course connections and evaluation limits.

Python serves static files only; this is not a Python or Streamlit application. Node.js is optional for tests.

## Run

Download and extract the repository, then open a terminal in the folder containing index.html:

```sh
python -m http.server 8080 --bind 127.0.0.1
```

Open http://localhost:8080 in Edge or Chrome. On Windows, use py instead of python if needed. Keep the terminal open; stop with Ctrl+C. Do not double-click index.html. If a directory listing appears, enter the project subfolder.

No API key, dependency installation, build or runtime internet access is required. WebGL is needed for 3D; the diagnostic controls remain available if rendering fails.

## Interaction

Select a scenario and mode, choose a diagnosis, and optionally open Why. Request a simulated inspection to display its finding, then acknowledge it separately. Reconsider the diagnosis, choose hold, escalate or release, enter a rationale and record the decision.

Guided mode requires both acknowledgements. Exploratory mode permits incomplete inspection and records that status. Both require a diagnosis choice, disposition and at least eight characters of rationale. Validation checks these conditions, not whether a diagnosis or release is justified. Release records a simulation only.

Changing scenario or mode, or resetting, starts a fresh case while retaining earlier session events. Recorded decisions are locked. Export JSON before refreshing: state and logs exist only in tab memory. Logs include case IDs, mode, explanation interactions, selections, inspection actions and decisions. They are not tamper-proof, and exported rationales contain the operator's text. Nothing is sent to a backend.

## Development record

The initial Python/Streamlit proposal was replaced by HTML/CSS/JavaScript and Three.js to provide spatial context with a small architecture.

Revision 2 aligned the prototype with Assignment 1: unsupported percentages were removed, diagnosis and disposition were separated, and inspection requests were distinguished from acknowledgements. Exploratory mode preserves skipped checking as an observable action. A fourth case introduces counterevidence rather than always supporting the first candidate.

Revision 3 introduced the Why dialog and prewritten follow-up questions. Revision 4 reduced decorative labels and glow effects after I requested a simpler navy interface. The course name replaced the earlier heading. These presentation changes did not alter verification rules.

## Checks and walkthrough evidence

During AI-assisted development, eight state-rule tests and JavaScript syntax checks passed. A DOM-adapter check exercised dialog handlers, candidate explanations, follow-ups, case changes and logging. Run the committed tests with Node.js 18 or newer:

```sh
node --test
node --check src/app.js
node --check src/scene.js
```

I subsequently operated and captured three browser walkthroughs:

- Guided verification: acknowledge both inspections and record a hold decision.
- Counterevidence: change from crack to contamination after cleaning removes the indication, then escalate.
- Incomplete verification: select insufficient evidence and record escalation with zero inspection requests and acknowledgements.

Screenshots show the rendered interface and these states. Automated browser launch previously failed; the DOM-adapter check does not establish native keyboard focus, cross-browser behaviour or WebGL performance. Export, camera controls and other interactions still require checks beyond the screenshot evidence. There is no participant study or measured usability improvement.

## Authorship, AI assistance and reused material

I led the project direction and design decisions, including the overall visual theme, the Why explanation popup, the page layout and the overall interaction logic. I reviewed the prototype, requested revisions and completed the browser walkthroughs illustrated in the storyboards. ChatGPT/Codex provided technical support with the Three.js digital twin visualisation, prototype implementation and testing. It also assisted with reviewing the report, refining wording and checking formatting and references. I retained responsibility for the final content and revisions.

Three.js and OrbitControls are reused libraries; their MIT licence is available in `vendor/LICENSE.three.txt`. The report’s references and citations were checked during preparation. Original course slides and Assignment 1 are not redistributed here.

## Report and submitted version

This public repository contains the prototype source and README. The report is prepared separately and includes the system diagram and three screenshot-based storyboards. The final report must identify this repository, README and submitted commit or release. The code ZIP is for transfer, not a replacement for the report or repository. No API keys are required or included.
