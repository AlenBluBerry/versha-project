<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Application architecture
- Use separate TanStack leaf routes for each main page with shared header/footer and a language provider in the root; each page needs independently shareable metadata.
- Keep all demo prediction logic in src/services/diseaseDetection.ts; results must remain independent of uploaded image contents to avoid implying a real diagnosis.
- Store only scan history and language preference in browser localStorage, reading after hydration; compress scan photos before saving to reduce browser storage use.
- Keep multilingual display copy in the shared i18n module and translate disease details at display time so saved scans work in every supported language.
