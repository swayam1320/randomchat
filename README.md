# Driftline — a random text chat website (starter project)

This is a working random-chat site: click "Start", get paired with a random
stranger, chat, click "Next" to get someone new. It's plain Node.js +
Socket.io — no framework to learn, no database needed to start.

## What's in this folder

- `server.js` — the backend. Pairs people up and passes messages between them.
- `public/index.html` — the entire frontend (HTML + CSS + JS in one file).
- `package.json` — lists the two libraries the project needs (Express, Socket.io).

## 1. Run it on your own computer first

You need Node.js installed. If you don't have it: go to nodejs.org, download
the "LTS" version, install it like any normal program.

Then, in a terminal, inside this folder:

```
npm install
npm start
```

Open `http://localhost:3000` in two different browser tabs (or one normal +
one incognito window) — click "Start chatting" in both, and they'll pair with
each other. That's the whole app working locally, for free, before you spend
a rupee on hosting.

## 2. How it actually works (so it's not a black box)

- When a browser opens your site, it connects to the server over a
  "socket" — a live, always-open connection (this is what Socket.io gives you).
- The server keeps a waiting list. First person to click Start waits.
  Second person to click Start gets matched with them immediately.
- After that, any message one of them sends is just forwarded by the server
  to the other person's socket. The server doesn't store the conversation
  anywhere — closing the tab loses it, by design.
- Clicking "Next" tells the server to break the current pairing and put you
  back in the waiting line.

## 3. Put it online for free (no domain needed yet)

You don't need to buy hosting or a domain to get a real, shareable link.
**Render** has a free tier that runs a Node.js app like this directly from
GitHub:

1. Create a free GitHub account if you don't have one, and create a new
   repository. Upload this folder's files to it (GitHub's website lets you
   drag-and-drop files in the browser — no command line needed).
2. Create a free Render account (render.com) and sign in with GitHub.
3. Click "New" → "Web Service", pick the repository you just created.
4. Set:
   - Build command: `npm install`
   - Start command: `npm start`
5. Deploy. Render gives you a free URL like `driftline.onrender.com` —
   that's a real, working link you can send to anyone.

(Free tier note: the app "sleeps" after inactivity and takes a few seconds
to wake up on the next visit. That's fine for testing and sharing with
friends; you'd move to a paid tier only once you have real, regular traffic.)

## 4. Buying a domain later (optional, once you want a proper brand)

When you're ready for a real domain (e.g. `driftline.com`):

1. Buy it from a registrar — Namecheap or GoDaddy are common, usually
   $8–15/year for a `.com`.
2. In the registrar's DNS settings, add the custom-domain record Render
   gives you (Render's dashboard has a "Custom Domain" section that shows
   you exactly what to paste in).
3. Wait for DNS to propagate (can take up to a few hours) — then your
   domain points straight at your Render app.

## 5. Natural next steps once this feels solid

- Add a report/block button (important for a public chat site — you'll
  want some basic moderation before real strangers show up).
- Add video/voice chat using WebRTC (a bigger step up — the text pairing
  logic here is the foundation for it).
- Add simple abuse protection: rate-limit messages per socket, block
  obvious spam patterns.
- Move from "in-memory" queue (resets if the server restarts) to something
  more robust once you have real, sustained traffic.
