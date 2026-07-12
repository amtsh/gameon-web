export function PrivacyContent() {
  return (
    <article className="legal-doc">
      <h1>Privacy Policy</h1>
      <p>Last updated: July 2026</p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Account:</strong> your name, email address, and profile photo
          via Google Sign-In. Your email is held by Supabase Auth and is never
          shown to other users.
        </li>
        <li>
          <strong>Profile data:</strong> postal code, coordinates derived from
          that postal code, sports preferences, skill levels, and a WhatsApp or
          Telegram handle you choose to add.
        </li>
        <li>
          <strong>Game data:</strong> events you create, join requests you send
          or receive, and your player or host status on each game.
        </li>
        <li>
          <strong>Location:</strong> your device GPS only when you tap
          &quot;Locate me&quot; — used for that session only and never stored.
        </li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>Show nearby games on the map and manage join requests.</li>
        <li>
          Share your contact handle only with players you approve on a game you
          host, and share the host&apos;s handle only with your approved players.
        </li>
        <li>
          Display your name and skill level on public game rosters. Player
          roster entries (name and skill level) for upcoming games are visible
          to anyone, including signed-out visitors.
        </li>
        <li>Authenticate you via Google OAuth.</li>
      </ul>

      <h2>What stays private</h2>
      <ul>
        <li>
          Your email address, postal code, coordinates, and contact handle are
          never visible to other users beyond the host/player sharing rule
          above.
        </li>
        <li>
          Pending or waitlisted players cannot see the host&apos;s contact
          details until they are approved.
        </li>
      </ul>

      <h2>Data retention</h2>
      <p>
        Your data is kept as long as your account is active. When you delete
        your account, your profile, sport preferences, join requests (including
        the contact handle stored in each request), and hosted games are
        deleted. Game records for events you participated in as a player are
        retained but your personal details are removed from them.
      </p>

      <h2>Data storage</h2>
      <p>
        Data is stored in Supabase (PostgreSQL). We do not sell or share your
        data with advertisers.
      </p>

      <h2>Third parties</h2>
      <ul>
        <li>
          <strong>Google OAuth</strong> — sign-in only; we receive your name,
          email, and profile photo.
        </li>
        <li>
          <strong>Map tile provider</strong> — your browser fetches map tiles
          directly; no personal data is attached to those requests.
        </li>
      </ul>

      <h2>Your rights</h2>
      <p>
        You can request access to, correction of, or deletion of your personal
        data at any time by emailing{" "}
        <a href="mailto:amtsh@pm.me">amtsh@pm.me</a>. Account deletion removes
        all data described above.
      </p>

      <h2>Contact</h2>
      <p>
        Privacy questions: <a href="mailto:amtsh@pm.me">amtsh@pm.me</a>
      </p>
    </article>
  );
}
