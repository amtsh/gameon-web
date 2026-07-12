export function PrivacyContent() {
  return (
    <article className="legal-doc">
      <h1>Privacy Policy</h1>
      <p>Last updated: July 2026</p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Account:</strong> your name and profile photo via Google
          Sign-In.
        </li>
        <li>
          <strong>Profile data:</strong> postal code, sports preferences, skill
          levels, and a WhatsApp or Telegram handle you choose to add.
        </li>
        <li>
          <strong>Game data:</strong> events you create, join requests you send
          or receive, and your player or host status on each game.
        </li>
        <li>
          <strong>Location:</strong> your device GPS only when you tap
          &quot;Locate me&quot; — it is used for that session only and never
          stored.
        </li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>Show nearby games on the map and manage join requests.</li>
        <li>
          Share your contact handle only with approved players of a game you
          host, and share the host&apos;s handle only with your approved players.
        </li>
        <li>Display your name and skill level on public game rosters.</li>
        <li>Authenticate you with Google OAuth.</li>
      </ul>

      <h2>What stays private</h2>
      <ul>
        <li>
          Your postal code, contact handle, and location are never visible to
          other users beyond the host/player sharing rule above.
        </li>
        <li>
          Pending or waitlisted players cannot see the host&apos;s contact
          details.
        </li>
      </ul>

      <h2>Data storage</h2>
      <p>
        Data is stored in Supabase (PostgreSQL) hosted in the EU. Session
        tokens are stored in secure HTTP-only cookies.
      </p>

      <h2>Third parties</h2>
      <ul>
        <li>
          <strong>Google OAuth</strong> — sign-in only; we receive your name
          and email.
        </li>
        <li>
          <strong>MapTiler / map tile provider</strong> — your browser fetches
          map tiles; no personal data is sent.
        </li>
        <li>We do not sell or share your data with advertisers.</li>
      </ul>

      <h2>Your rights</h2>
      <p>
        You can delete your account and all associated data at any time from
        your profile settings. For requests, contact us at the address in the
        app.
      </p>

      <h2>Contact</h2>
      <p>
        Questions? Open an issue on our{" "}
        <a
          href="https://github.com/amtsh/gameon-web"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub repository
        </a>
        .
      </p>
    </article>
  );
}
