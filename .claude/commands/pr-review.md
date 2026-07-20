---
description: Tiefenprüfung eines Pull Requests vor dem Merge – Qualität, Security, UX, Clean Code, Architektur gegen CLAUDE.md. Aufruf: /pr-review <PR-Nummer>
model: sonnet
effort: max
---

Du prüfst einen Pull Request vor dem Merge. Ziel ist eine ehrliche, fundierte Einschätzung entlang fünf Dimensionen – keine Kosmetik-Kommentare, sondern Befunde, die tatsächlich mergerelevant sind.

**Eingabe:** `$ARGUMENTS` – eine PR-Nummer (z. B. `23`).

Falls kein Argument übergeben wurde: Frage den User nach der PR-Nummer und brich dann ab – er soll den Skill mit der Nummer neu aufrufen.

---

## Phase 1 – Kontext laden

Führe **parallel** aus:
1. `gh pr view $ARGUMENTS --json number,title,body,author,baseRefName,headRefName,files,additions,deletions,state`
2. `gh pr diff $ARGUMENTS` – der vollständige Diff.
3. `gh pr checks $ARGUMENTS` – CI-Status (Tests, Coverage, Lint).
4. Lies `CLAUDE.md` – Architektur, Konventionen, Teststrategie, Security- und Error-Handling-Vorgaben, UI-Design.

Merke dir Titel, Beschreibung, Branch-Namen, geänderte Dateien und den Diff-Inhalt.

---

## Phase 2 – Vergleichskontext holen

Spawne einen **Explore-Agenten** (subagent_type: `Explore`, Breadth: `medium`) mit folgendem Auftrag:

> PR #$ARGUMENTS ("$PR_TITLE") ändert diese Dateien: $GEÄNDERTE_DATEIEN. Finde für jede thematisch passende bestehende Implementierungen im **übrigen** Code (nicht im PR selbst), die als Vergleichsmaßstab dienen: analoge Routen/Server-Module, bestehendes Error-Handling-Pattern (`FileValidationError`), bestehende Test-Struktur, bestehende Paraglide-Message-Keys für ähnliche UI-Texte. Gib eine kompakte Liste mit Datei + Ein-Satz-Erklärung zurück, worin die Vergleichsstelle relevant ist.

Warte auf das Ergebnis. Es dient als Referenz, um Konsistenz zu beurteilen – nicht nur den Diff isoliert zu betrachten.

---

## Phase 3 – Review entlang der fünf Dimensionen

Prüfe den Diff systematisch gegen jede Dimension. Nutze konkret aus CLAUDE.md ableitbare Kriterien, keine generischen Floskeln:

1. **Qualität & Tooling** (siehe CLAUDE.md)
   - Unit-Tests vorhanden und sinnvoll (Vitest `client`/`server`-Trennung passend zum geänderten Code), jeder Test hat eine echte Assertion (`requireAssertions`). Kein hartes Coverage-Gate in CI, aber im Coverage-Report-Kommentar auf Regressionen achten.
   - Playwright/E2E nur bei kritischen Flows ergänzt, nicht wahllos.
   - pino-Logging statt `console.log`/`console.error`.
   - `FileValidationError` mit `userMessage` + Handler-Pattern (`fail(422/500, …)`, `catch (e: unknown)` mit `instanceof`-Verengung) bei neuen Fehlerpfaden; keine rohen Fehlermeldungen/Stacktraces an den Client durchgereicht.
   - Neue zip-/fit-/jpg-bezogene Parsing-Logik hat einen begleitenden Fixture unter `tests/fixtures/` (nicht nur synthetische In-Test-Buffer).
   - CI (`gh pr checks`) grün, insbesondere Unit- und E2E-Job.

2. **Security**
   - Neue Routen/Actions, die Auth voraussetzen, nutzen `requireUser(locals)` bzw. prüfen `locals.user`/`locals.session` – keine Prüfung vergessen.
   - Zip-/FIT-/JPG-Verarbeitung: Path-Traversal, Zip-Bomben, Decompression-Ratio-Bomben bedacht (das ist der Kernrisikobereich dieses Projekts, siehe `tests/fixtures/zip/*bomb*`, `*path-traversal*`).
   - Garmin-OAuth-Tokens bleiben verschlüsselt (`garmin/crypto.ts`) und werden nirgends im Klartext geloggt.
   - Datei-Größen-/Typ-Limits konsistent zu bestehenden `validate.ts`-Modulen, keine neuen Magic Numbers parallel dazu.
   - Bei neuen missbrauchsanfälligen Endpoints/Actions: `rateLimit.ts` (In-Memory-Sliding-Window) bzw. better-auths eigenes DB-Rate-Limiting bedacht.
   - `BASE_URL`/`trustedOrigins`-Annahmen (CSRF-Schutz) nicht durch neue Redirect-Logik unterlaufen.
   - Keine Secrets, Tokens oder Klartext-Passwörter im Code, in Logs oder Kommentaren.
   - Übliche OWASP-Basics: Parametrisierte Queries (Drizzle stellt das i. d. R. sicher – prüfen, ob rohes SQL umgangen wird), keine ungefilterte Ausgabe von User-Input in HTML.

3. **UX-Konsistenz**
   - Neue user-facing Strings laufen über `m.xxx()` aus `$lib/paraglide/messages`, nicht hartcodiert; **beide** `messages/en.json` und `messages/de.json` aktualisiert (Englisch ist Base-Locale, nicht nur Deutsch ergänzen).
   - Tailwind-Klassen konsistent zum bestehenden Stil (`src/routes/layout.css`), kein Ad-hoc-CSS daneben.
   - Neue Fehlermeldungen/Statustexte nutzen denselben Ton wie bestehende (`error_*`-Message-Keys als Vorlage).

4. **Clean Code**
   - Sprechende Namen, keine überflüssigen Kommentare (nur WHY bei nicht-offensichtlichen Constraints).
   - Keine premature Abstraktion, kein Scope-Creep über den PR-Zweck hinaus, keine toten Codepfade oder auskommentierten Reste.
   - Duplikation nur dort vermieden, wo es die Domäne rechtfertigt (nicht um jeden Preis DRY).

5. **Architektur**
   - Serverlogik bleibt unter `src/lib/server/**`, keine DB-/Garmin-/Krypto-Zugriffe direkt aus Komponenten oder `+page.svelte`.
   - Schema-Änderungen über Drizzle-Migration (`npm run db:generate`, committed – nicht `drizzle-kit push`).
   - Kein Monorepo/Workspace-Setup eingeführt (kein `packages/shared` o. ä.) – alles bleibt unter `src/` eines einzelnen Pakets.

---

## Phase 4 – Befunde melden

Melde die Ergebnisse über `ReportFindings`. Für jeden Befund:
- `category`: eine der fünf Dimensionen als kebab-case-Slug (`quality-tooling`, `security`, `ux-consistency`, `clean-code`, `architecture`).
- `file` + `line`: konkrete Stelle im Diff.
- `summary` + `failure_scenario`: was konkret schiefgeht oder schiefgehen könnte – kein „könnte man verbessern" ohne Konsequenz.
- `verdict`: `CONFIRMED` wenn im Diff eindeutig belegbar, `PLAUSIBLE` wenn eine begründete Vermutung ohne 100%ige Gewissheit.

Sortiere nach Schwere (mergeblockierend zuerst). Keine Befunde erfinden, um alle fünf Dimensionen künstlich zu befüllen – eine Dimension ohne Befund bleibt leer.

---

## Phase 5 – Ergebnis auf GitHub posten (optional)

Frage per `AskUserQuestion`, ob die Zusammenfassung als Kommentar auf den PR gepostet werden soll. Falls ja: `gh pr comment $ARGUMENTS --body "…"` mit einer kompakten Zusammenfassung der Befunde (gruppiert nach Dimension). Falls nein: Befunde bleiben nur im Chat.

**Niemals automatisch** `gh pr review --approve` oder `--request-changes` ausführen – die Merge-Entscheidung trifft der User.

---

## Grundsätze

- **Nur Beleg-basiert**: Bewerte den tatsächlichen Diff und existierenden Code, keine Spekulation über nicht vorhandenen Code.
- **Kein Kommentar ohne Bestätigung**: Nichts wird auf GitHub gepostet, ohne dass der User in Phase 5 zugestimmt hat.
- **Keine Merge-Entscheidung**: Der Skill bewertet, approved/blockiert aber nie selbst.
- **Kompakt**: Befunde als Stichpunkte mit Datei:Zeile-Bezug, kein Fließtext-Aufsatz.
