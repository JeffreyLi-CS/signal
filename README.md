# LockIn MVP

LockIn is a lightweight group chat prototype that tracks shared links and images, dedupes them, and resurfaces the best match when someone asks for it.

## Install

```bash
npm install
```

## Database setup

```bash
npm run db:push
npm run db:seed
```

## Run dev

```bash
npm run dev
```

Open `http://localhost:3000/chat`.

## Demo steps

1. Send a message with a link (e.g. `https://example.com/product`).
2. Send the same link again and watch the share count rise in the Shared panel.
3. Upload the same image twice and confirm it dedupes.
4. Ask "what was that link" and watch the bot resurface the top match.
