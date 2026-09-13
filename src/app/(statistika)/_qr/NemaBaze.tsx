import s from "@/app/(statistika)/_qr/Statistika.module.css";

export default function NemaBaze() {
  return (
    <main className={s.prijavaOkvir}>
      <div className={s.prijavaKartica}>
        <h1 className={s.naslov}>Baza nije povezana</h1>
        <p className={s.podnaslov}>
          Za QR statistiku treba baza. U Vercelu otvori projekat → <b>Storage</b> → <b>Supabase</b>, izaberi regiju <b>Frankfurt</b> i poveži je s ovim projektom. Vercel će sam
          dodati <code>POSTGRES_URL</code>. Nakon toga ponovo objavi stranicu (Redeploy).
        </p>
      </div>
    </main>
  );
}
