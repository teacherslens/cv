# Chris Davis — CV

Single-page CV with a PDF download. No build step, no dependencies.

## Files

| File | Purpose |
|---|---|
| `index.html` | The page. All CSS is inline — edit this one file. |
| `portrait.jpg` | Header photo, 440px, greyscaled by CSS. |
| `chris-davis-cv.pdf` | What the download button serves. Replace this file to update the download. |

## Publishing to GitHub Pages

1. Create a new **public** repository on GitHub. Name it `cv` (the site will live at `username.github.io/cv`) or name it `username.github.io` for a root-level address.
2. Upload all three files to the root of the repository — **Add file → Upload files**, drag them in, then **Commit changes**.
3. Go to **Settings → Pages**.
4. Under *Source*, choose **Deploy from a branch**. Set branch to `main` and folder to `/ (root)`. Click **Save**.
5. Wait one to two minutes, then reload the Settings → Pages screen. The published address appears at the top.

The first deploy can take a few minutes. Later edits go live within about a minute of committing.

## Updating

- **New PDF** — replace `chris-davis-cv.pdf`, keeping the filename identical. The button needs no change.
- **Text edits** — open `index.html` and edit directly on GitHub (pencil icon). The content is plain HTML; each job is an `<article class="role">` block.
- **Colours** — every colour is defined once at the top of the `<style>` block under `:root`. `--accent` is the green used for links and the download button.

## Notes

- Fonts load from Google Fonts. If that request fails the page falls back to system serif and sans — still readable, slightly less refined.
- The page has a print stylesheet that switches to black-on-white and hides the buttons, so a browser print gives something sane. The PDF is still the better artefact to send.
- Before sharing: confirm the two class-blog Google Docs are set to **anyone with the link → Viewer**.
