
You are a software architect and developer tasked with building App0.

App0 is a desktop application that users install on their machine. Its purpose is to allow users to generate and run small personal apps (“applets”) using AI — without coding, terminals, or installing anything else.

The user only installs App0. Everything else — app generation, installation, hosting, database setup, and launching — is handled inside App0. The user interacts only with a clean UI. Applets are not meant to be deployed for the internet but only for local personal use. So scalability is not a problem. Just clean and easy deployment for a user in their local machine inside the App0.
App0 will use only Nextjs and sqlite (if needed) to create the applets.

⸻

🧱 Goal of this prompt:

Build the first working version of App0 itself (not a user-generated applet).

⸻

💻 App0 Key Features:
	1.	Graphical Desktop App
	•	Built using Electron.
	•	GUI made with React or similar (the frontend of App0).
	•	Has a sidebar or home screen showing all the user’s apps.
	2.	Internal AI Agent
	•	On user request, it starts a guided prompt flow to gather requirements.
	•	Converts requirements to a spec.
	•	Sends that spec to OpenAI (or another model) with a strict generation prompt.
	•	Receives full code for the app (see App Structure below).
	3.	App Builder
	•	Creates a new folder for the app inside apps/APP_NAME/.
	•	Writes the received files (package.json, pages/, api/, db/, etc).
	•	Installs dependencies using bun (bundled with App0, so the user doesn’t install anything).
	•	Starts the app using bun dev or bun start, binding to a random localhost port.
	4.	App Runner
	•	Each generated app runs in the background (as a subprocess or background server).
	•	Its UI is embedded into App0 via iframe or webview.
	•	Each app is sandboxed and can’t access other apps’ files.
	5.	Optional Cloud Upload
	•	Users can optionally upload their apps to App0’s server.
	•	Others can browse public apps and launch/copy them inside their own App0.

⸻

📁 Project Structure of App0

App0/
├── core/              # AI logic, app generator, build runner
│   ├── ai/            # Prompt templates and GPT communication
│   ├── builder/       # File writer, bun installer, port allocator
│   ├── runner/        # Manages background app processes
│   └── registry.json  # Metadata of all apps
├── apps/              # All generated user apps
│   └── [app-name]/
├── runtime/           # Local bun binary, shared modules (optional)
├── gui/               # App0 frontend (React)
│   ├── AppList.tsx
│   ├── AppWindow.tsx
│   ├── CreateAppFlow.tsx
│   └── index.tsx
├── main.ts            # Electron entrypoint
├── package.json
└── README.md


⸻

🔧 Requirements for the AI in this prompt:

You must generate:
	1.	A complete project scaffold for App0, built in Electron.
	2.	The frontend GUI for App0 using React (Home screen, App list, App viewer, App creation flow).
	3.	Code to:
	•	Receive the app spec
	•	Send the spec to GPT-4 with a prompt template
	•	Receive a full Next.js app as file objects
	•	Write those files to apps/[app-name]/
	•	Run bun install and bun dev inside that folder
	•	Track running ports
	4.	A registry to store user apps and display them in the GUI.
	5.	Iframe embedding or a tabbed view to show running apps inside the App0 GUI.

⸻

✅ Constraints:
	•	All applets are Next.js apps with SQLite and Tailwind.
	•	App0 must embed a Bun runtime so users never install Node/npm.
	•	Everything must run locally unless the user chooses to upload.
	•	Do not include any CLI commands or ask for terminal usage.
	•	App0 must handle all file operations, subprocesses, AI calls internally.
	•	Focus on simplicity and modularity.

⸻

🧪 Example User Flow
	1.	User opens App0 and clicks “Create a new app”.
	2.	They fill out a form: “I want a markdown notes app with tags.”
	3.	App0 sends this to GPT with the pre-defined codegen prompt.
	4.	GPT returns the full code (files, package.json, etc).
	5.	App0:
	•	Writes it to apps/notes-app
	•	Runs bun install and bun dev
	•	Detects the port (e.g. 3456)
	•	Embeds the app via iframe
	6.	User now sees and uses their app instantly.

