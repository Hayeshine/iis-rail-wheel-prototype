# AXIS rail wheel diagnostic interaction prototype

Prose word count: 892 (headings, this count line and fenced commands excluded; whitespace-separated).

## Scope and status

This Assignment 2 prototype continues Assignment 1 on overreliance on AI advice. It demonstrates diagnosis comparison, explanation use, independent checks and operator decisions in a simulated rail wheel line.

Implemented: a procedural Three.js scene, camera controls, motion pause, anomaly markers, four scenarios, two selectable candidates, an insufficient-evidence option, a Why dialog with scripted follow-ups, inspection request and acknowledgement, decision validation, a read-only recorded-decision summary, a suggested-workflow guide and JSON log export.

All geometry, readings, suggestions, explanations and inspection results are simulated. There is no live AI model or equipment connection. Viewing Why is not verification. Acknowledgement does not prove understanding or physical inspection. Bias reduction has not been demonstrated.

## Technology and project files

- HTML and CSS: interface structure and responsive navy styling.
- JavaScript: scenario state, controls, validation and logging.
- Three.js 0.170.0 and OrbitControls: illustrative 3D geometry and camera interaction, bundled in vendor/.
- src/model.js: fixtures and state rules.
- src/app.js: interface events and session log.
- src/scene.js: 3D display.
- tests/model.test.js: eight state-rule tests.
- tests/app.test.js: six application-handler tests using a small DOM adapter.
- assets/axis-mark.svg: original wheel-and-rail logo, also used as the favicon.
- DESIGN.md: design notes, course connections and evaluation limits.

Python serves static files only; this is not a Python or Streamlit application. Node.js is optional for tests.

## Run

Extract the project and open a terminal in the folder containing index.html:

```sh
python -m http.server 8080 --bind 127.0.0.1
```

Open http://localhost:8080 in Edge or Chrome. On Windows, use py instead of python if needed. Keep the terminal open; stop with Ctrl+C. Do not double-click index.html. If a directory listing appears, enter the project subfolder.

No API key, build, dependency installation or runtime internet is required. WebGL is needed for 3D; diagnostic controls remain available if rendering fails.

## Interaction

Select a scenario and mode, choose a diagnosis, and optionally open Why. Request a simulated inspection to display its finding, then acknowledge it separately. Reconsider the diagnosis, choose hold, escalate or release, enter a rationale and record the decision.

Guided mode requires both acknowledgements. Exploratory mode permits incomplete inspection and records that status. Both require a diagnosis choice, disposition and at least eight characters of rationale. Validation checks these conditions, not whether a diagnosis or release is justified. Release records a simulation only.

Changing scenario or mode, or resetting, starts a fresh case while retaining earlier session events. Recorded decisions are locked. A summary brings together the selected diagnosis, disposition, requested and acknowledged checks, and rationale. Incomplete verification is labelled explicitly. Resetting or changing the case clears the summary. Export JSON before refreshing: state and logs exist only in tab memory. Logs include case IDs, mode, explanation interactions, selections, inspection actions and decisions. They are not tamper-proof, and exported rationales contain the operator's text. Nothing is sent to a backend.

## Significant development changes

These changes are grouped by feature rather than GitHub upload or commit number. [DESIGN.md](DESIGN.md) explains the reasons, trade-offs and checks in more detail.

- **Technology and interaction rules:** The initial Python/Streamlit proposal changed to HTML/CSS/JavaScript and Three.js for spatial interaction. Unsupported percentages were removed. Diagnosis and disposition, and inspection requests and acknowledgements, became separate actions. Exploratory mode records skipped checks, and a fourth scenario provides counterevidence.
- **Explanation and layout:** The Why dialog groups evidence, uncertainty and fixed follow-ups. The navy interface was simplified by reducing decoration and displaying the course name.
- **Decision feedback:** A read-only summary groups the saved diagnosis, disposition, check counts and rationale. It preserves revised or uncertain choices and highlights incomplete verification.
- **Workflow and identity:** A suggested-workflow guide makes optional explanations and exploratory checks explicit. An original SVG wheel-and-rail logo replaces the sidebar mark and serves as the favicon.

## Checks and walkthrough evidence

Fourteen automated tests and JavaScript syntax checks passed. Eight tests cover state rules. Six application-handler tests cover guided completion, revised diagnoses, zero and partial checks, reset and case changes, agreement between the summary and JSON export, and optional workflow steps. Run from this folder with Node.js 18 or newer:

```sh
node --test
node --check src/app.js
node --check src/scene.js
```

I completed three walkthroughs using the current interface: guided hold, counterevidence escalation and exploratory escalation without checks. The screenshots in the separately submitted report show the workflow guide, original logo and recorded-decision summaries, including incomplete verification. Earlier checks also covered JSON export, keyboard operation and different screen sizes.

The DOM adapter checks application handlers, not native focus, layout or WebGL. The current screenshots document visible states; they do not establish comprehensive browser coverage, accessibility compliance or rendering performance. Earlier keyboard checks are not a separate audit of focus behaviour in the updated interface. No participant study has measured usability or bias reduction.

## Authorship, AI assistance and reused material

I led the project direction and design decisions, including the overall visual theme, the Why explanation popup, the page layout and the overall interaction logic. I reviewed the prototype, requested revisions and completed the browser walkthroughs illustrated in the storyboards. ChatGPT/Codex provided technical support with the Three.js digital twin visualisation, prototype implementation and testing. It also assisted with reviewing the report, refining wording and checking formatting and references. I retained responsibility for the final content and revisions.

Three.js and OrbitControls are reused libraries; their MIT licence is available in `vendor/LICENSE.three.txt`. The report’s references and citations were checked during preparation. Original course slides and Assignment 1 are not redistributed here.

## Report and submitted version

The project report is submitted separately. It includes the system diagram, three storyboards and development reflection. The report identifies the public repository, README and submitted commit. The repository contains the prototype source code, tests and development notes.
