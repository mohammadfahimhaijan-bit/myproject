# Lumen & Co. — Static Online Store

A modern shop built with plain HTML, CSS and JavaScript. No build step, no backend, works on GitHub Pages.

## Run it
Double-click `index.html`, or serve the folder: `python3 -m http.server` and open http://localhost:8000.

## Add product images
1. Put your photos in the `images/` folder (square photos, about 800×800, work best).
2. Name them `product1.jpg` … `product8.jpg`, or edit the `PRODUCTS` array at the top of `script.js` to match your file names.
3. If an image is missing, the shop shows a neutral placeholder instead of a broken icon.

To add a permanent product, add a new object to `PRODUCTS`. The "Add a test product" form only stores products temporarily in the browser tab (uploaded images are NOT sent to GitHub).

## Upload to GitHub
1. Create a repository at github.com/new (for example `store`).
2. Click **Add file → Upload files**, drag in `index.html`, `style.css`, `script.js`, `README.md` and the `images` folder, then **Commit changes**.

## Publish with GitHub Pages
1. Open the repository **Settings → Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**, select `main` and `/ (root)`, then **Save**.
3. After a minute your site is live at `https://YOUR-USERNAME.github.io/REPOSITORY-NAME/`.

## Customize
Store name, phone, email and address are in `index.html`. Colors are the CSS variables at the top of `style.css`.
