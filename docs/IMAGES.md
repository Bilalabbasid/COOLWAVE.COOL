# Blog images: how they work and how to make real ones

Every blog post has two pictures: a **featured** image at the top and an **inline** image in the article.
They live in `public/images/blog/` and are always 1200 × 630 pixels, WebP format.

What each picture should show is written in `content/image-prompts/<post-name>.json` (one file per post).
A small program reads those files and creates the pictures:

- **With an AI key** it asks an AI image service to draw each picture from its description.
- **Without a key** it draws a simple blue-and-teal wave graphic instead (a placeholder), so the site never shows a broken image.

You can start with placeholders and switch to real AI pictures at any time.

---

## Step 1: Get a Google Gemini key (free to create)

1. Go to <https://aistudio.google.com/apikey> and sign in with your Google account.
2. Click **Create API key**. Copy the long key it shows you.
3. Keep it private. Anyone with this key can use your Google account's image allowance (and billing, if you turn billing on).
   Do not paste it into a blog post, an email or a chat.

Image generation may need billing enabled on your Google AI Studio account. Check the pricing page in AI Studio before
running it on many posts; each post uses two images.

## Step 2: Put the key on your computer

The pictures are made on your computer, then uploaded with the rest of the site.

1. Open the project folder (`realcoolwave`).
2. Find the file called `.env.example`. Make a copy of it and name the copy **`.env.local`**
   (exactly that, starting with a dot).
3. Open `.env.local` in Notepad and paste your key after `GEMINI_API_KEY=`, with no spaces or quotes:

   ```
   GEMINI_API_KEY=AIzaSy...your key...
   ```

4. Save the file. `.env.local` is never uploaded to GitHub, so the key stays on your machine.

## Step 3: Make the pictures

Open a terminal in the project folder (in VS Code: **Terminal → New Terminal**) and run one of these:

| What you want | Type this |
|---|---|
| Make any pictures that are missing | `npm run images` |
| Replace **all** pictures (for example, swap placeholders for AI ones) | `npm run images -- --force` |
| Redo the pictures for one post only | `npm run images -- --force --only what-size-ac-do-i-need` |
| Make simple placeholder pictures (no key, no cost) | `npm run images:placeholders` |

The first line it prints says which service it is using, for example `Provider: Google Gemini (...)`.
Each picture then shows `ok`, `skip` (already exists) or `FAIL` with the reason. If one picture fails, the others still
get made; just run the same command again later to retry the missing ones.

**Important:** pictures that already exist are skipped. If your site currently has placeholders, add `--force` the first
time you use your key, otherwise nothing changes.

Look at the new files in `public/images/blog/`. If you dislike one, edit its description (`"prompt"`) in
`content/image-prompts/<post-name>.json` and run the "one post only" command above for that post.

## Step 4: Publish

The new pictures are ordinary files. Commit and push them with your normal publishing step (or ask your developer to),
and Vercel will deploy them with the site.

## Do I need to add the key to Vercel?

Not for today's setup: the pictures are made on your computer and uploaded as files, so Vercel never needs the key.

Only add it to Vercel if you later decide to generate images during Vercel builds. In that case:

1. Open your project on <https://vercel.com>, then **Settings → Environment Variables**.
2. Name: `GEMINI_API_KEY`. Value: your key. Leave **Sensitive** switched on.
3. Click **Save**, then redeploy (Deployments → the latest one → **Redeploy**).

Never add the key with a name that starts with `NEXT_PUBLIC_`; those values are visible to every visitor.

## Other AI services (optional)

If you prefer OpenAI or Replicate, put `OPENAI_API_KEY=...` or `REPLICATE_API_TOKEN=...` in `.env.local` instead.
The program uses the first key it finds, in this order: Gemini, OpenAI, Replicate. Leave the others empty.

## Troubleshooting

- **"API key not valid"**: the key was copied with a missing character or an extra space. Copy it again.
- **HTTP 429 / quota**: you hit your usage limit. Wait a while, or enable billing in Google AI Studio, then run again.
- **"Gemini returned no image"**: the description was refused or unclear. Reword the `"prompt"` and retry that post.
- **It used placeholders even though I added a key**: check the file is named exactly `.env.local`, sits in the main
  project folder (next to `package.json`), and the line starts with `GEMINI_API_KEY=`.
