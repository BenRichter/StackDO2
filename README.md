# =DO · StackDO

**Nie wieder wählen, was als Nächstes kommt. Einfach machen.**

Todo-App (SvelteKit / Svelte 5), local-first & offline. Alle Aufgaben landen auf einem Stapel, ein Algorithmus sortiert – oben liegt genau **eine** Aufgabe: die nächste.

```sh
npm install
npm run dev     # http://localhost:5173
npm test        # Unit-Tests (Scoring, Tagesplan, Parser, Prognose)
npm run build   # statische App in ./build (PWA, offline-fähig)
```

## Konzept

- **Stränge** (Threads): Leben, Self Care, Familie, Arbeit … laufen parallel an einer Schnur. Reihenfolge = relative Priorität. Jede Aufgabe hängt an einem Strang.
- **Blocker**: Ein Strang kann ein Zeitfenster haben (Arbeit Mo–Fr 8–17 Uhr). Dann kommen seine Aufgaben nur darin – und haben dort Vorrang.
- **Stapel**: Score aus Strang-Rang, Wichtig (1–5), Dringend (Fälligkeit), Dauer (Quick Wins), Eat-the-Frog (morgens große wichtige Sachen), Flow (gleicher Strang) & Batch (gleiche Tags), Alter. „ⓘ“ auf der Karte zeigt warum.
- **Start/Stopp**: Timer pro Aufgabe → Fokus + echte Zeiten → bessere Schätzungen.
- **Tagesuhr**: 24h-Kreis mit Blockern, Plan ab jetzt und dem, was wirklich passiert ist.
- **Eisenhower-Matrix** (Stapel → Matrix): Sofort erledigen · Terminieren · Delegieren · Ignorieren – mit passender Aktion je Feld.
- **Ziele (SMART)** pro Strang, inkl. Stretch-Ziel. Das oberste Ziel steht über dem Stapel, jede Karte erinnert „Wofür“. „Ziel → Plan“ macht aus Schritten Aufgaben.

## Als App installieren

- Web-App (PWA): im Browser öffnen → Menü (Logo oben links) → **App installieren**, bzw. iOS Safari: Teilen → Zum Home-Bildschirm.
- Offline-fähig, eigenes Icon, Shortcuts per Long-Press aufs Icon: „Neue Aufgabe“, „Heute“.
- Hosting: `.github/workflows/deploy.yml` baut bei Push auf `main` und veröffentlicht auf GitHub Pages (einmalig: Repo → Settings → Pages → Source: *GitHub Actions*).

## Schnell-Eingabe

`Angebot an Tom #mail !4 30m morgen 14:00 +Arbeit`
`#tag` · `!1–!5` Wichtigkeit · `15m` / `1.5h` / `1h30` · `heute` / `morgen` / `übermorgen` / `mo`–`so` · `14:00` · `+Strang`

Tastatur: `N` neu · `/` Suche · `Leertaste` Timer · `M` Matrix · `1–4` Tabs · `Esc` Panel zu

## Feature-Status (aus der Ideenliste)

| Idee | Status |
|---|---|
| Stränge/Projekte anlegen, relativ priorisieren, Farben | ✅ |
| Aufgaben müssen Strang zugeordnet sein | ✅ |
| Sortierung per Algorithmus (Dauer, Strang, Eisenhower, Batch/Tags, Ziel-Deadline) | ✅ |
| Eisenhower-Matrix als Ansicht, Delegieren (mit Check-in) | ✅ |
| Strang-Farben abgestuft nach Wichtigkeit | ✅ |
| Ziele SMART + Stretch-Ziel, Erinnerung an Hauptziel, Ziel → Plan | ✅ |
| Logo „=DO“ (Streifen-Stapel als Burger-Menü oben links) | ✅ |
| Installierbare Web-App (PWA, PNG-Icons, Shortcuts, Install-Button) + Pages-Deploy | ✅ |
| Cleanes Design à la Sorted (große Titel, runde Checkboxen, Listen-Karten) | ✅ |
| Ansicht Stapel / Tag (runde Uhr mit Blöcken, Blocker Arbeit) / Stränge / Statistik | ✅ |
| Start/Stopp-Taste, Stoppuhr + Countdown, Vibration bei Überzug | ✅ |
| Prognose aus Keywords + echter Zeit, „wie lange wirklich?“ nach Erledigt | ✅ |
| Suche, Filter unten (Quick Wins ≤30m, <2h, Wichtig, Fällig, Strang) | ✅ |
| Wiederkehrende ausblenden | ✅ |
| Zurückstellen (15m, 1h, Abend, morgen, nächste Woche, warte auf …) + Verlauf | ✅ |
| Wiederkehrend (täglich, werktags, wöchentlich, monatlich, Gewohnheit mit Uhrzeit) | ✅ |
| Follow-up-Vorschlag nach Erledigt (bei #mail/#call vorausgewählt) | ✅ |
| Babysteps-Warnung > 2h + Aufteilen | ✅ |
| Kopieren, Löschen (mit Rückgängig), Notizen | ✅ |
| Default-Werte: Drop-up mit Vorlagen aus früheren Aufgaben | ✅ |
| Bearbeiten als Panel unten, kein Overlay | ✅ |
| Add-Button mittig, Linkshänder-Modus | ✅ |
| Settings: Arbeitszeit, Wachzeit, Animationen, Zitate | ✅ |
| Statistik Woche/Monat, Zeit pro Strang, Schätz-Faktor | ✅ |
| Erledigte nach 30 Tagen löschen (Statistik bleibt) | ✅ |
| Splashscreen, Zitate/Tipps, Tutorial als Todos | ✅ |
| Done-Animationen (Glow, Squash, Burn, Hammer + Konfetti/Feuerwerk – kurz, abschaltbar) | ✅ |
| Kalender-Export (.ics), Backup/Import (JSON) | ✅ |
| Offline (Service Worker, PWA installierbar), Dark Mode | ✅ |
| Sync zwischen Geräten (PouchDB/CouchDB) | ⏳ offen – aktuell nur lokal + Backup |
| Homescreen-Widget | ◐ PWA-Shortcuts statt Widget; echtes Widget braucht native App (Capacitor um `./build`) |
| Cordova/Angular-Setup, Excel-Prototyp, Scribble | ➖ entfällt – ersetzt durch SvelteKit-PWA |
