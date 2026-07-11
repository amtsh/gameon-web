export function HowContent() {
  return (
    <article className="how-doc">
      <h1>How GameOn works</h1>
      <p>
        GameOn is a map-based app for discovering and joining local pickup
        sports games, or hosting your own. Here is how the key behaviors work.
      </p>

      <h2>Finding games near you</h2>
      <ul>
        <li>
          The map centers on your location, using the best available source in
          this order: your device GPS, the postal code saved in your profile,
          an approximate location from your internet connection, then Stockholm
          as a fallback.
        </li>
        <li>
          We only ask for GPS permission when you tap &quot;Locate&quot; — never
          automatically. Your location is used for the current session only and
          is never saved.
        </li>
        <li>You see games within 25 km of that center.</li>
        <li>
          Games you host, joined, requested, or are waitlisted for always
          appear, even if they are farther away.
        </li>
        <li>
          Opening a shared game link shows that game regardless of distance.
        </li>
      </ul>

      <h2>Joining a game and waitlists</h2>
      <ul>
        <li>
          To join, you must be signed in and have a contact method (WhatsApp or
          Telegram) saved in your profile.
        </li>
        <li>
          When you request to join: if the game is full you go on the waitlist;
          if the host has turned on auto-approve you are approved instantly;
          otherwise the host reviews your request.
        </li>
        <li>You appear on the player roster only once you are approved.</li>
        <li>
          If an approved player leaves, their spot opens and the person who has
          waited longest is approved automatically.
        </li>
        <li>
          Withdrawing a request and leaving the waitlist are the same action,
          and you can request again later.
        </li>
        <li>Hosts cannot request to join their own game.</li>
      </ul>

      <h2>Sharing contact details</h2>
      <ul>
        <li>
          A host&apos;s contact details are shared only with the host&apos;s
          approved players.
        </li>
        <li>
          People still pending or on the waitlist cannot see the host&apos;s
          contact until they are approved.
        </li>
        <li>
          Anyone can see a game&apos;s player roster (names and skill levels),
          but never anyone&apos;s contact details beyond the rule above.
        </li>
      </ul>

      <h2>Hosting a game</h2>
      <ul>
        <li>Hosts set a capacity, and the app tracks how many have joined.</li>
        <li>
          &quot;Fill your spot&quot; adds the host as a player when they create
          the game.
        </li>
        <li>
          &quot;Auto approve requests&quot; approves join requests automatically
          until the game is full; after that, new requests go to the waitlist.
        </li>
      </ul>

      <h2>Good to know</h2>
      <ul>
        <li>
          Only upcoming games appear on the map. Past games are visible only to
          their host and players.
        </li>
        <li>The app updates in real time as people join, leave, or request.</li>
        <li>Sign-in is with Google.</li>
        <li>
          Privacy: only your name is visible to others. Your postal code,
          location, and contact details stay private until you approve sharing.
        </li>
        <li>
          The app suggests installing it only after you have joined or created a
          game.
        </li>
      </ul>
    </article>
  );
}
