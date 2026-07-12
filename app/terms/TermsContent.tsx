export function TermsContent() {
  return (
    <article className="legal-doc">
      <h1>Terms of Service</h1>
      <p>Last updated: July 2026</p>

      <h2>Using GameOn</h2>
      <ul>
        <li>You must be 16 or older to use GameOn.</li>
        <li>
          You need a Google account to sign in and a contact handle (WhatsApp
          or Telegram) to join or host games.
        </li>
        <li>
          You are responsible for the accuracy of your profile information.
        </li>
      </ul>

      <h2>Hosting and joining games</h2>
      <ul>
        <li>
          Hosts are responsible for the games they create: accurate location,
          time, sport, and capacity.
        </li>
        <li>
          Joining a game is a commitment — cancel in advance if you cannot
          attend so your spot opens for others.
        </li>
        <li>
          Auto-approve and waitlist behaviour is described in{" "}
          <a href="/how">How GameOn works</a>.
        </li>
      </ul>

      <h2>Acceptable use</h2>
      <ul>
        <li>
          Do not create fake games, spam join requests, or misuse the contact
          sharing feature.
        </li>
        <li>
          Do not use GameOn for anything unlawful or harmful to other users.
        </li>
        <li>We may suspend accounts that violate these rules.</li>
      </ul>

      <h2>Content</h2>
      <p>
        Game titles, descriptions, and profile information you submit remain
        yours. By submitting them you grant us a licence to display them to
        other users as part of the service.
      </p>

      <h2>Service availability</h2>
      <p>
        GameOn is provided as-is. We do not guarantee uptime or that the
        service will be error-free. We may change or discontinue features at
        any time.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        GameOn is not liable for disputes or incidents arising from in-person
        sports events organised through the platform. Participate at your own
        risk and use common sense.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms. Continued use after changes are posted means
        you accept them.
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
