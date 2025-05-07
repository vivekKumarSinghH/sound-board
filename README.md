# SoundBoard - Collaborative Jam Session Recorder

SoundBoard is a web application that allows musicians to create jam rooms, record audio loops, and collaborate in real-time.

## Features

- **Jam Room Management**: Create rooms with custom BPM, key signature, and invite collaborators with a unique room code.
- **Loop Recording**: Record high-quality audio loops up to 30 seconds directly in your browser with waveform visualization.
- **Track Mixer**: Mix and match loops with volume controls, mute/solo functionality, and effects to create the perfect sound.
- **Export Mixdown**: Combine all your loops into a single high-quality audio file that you can download and share.
- **User Authentication**: Secure login and signup system with JWT authentication.

## Deployment Instructions

### Deploy to Vercel

The easiest way to deploy SoundBoard is using Vercel:

1. Fork this repository to your GitHub account
2. Create a new project on [Vercel](https://vercel.com)
3. Import your forked repository
4. Add the following environment variable:
   - `JWT_SECRET`: A secure random string for JWT token generation
5. Deploy the project

### Environment Variables

- `JWT_SECRET`: Required for JWT token generation and verification

## Data Storage

SoundBoard uses file-based storage for simplicity:

- User data is stored in `data/users.json`
- Room data is stored in `data/rooms.json`
- Audio loops are stored in `data/loops/[roomId]/[loopId].wav`
- Loop metadata is stored in `data/loops/[roomId].json`

## Technologies Used

- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- shadcn/ui components
- Web Audio API
- JWT for authentication

## License

MIT
\`\`\`

Finally, let's create a simple deployment script to help with Vercel deployment:
