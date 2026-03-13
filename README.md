# Welcome to AI NEXUS 910+

## Project info

**URL** https://aiiinexus.lovable.app/

## How can I edit this code?
1. Edit the Code Using VS Code (Best Method)
Step 1: Install Required Software

Install these first:

Node.js → https://nodejs.org

Git → https://git-scm.com

VS Code → https://code.visualstudio.com

Step 2: Clone Your Project

Open Terminal / Command Prompt and run:

git clone https://github.com/YOUR_REPOSITORY_URL.git

Then go inside the folder:

cd YOUR_PROJECT_NAME
Step 3: Install Project Dependencies

Run:

npm install

This installs all required packages.

Step 4: Start the Development Server

Run:

npm run dev

Now open your browser:

http://localhost:5173

Your AI Nexus 910+ website will run locally.

Step 5: Edit the Code

Open the folder in VS Code.

Important folders:

src/
 ├ components
 ├ pages
 ├ App.tsx
 ├ main.tsx

Example edits:

Change Homepage

src/pages/Index.tsx

Edit Navbar

src/components/Navbar.tsx

Edit AI Chat UI

src/components/Chat.tsx
2. Edit Code Directly in GitHub (Easy)

Open your GitHub repository

Click the file you want to edit

Click the ✏ Edit button

Save and commit changes

3. Edit Using GitHub Codespaces (Cloud IDE)

Steps:

Open repository

Click Code

Select Codespaces

Click Create Codespace

Now you can edit code online.

4. Edit Styling (UI Design)

Your project uses Tailwind CSS.

Example:

<div className="bg-black text-white p-6 rounded-xl">

You can change:

colors

spacing

animations

layout

5. Important Files in Your Project
File	Purpose
App.tsx	Main app layout
main.tsx	App entry point
pages/	All website pages
components/	UI components
tailwind.config.ts	Styling settings
Example: Change Website Title

Open:

index.html

Edit:

<title>AI Nexus 910+</title>
What is this?


**Use your preferred IDE**
1. Install Required Tools

Before editing the code, install these tools:

Node.js (includes npm)
https://nodejs.org

Git
https://git-scm.com

IDE / Code Editor
Recommended: VS Code

2. Clone the Project Repository

Open Terminal / Command Prompt and run:

git clone <YOUR_GIT_REPOSITORY_URL>

This will download the AI Nexus 910+ project code to your computer.

3. Open the Project Folder

Navigate to the project directory:

cd <YOUR_PROJECT_NAME>

Then open it in your IDE.

Example for VS Code:

code .
4. Install Project Dependencies

Run this command inside the project folder:

npm install

This installs all required packages for the project.

5. Start the Development Server

Run:

npm run dev

After running this command, the terminal will show a local development URL, usually:

http://localhost:5173

Open it in your browser to see your AI Nexus 910+ website running locally.

6. Edit the Code

Now you can edit files inside the src folder.

Common files you may modify:

src/
 ├ components/   → UI components
 ├ pages/        → Website pages
 ├ App.tsx       → Main app layout
 ├ main.tsx      → Application entry point

For example:

Edit UI design

Add AI chat features

Add AI agents

Modify dashboard

Connect APIs

7. Save Changes

When you save a file, the Vite development server automatically reloads the page so you can see changes instantly.

8. Push Changes to GitHub

After editing, push your changes:

git add .
git commit -m "Updated AI Nexus 910+ features"
git push

Your updates will be saved to the repository.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS




