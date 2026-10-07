# AgroVision UI

Build the frontend for a responsive website called AgroVision AI – AI-Based Crop Disease Detection.

Create a clean, modern green agricultural design with a professional but beginner-friendly look.

Pages:

Home – hero section with “Detect Crop Diseases Early with AI”, short description, and “Start Detection” button.

Detect Disease – upload/drag-and-drop crop leaf image, image preview, and “Analyze Image” button.

Scan History – show previous demo scans using localStorage.

About – explain AgroVision AI, how it works, and its purpose.

Add:

Responsive navbar with Home, Detect Disease, Scan History, About.

English/Hindi/Marathi language selector.

Mock disease analysis with crop name, disease name, confidence percentage, symptoms, and prevention tips.

Low-confidence message asking the user to upload a clearer image.

Clear disclaimer: this is an AI-based screening tool and not a replacement for agricultural experts.

Technical:

Use the existing React/TypeScript project structure and shadcn components.

Keep prediction logic inside src/services/diseaseDetection.ts.

Use localStorage only for demo scan history and language preference.

Do not connect Supabase or any real AI model yet.

Do not claim that the mock analysis is real AI.

Keep the UI polished, simple, and fully responsive.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://plant-doc-online.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/e23d2b31-dcde-49d0-b5e5-70b6de5c7a9c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
