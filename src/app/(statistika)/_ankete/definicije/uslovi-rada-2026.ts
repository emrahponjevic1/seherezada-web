import type { Anketa } from "../tipovi";

// ---------------------------------------------------------------------------
// ANKETA ZA EKIPO: DELOVNI POGOJI IN IZBOLJŠAVE (november 2026)
//
// Izvirnik je lastnikov (bosanščina). Ostali jeziki so prevodi istega
// besedila. Nemščina in italijanščina v vprašanjih tikata (du / tu), ker gre
// za sodelavce; turščina in slovenščina vikata kot izvirnik.
//
// ID-jev (zadovoljstvo, checklista, ...) NE spreminjaj, ko anketa že teče —
// v bazi so odgovori shranjeni pod njimi.
// ---------------------------------------------------------------------------

const anketa: Anketa = {
  slug: "uslovi-rada-2026",
  naziv: "Uslovi rada i unapređenje poslovanja (nov. 2026.)",
  verzija: 1,

  naslov: {
    bs: "Anketa o uslovima rada i unapređenju poslovanja",
    sl: "Anketa o delovnih pogojih in izboljšanju poslovanja",
    en: "Survey on working conditions and improving our business",
    de: "Umfrage zu Arbeitsbedingungen und zur Verbesserung unseres Betriebs",
    it: "Sondaggio sulle condizioni di lavoro e sul miglioramento dell'attività",
    tr: "Çalışma koşulları ve işletmenin iyileştirilmesi anketi",
  },

  uvod: {
    bs: "Poštovani članovi tima,\n\ncilj ove ankete je da čujemo vaše iskreno mišljenje o trenutnoj organizaciji posla, uslovima rada i stvarima koje vas muče na terenu. Želimo da zajedno unaprijedimo procese, olakšamo vam radni dan i pružimo bolju uslugu.\n\nAnketa je 100% anonimna. Molimo vas da budete maksimalno iskreni, jer nam je stalo do rješavanja problema, a ne do traženja krivaca.\n\nHvala vam na vremenu!",
    sl: "Spoštovani člani ekipe,\n\nnamen te ankete je slišati vaše iskreno mnenje o trenutni organizaciji dela, delovnih pogojih in stvareh, ki vas pri delu motijo. Skupaj želimo izboljšati postopke, vam olajšati delovni dan in nuditi boljšo storitev.\n\nAnketa je 100-odstotno anonimna. Prosimo, bodite čim bolj iskreni, saj nam gre za reševanje težav, ne za iskanje krivcev.\n\nHvala za vaš čas!",
    en: "Dear team members,\n\nthe aim of this survey is to hear your honest opinion about how work is currently organised, your working conditions and the things that bother you on the job. Together we want to improve our processes, make your working day easier and offer better service.\n\nThe survey is 100% anonymous. Please be as honest as you can — we care about solving problems, not about finding someone to blame.\n\nThank you for your time!",
    de: "Liebe Teammitglieder,\n\nmit dieser Umfrage möchten wir eure ehrliche Meinung zur aktuellen Arbeitsorganisation, zu den Arbeitsbedingungen und zu allem hören, was euch im Arbeitsalltag stört. Gemeinsam wollen wir Abläufe verbessern, euch den Arbeitstag erleichtern und besseren Service bieten.\n\nDie Umfrage ist zu 100 % anonym. Bitte seid so ehrlich wie möglich – uns geht es darum, Probleme zu lösen, nicht Schuldige zu suchen.\n\nDanke für eure Zeit!",
    it: "Cari membri del team,\n\ncon questo sondaggio vogliamo conoscere la vostra opinione sincera sull'attuale organizzazione del lavoro, sulle condizioni di lavoro e su ciò che vi crea difficoltà durante il servizio. Insieme vogliamo migliorare i processi, rendervi più facile la giornata lavorativa e offrire un servizio migliore.\n\nIl sondaggio è anonimo al 100%. Vi chiediamo di essere il più sinceri possibile: ci interessa risolvere i problemi, non cercare colpevoli.\n\nGrazie per il vostro tempo!",
    tr: "Değerli ekip arkadaşlarımız,\n\nbu anketin amacı; mevcut iş düzeni, çalışma koşulları ve iş başında sizi zorlayan konular hakkındaki dürüst görüşlerinizi duymaktır. Birlikte süreçleri iyileştirmek, iş gününüzü kolaylaştırmak ve daha iyi hizmet sunmak istiyoruz.\n\nAnket %100 anonimdir. Lütfen olabildiğince dürüst olun; bizim için önemli olan suçlu aramak değil, sorunları çözmektir.\n\nZaman ayırdığınız için teşekkür ederiz!",
  },

  sekcije: [
    // ---- 1 ----------------------------------------------------------------
    {
      naslov: {
        bs: "Atmosfera i opće zadovoljstvo",
        sl: "Vzdušje in splošno zadovoljstvo",
        en: "Atmosphere and overall satisfaction",
        de: "Arbeitsklima und allgemeine Zufriedenheit",
        it: "Clima e soddisfazione generale",
        tr: "Ortam ve genel memnuniyet",
      },
      pitanja: [
        {
          id: "zadovoljstvo",
          vrsta: "skala",
          obavezno: true,
          pitanje: {
            bs: "Koliko ste generalno zadovoljni svojim trenutnim poslom?",
            sl: "Kako ste na splošno zadovoljni s svojim trenutnim delom?",
            en: "Overall, how satisfied are you with your current job?",
            de: "Wie zufrieden bist du insgesamt mit deiner aktuellen Arbeit?",
            it: "Quanto sei soddisfatto/a, in generale, del tuo lavoro attuale?",
            tr: "Genel olarak şu anki işinizden ne kadar memnunsunuz?",
          },
          najnize: {
            bs: "Uopšte nisam zadovoljan",
            sl: "Sploh nisem zadovoljen/-a",
            en: "Not satisfied at all",
            de: "Überhaupt nicht zufrieden",
            it: "Per niente soddisfatto/a",
            tr: "Hiç memnun değilim",
          },
          najvise: {
            bs: "Jako sam zadovoljan",
            sl: "Zelo sem zadovoljen/-a",
            en: "Very satisfied",
            de: "Sehr zufrieden",
            it: "Molto soddisfatto/a",
            tr: "Çok memnunum",
          },
        },
        {
          id: "atmosfera",
          vrsta: "skala",
          obavezno: true,
          pitanje: {
            bs: "Kako biste ocijenili trenutnu atmosferu i odnose među kolegama u smjeni?",
            sl: "Kako bi ocenili trenutno vzdušje in odnose med sodelavci v izmeni?",
            en: "How would you rate the current atmosphere and the relationships between colleagues on your shift?",
            de: "Wie bewertest du die aktuelle Stimmung und das Verhältnis unter den Kollegen in deiner Schicht?",
            it: "Come valuti l'atmosfera attuale e i rapporti tra colleghi nel tuo turno?",
            tr: "Vardiyanızdaki mevcut ortamı ve iş arkadaşları arasındaki ilişkileri nasıl değerlendirirsiniz?",
          },
          najnize: { bs: "Jako loši", sl: "Zelo slabi", en: "Very poor", de: "Sehr schlecht", it: "Pessimi", tr: "Çok kötü" },
          najvise: { bs: "Odlični", sl: "Odlični", en: "Excellent", de: "Ausgezeichnet", it: "Ottimi", tr: "Mükemmel" },
        },
        {
          id: "sta_zadrzati",
          vrsta: "tekst",
          pitanje: {
            bs: "Šta vam se najviše sviđa u vezi sa radom ovdje? (Šta trebamo zadržati?)",
            sl: "Kaj vam je pri delu tukaj najbolj všeč? (Kaj naj ohranimo?)",
            en: "What do you like most about working here? (What should we keep?)",
            de: "Was gefällt dir an der Arbeit hier am meisten? (Was sollten wir beibehalten?)",
            it: "Cosa ti piace di più del lavoro qui? (Cosa dovremmo mantenere?)",
            tr: "Burada çalışmanın en çok hangi yönünü seviyorsunuz? (Neyi korumalıyız?)",
          },
        },
      ],
    },

    // ---- 2 ----------------------------------------------------------------
    {
      naslov: {
        bs: "Radni proces, predaja smjene i organizacija",
        sl: "Delovni proces, predaja izmene in organizacija",
        en: "Workflow, shift handover and organisation",
        de: "Arbeitsablauf, Schichtübergabe und Organisation",
        it: "Processo di lavoro, passaggio di turno e organizzazione",
        tr: "İş akışı, vardiya devri ve organizasyon",
      },
      pitanja: [
        {
          id: "predaja_smjene",
          vrsta: "skala",
          obavezno: true,
          pitanje: {
            bs: "Koliko ste zadovoljni trenutnim načinom na koji se odvija predaja smjene (stanje kase, zalihe, čistoća prostora)?",
            sl: "Kako ste zadovoljni s tem, kako trenutno poteka predaja izmene (stanje blagajne, zaloge, čistoča prostora)?",
            en: "How satisfied are you with the way shift handover currently works (cash register balance, stock, cleanliness)?",
            de: "Wie zufrieden bist du damit, wie die Schichtübergabe derzeit abläuft (Kassenstand, Vorräte, Sauberkeit)?",
            it: "Quanto sei soddisfatto/a di come avviene oggi il passaggio di turno (cassa, scorte, pulizia dei locali)?",
            tr: "Vardiya devrinin şu anki işleyişinden ne kadar memnunsunuz (kasa durumu, stoklar, alanın temizliği)?",
          },
          najnize: {
            bs: "Potpuni haos",
            sl: "Popoln kaos",
            en: "Complete chaos",
            de: "Totales Chaos",
            it: "Caos totale",
            tr: "Tam bir kaos",
          },
          najvise: {
            bs: "Odlično funkcioniše",
            sl: "Odlično deluje",
            en: "Works perfectly",
            de: "Funktioniert hervorragend",
            it: "Funziona benissimo",
            tr: "Mükemmel işliyor",
          },
        },
        {
          id: "checklista",
          vrsta: "izbor",
          obavezno: true,
          pitanje: {
            bs: "Da li biste podržali uvođenje kratke, standardizovane liste (checklist) za predaju smjene kako bi se izbjegli nesporazumi i prebacivanje krivice između smjena?",
            sl: "Bi podprli uvedbo kratkega, enotnega seznama (checklist) za predajo izmene, da se izognemo nesporazumom in prelaganju krivde med izmenami?",
            en: "Would you support introducing a short, standard checklist for shift handover to avoid misunderstandings and blame-shifting between shifts?",
            de: "Würdest du eine kurze, einheitliche Checkliste für die Schichtübergabe unterstützen, damit es weniger Missverständnisse und Schuldzuweisungen zwischen den Schichten gibt?",
            it: "Saresti favorevole a una breve checklist standard per il passaggio di turno, per evitare malintesi e scaricabarile tra i turni?",
            tr: "Vardiyalar arasında yanlış anlaşılmaları ve suçu birbirine atmayı önlemek için vardiya devrinde kısa, standart bir kontrol listesi (checklist) kullanılmasını destekler misiniz?",
          },
          opcije: [
            { id: "da", tekst: { bs: "Da", sl: "Da", en: "Yes", de: "Ja", it: "Sì", tr: "Evet" } },
            { id: "ne", tekst: { bs: "Ne", sl: "Ne", en: "No", de: "Nein", it: "No", tr: "Hayır" } },
            {
              id: "svejedno",
              tekst: {
                bs: "Svejedno mi je",
                sl: "Vseeno mi je",
                en: "I don't mind either way",
                de: "Ist mir egal",
                it: "Per me è indifferente",
                tr: "Fark etmez",
              },
            },
          ],
        },
        {
          id: "usko_grlo",
          vrsta: "tekst",
          pitanje: {
            bs: "Šta vas trenutno najviše usporava, umara ili frustrira tokom najvećih gužvi? (Gdje nastaje „usko grlo“?)",
            sl: "Kaj vas med največjimi gnečami trenutno najbolj upočasnjuje, utruja ali frustrira? (Kje nastane „ozko grlo“?)",
            en: "What slows you down, tires you out or frustrates you most during the busiest times? (Where is the bottleneck?)",
            de: "Was bremst, ermüdet oder frustriert dich zu den Stoßzeiten derzeit am meisten? (Wo entsteht der Engpass?)",
            it: "Cosa ti rallenta, ti stanca o ti frustra di più nei momenti di maggiore affluenza? (Dove si crea il «collo di bottiglia»?)",
            tr: "En yoğun saatlerde sizi şu anda en çok yavaşlatan, yoran veya sinirlendiren nedir? (Darboğaz nerede oluşuyor?)",
          },
        },
      ],
    },

    // ---- 3 ----------------------------------------------------------------
    {
      naslov: {
        bs: "Naručivanje robe i zalihe",
        sl: "Naročanje blaga in zaloge",
        en: "Ordering supplies and stock",
        de: "Warenbestellung und Vorräte",
        it: "Ordini della merce e scorte",
        tr: "Mal siparişi ve stoklar",
      },
      pitanja: [
        {
          id: "nestasica",
          vrsta: "izbor",
          obavezno: true,
          pitanje: {
            bs: "Da li se često dešava da vam usred smjene ponestane ključnih namirnica, ambalaže ili sitnog inventara?",
            sl: "Ali se pogosto zgodi, da vam sredi izmene zmanjka ključnih živil, embalaže ali drobnega inventarja?",
            en: "How often do you run out of key ingredients, packaging or small supplies in the middle of a shift?",
            de: "Wie oft gehen dir mitten in der Schicht wichtige Lebensmittel, Verpackungen oder Kleinmaterial aus?",
            it: "Ti capita spesso di rimanere senza ingredienti principali, imballaggi o piccola attrezzatura a metà turno?",
            tr: "Vardiyanın ortasında temel malzemelerin, ambalajın veya küçük demirbaşların bitmesi sık sık oluyor mu?",
          },
          opcije: [
            { id: "cesto", tekst: { bs: "Često", sl: "Pogosto", en: "Often", de: "Oft", it: "Spesso", tr: "Sık sık" } },
            { id: "ponekad", tekst: { bs: "Ponekad", sl: "Včasih", en: "Sometimes", de: "Manchmal", it: "A volte", tr: "Bazen" } },
            { id: "rijetko", tekst: { bs: "Rijetko", sl: "Redko", en: "Rarely", de: "Selten", it: "Raramente", tr: "Nadiren" } },
            { id: "nikada", tekst: { bs: "Nikada", sl: "Nikoli", en: "Never", de: "Nie", it: "Mai", tr: "Hiçbir zaman" } },
          ],
        },
        {
          id: "narucivanje_prijedlog",
          vrsta: "tekst",
          pitanje: {
            bs: "Imate li prijedlog kako da poboljšamo proces evidentiranja nedostataka i naručivanja robe, a da vas to minimalno ometa u radu?",
            sl: "Imate predlog, kako bi izboljšali beleženje manjkajočega blaga in naročanje, da bi vas to čim manj motilo pri delu?",
            en: "Do you have a suggestion on how to improve the way we note shortages and order supplies, with as little disruption to your work as possible?",
            de: "Hast du einen Vorschlag, wie wir das Erfassen von Fehlbeständen und das Bestellen verbessern können, ohne dich bei der Arbeit groß zu stören?",
            it: "Hai un suggerimento su come migliorare la registrazione di ciò che manca e gli ordini della merce, disturbandoti il meno possibile durante il lavoro?",
            tr: "Eksiklerin kaydedilmesi ve mal siparişi sürecini, işinizi en az şekilde aksatacak biçimde nasıl iyileştirebileceğimize dair bir öneriniz var mı?",
          },
        },
      ],
    },

    // ---- 4 ----------------------------------------------------------------
    {
      naslov: {
        bs: "Tehnologija i oprema (self-order kiosci)",
        sl: "Tehnologija in oprema (samopostrežni kioski)",
        en: "Technology and equipment (self-order kiosks)",
        de: "Technik und Ausstattung (Self-Order-Kioske)",
        it: "Tecnologia e attrezzature (chioschi self-order)",
        tr: "Teknoloji ve ekipman (self-order kiosklar)",
      },
      pitanja: [
        {
          id: "oprema",
          vrsta: "tekst",
          pitanje: {
            bs: "Postoji li neki dio opreme (aparati, monitori, kasa, sitni alat) koji vas trenutno usporava jer je zastario, nedostaje ili se često kvari?",
            sl: "Ali je kakšen del opreme (aparati, monitorji, blagajna, drobno orodje), ki vas trenutno upočasnjuje, ker je zastarel, ga ni ali se pogosto kvari?",
            en: "Is there any equipment (appliances, screens, cash register, small tools) that is slowing you down because it is outdated, missing or often breaks down?",
            de: "Gibt es Geräte oder Ausstattung (Maschinen, Bildschirme, Kasse, Kleinwerkzeug), die dich derzeit ausbremsen, weil sie veraltet sind, fehlen oder oft kaputtgehen?",
            it: "C'è qualche attrezzatura (apparecchi, monitor, cassa, piccoli utensili) che ti rallenta perché è vecchia, manca o si guasta spesso?",
            tr: "Eski olduğu, eksik olduğu ya da sık sık bozulduğu için sizi şu anda yavaşlatan bir ekipman (cihazlar, ekranlar, kasa, küçük aletler) var mı?",
          },
        },
        {
          id: "kiosk_pomoc",
          vrsta: "skala",
          obavezno: true,
          pitanje: {
            bs: "Koliko bi vam uvođenje „self-order“ kioska (gdje gosti sami kucaju i plaćaju narudžbe) olakšalo posao i smanjilo pritisak na kasi?",
            sl: "Koliko bi vam uvedba samopostrežnih kioskov (kjer gostje sami vnesejo in plačajo naročilo) olajšala delo in zmanjšala pritisk na blagajni?",
            en: "How much would self-order kiosks (where guests enter and pay for their own orders) make your job easier and reduce pressure at the till?",
            de: "Wie sehr würden Self-Order-Kioske (an denen Gäste selbst bestellen und bezahlen) dir die Arbeit erleichtern und den Druck an der Kasse verringern?",
            it: "Quanto ti faciliterebbero il lavoro e ridurrebbero la pressione alla cassa i chioschi self-order (dove i clienti ordinano e pagano da soli)?",
            tr: "Self-order kiosklar (misafirlerin siparişi kendilerinin girip ödediği) işinizi ne kadar kolaylaştırır ve kasadaki yükü ne kadar azaltır?",
          },
          najnize: {
            bs: "Nimalo ne bi pomoglo",
            sl: "Sploh ne bi pomagalo",
            en: "Wouldn't help at all",
            de: "Würde gar nicht helfen",
            it: "Non aiuterebbe per niente",
            tr: "Hiç yardımcı olmaz",
          },
          najvise: {
            bs: "Jako bi pomoglo",
            sl: "Zelo bi pomagalo",
            en: "Would help a lot",
            de: "Würde sehr helfen",
            it: "Aiuterebbe molto",
            tr: "Çok yardımcı olur",
          },
        },
        {
          id: "kiosk_izazov",
          vrsta: "tekst",
          pitanje: {
            bs: "Ukoliko bismo uveli pametno naručivanje putem kioska, šta mislite da bi bio najveći izazov za radnike u pripremi/kuhinji i kako to možemo riješiti?",
            sl: "Če bi uvedli pametno naročanje prek kioskov, kaj bi bil po vašem največji izziv za zaposlene v pripravi/kuhinji in kako ga lahko rešimo?",
            en: "If we introduced smart ordering through kiosks, what do you think would be the biggest challenge for staff in prep/the kitchen, and how could we solve it?",
            de: "Wenn wir smartes Bestellen über Kioske einführen würden: Was wäre deiner Meinung nach die größte Herausforderung für die Mitarbeiter in Vorbereitung/Küche, und wie können wir sie lösen?",
            it: "Se introducessimo gli ordini intelligenti tramite chioschi, quale pensi sarebbe la sfida più grande per chi lavora in preparazione/cucina e come potremmo risolverla?",
            tr: "Kiosk üzerinden akıllı sipariş sistemine geçersek, hazırlık/mutfakta çalışanlar için en büyük zorluk ne olur ve bunu nasıl çözebiliriz?",
          },
        },
      ],
    },

    // ---- 5 ----------------------------------------------------------------
    {
      naslov: {
        bs: "Bakšiš (tip box)",
        sl: "Napitnine (tip box)",
        en: "Tips (tip box)",
        de: "Trinkgeld (Tip-Box)",
        it: "Mance (tip box)",
        tr: "Bahşiş (bahşiş kutusu)",
      },
      pitanja: [
        {
          id: "baksis_pravednost",
          vrsta: "skala",
          obavezno: true,
          pitanje: {
            bs: "Koliko smatrate da je trenutni način prikupljanja i podjele bakšiša pravedan i transparentan prema svima u smjeni?",
            sl: "Kako pravičen in pregleden do vseh v izmeni se vam zdi trenutni način zbiranja in delitve napitnin?",
            en: "How fair and transparent do you think the current way of collecting and sharing tips is for everyone on the shift?",
            de: "Wie fair und transparent findest du die aktuelle Art, Trinkgeld zu sammeln und unter allen in der Schicht aufzuteilen?",
            it: "Quanto ritieni equo e trasparente, per tutti quelli del turno, l'attuale modo di raccogliere e dividere le mance?",
            tr: "Bahşişin şu anki toplanma ve paylaştırılma şeklini vardiyadaki herkes için ne kadar adil ve şeffaf buluyorsunuz?",
          },
          najnize: {
            bs: "Krajnje nepravedan",
            sl: "Povsem nepravičen",
            en: "Completely unfair",
            de: "Völlig unfair",
            it: "Del tutto ingiusto",
            tr: "Hiç adil değil",
          },
          najvise: {
            bs: "Potpuno pravedan",
            sl: "Povsem pravičen",
            en: "Completely fair",
            de: "Völlig fair",
            it: "Del tutto equo",
            tr: "Tamamen adil",
          },
        },
        {
          id: "baksis_prijedlog",
          vrsta: "tekst",
          pitanje: {
            bs: "Kako biste vi voljeli da se rješava pitanje bakšiša? (Imate li prijedlog za bolju podjelu?)",
            sl: "Kako bi želeli, da se ureja vprašanje napitnin? (Imate predlog za boljšo delitev?)",
            en: "How would you like tips to be handled? (Do you have a suggestion for a better way to share them?)",
            de: "Wie sollte das Thema Trinkgeld deiner Meinung nach geregelt werden? (Hast du einen Vorschlag für eine bessere Aufteilung?)",
            it: "Come vorresti che fosse gestita la questione delle mance? (Hai una proposta per una divisione migliore?)",
            tr: "Bahşiş konusunun nasıl çözülmesini istersiniz? (Daha iyi bir paylaşım için öneriniz var mı?)",
          },
        },
      ],
    },

    // ---- 6 ----------------------------------------------------------------
    {
      naslov: {
        bs: "Vaš glas (slobodni komentari)",
        sl: "Vaš glas (prosti komentarji)",
        en: "Your voice (open comments)",
        de: "Deine Stimme (freie Kommentare)",
        it: "La tua voce (commenti liberi)",
        tr: "Sizin sesiniz (serbest yorumlar)",
      },
      pitanja: [
        {
          id: "slobodno",
          vrsta: "tekst",
          najvise: 8000,
          pitanje: {
            bs: "Prostor za totalnu slobodu",
            sl: "Prostor za popolno svobodo",
            en: "Total freedom",
            de: "Raum für völlige Freiheit",
            it: "Spazio completamente libero",
            tr: "Tamamen özgür alan",
          },
          pomoc: {
            bs: "Vaš glas je presudan. Ovdje slobodno i bez ustručavanja napišite SVE što biste promijenili u našem načinu rada. Bilo da se radi o procedurama, meniju, odnosima sa nadređenima ili nečemu potpuno trećem – šta je to što bi vaš radni dan učinilo boljim?",
            sl: "Vaš glas je ključen. Tukaj sproščeno in brez zadržkov napišite VSE, kar bi spremenili pri našem načinu dela. Naj gre za postopke, meni, odnose z nadrejenimi ali kaj povsem drugega – kaj bi vaš delovni dan naredilo boljši?",
            en: "Your voice matters most. Feel free to write EVERYTHING you would change about the way we work — no holding back. Procedures, the menu, relationships with managers or something else entirely: what would make your working day better?",
            de: "Deine Stimme zählt. Schreib hier frei und ohne Zurückhaltung ALLES, was du an unserer Arbeitsweise ändern würdest – ob Abläufe, Speisekarte, das Verhältnis zu Vorgesetzten oder etwas ganz anderes. Was würde deinen Arbeitstag besser machen?",
            it: "La tua voce è decisiva. Scrivi qui liberamente e senza timori TUTTO ciò che cambieresti nel nostro modo di lavorare: procedure, menù, rapporti con i responsabili o qualcosa di completamente diverso. Cosa renderebbe migliore la tua giornata di lavoro?",
            tr: "Sesiniz çok önemli. Çalışma şeklimizde değiştirmek istediğiniz HER ŞEYİ burada çekinmeden yazın. Prosedürler, menü, yöneticilerle ilişkiler ya da bambaşka bir konu olabilir – iş gününüzü ne daha iyi hale getirirdi?",
          },
        },
      ],
    },
  ],
};

export default anketa;
