# LockIn MVP

LockIn is a single-room chat MVP that tracks shared links and images, dedupes them, and resurfaces context when referenced.

## Install

```bash
npm install
```

## Database setup

```bash
cp .env.example .env
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
```

## Run dev server

```bash
npm run dev
```

Visit `http://localhost:3000/chat`.

## Demo steps

1. Send a message with a link (ex: `https://example.com/docs/lockin`).
2. Resend the same link and see share count increase in the Shared Panel.
3. Upload an image twice and see the image share count increase instead of duplicating.
4. Ask "what was that link" and watch the bot resurface the best match.
