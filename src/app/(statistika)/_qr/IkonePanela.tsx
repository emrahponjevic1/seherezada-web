// ---------------------------------------------------------------------------
// IKONE NADZORNE PLOŠČE
//
// Drobne črtne ikone za meni, številke in gumbe. Ista mreža in debelina
// črte kot ikone gumbov na strani s povezavami (_linkovi/Ikone.tsx), da je
// vse videti kot en sistem. Barvo podedujejo (currentColor).
// ---------------------------------------------------------------------------

type Lastnosti = { velicina?: number };

function Okvir({ velicina = 20, children }: Lastnosti & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={velicina}
      height={velicina}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function IkonaPregled(p: Lastnosti) {
  return (
    <Okvir {...p}>
      <rect x="3.5" y="3.5" width="7" height="8" rx="2" />
      <rect x="13.5" y="3.5" width="7" height="5" rx="2" />
      <rect x="13.5" y="11.5" width="7" height="9" rx="2" />
      <rect x="3.5" y="14.5" width="7" height="6" rx="2" />
    </Okvir>
  );
}

export function IkonaQr(p: Lastnosti) {
  return (
    <Okvir {...p}>
      <rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1.5" />
      <rect x="14" y="3.5" width="6.5" height="6.5" rx="1.5" />
      <rect x="3.5" y="14" width="6.5" height="6.5" rx="1.5" />
      <path d="M14 14h2.5v2.5H14zM18 18h2.5v2.5H18zM18 14h2.5M14 18v2.5" />
    </Okvir>
  );
}

export function IkonaLinktree(p: Lastnosti) {
  return (
    <Okvir {...p}>
      <rect x="4" y="3.5" width="16" height="4.5" rx="2.25" />
      <rect x="4" y="9.75" width="16" height="4.5" rx="2.25" />
      <rect x="4" y="16" width="16" height="4.5" rx="2.25" />
    </Okvir>
  );
}

export function IkonaPlus(p: Lastnosti) {
  return (
    <Okvir {...p}>
      <path d="M12 5v14M5 12h14" />
    </Okvir>
  );
}

export function IkonaOdjava(p: Lastnosti) {
  return (
    <Okvir {...p}>
      <path d="M14 4h3.5A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5H14" />
      <path d="M10 16.5 5.5 12 10 7.5M5.5 12H15" />
    </Okvir>
  );
}

export function IkonaVanjski(p: Lastnosti) {
  return (
    <Okvir {...p}>
      <path d="M14 4h6v6M20 4l-8.5 8.5" />
      <path d="M18 13.5V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4.5" />
    </Okvir>
  );
}

export function IkonaSken(p: Lastnosti) {
  return (
    <Okvir {...p}>
      <path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" />
      <path d="M4 12h16" />
    </Okvir>
  );
}

export function IkonaKlik(p: Lastnosti) {
  return (
    <Okvir {...p}>
      <path d="m9 9 11 4-4.8 1.8L13.4 20z" />
      <path d="M5.5 5.5 4 4M10 3.5V2M3.5 10H2M15.5 5 16.6 3.9M5 15.5l-1.1 1.1" />
    </Okvir>
  );
}

export function IkonaOsoba(p: Lastnosti) {
  return (
    <Okvir {...p}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c.9-3.5 3.7-5.5 7-5.5s6.1 2 7 5.5" />
    </Okvir>
  );
}

export function IkonaStrelica(p: Lastnosti) {
  return (
    <Okvir {...p}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </Okvir>
  );
}

export function IkonaNazad(p: Lastnosti) {
  return (
    <Okvir {...p}>
      <path d="M19 12H5M11 18l-6-6 6-6" />
    </Okvir>
  );
}

export function IkonaRucka(p: Lastnosti) {
  return (
    <svg viewBox="0 0 24 24" width={p.velicina ?? 18} height={p.velicina ?? 18} fill="currentColor" aria-hidden="true">
      <circle cx="9" cy="6" r="1.6" />
      <circle cx="15" cy="6" r="1.6" />
      <circle cx="9" cy="12" r="1.6" />
      <circle cx="15" cy="12" r="1.6" />
      <circle cx="9" cy="18" r="1.6" />
      <circle cx="15" cy="18" r="1.6" />
    </svg>
  );
}

export function IkonaOlovka(p: Lastnosti) {
  return (
    <Okvir {...p}>
      <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z" />
      <path d="m13.5 6.5 4 4" />
    </Okvir>
  );
}

export function IkonaKanta(p: Lastnosti) {
  return (
    <Okvir {...p}>
      <path d="M4 7h16M10 11v6M14 11v6" />
      <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </Okvir>
  );
}
