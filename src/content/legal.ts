import { company, contact } from "@/content/site";

export type LegalDoc = { updated: string; intro: string; sections: { title: string; paragraphs: string[] }[] };

const operator = `${company.name}, CUI ${company.cui}, Nr. Reg. Com. ${company.regCom}, EUID ${company.euid}, cu sediul în ${company.address}`;

export const termeni: LegalDoc = {
  updated: "8 octombrie 2026",
  intro: `Acești termeni reglementează utilizarea platformei ${company.brand} și achiziția cursurilor de formare oferite prin ea. Prin crearea unui cont sau prin plasarea unei comenzi confirmi că i-ai citit și că îi accepți.`,
  sections: [
    { title: "1. Cine suntem", paragraphs: [`Platforma este operată de ${operator}. Ne poți contacta la ${contact.email} sau la ${contact.phone}.`] },
    { title: "2. Ce oferim", paragraphs: ["Oferim cursuri de formare profesională pentru medici stomatologi, în format fizic, online sau hibrid. Pagina fiecărui curs afișează data, locația, programul, numărul maxim de participanți, lectorii și prețul."] },
    { title: "3. Contul de utilizator", paragraphs: ["Pentru a te înscrie ai nevoie de un cont. Datele introduse trebuie să fie reale și actuale. Ești responsabil/ă pentru păstrarea parolei și pentru activitatea din contul tău. Ne poți cere oricând ștergerea contului din secțiunea Profil."] },
    { title: "4. Înscriere, preț și plată", paragraphs: [
      "Prețurile sunt afișate în euro. Locul este rezervat după confirmarea plății. Dacă numărul de locuri al cursului este epuizat, înscrierea se blochează, iar tu te poți adăuga pe lista de așteptare.",
      "Poți plăti cu cardul, prin Stripe, sau prin transfer bancar, pe baza instrucțiunilor primite pe email. La transfer, locul se rezervă 2 zile lucrătoare (sâmbăta și duminica nu se numără), iar înscrierea se activează după ce plata este înregistrată. Dacă plata nu ajunge în termen, comanda se anulează automat și locul se eliberează.",
      "Reducerile (nivelul de membru, codurile de reducere, recomandările) nu se cumulează: se aplică cea mai avantajoasă. Punctele de fidelitate se pot folosi ca parte din plată, în limitele afișate la checkout.",
    ] },
    { title: "5. Program de fidelitate", paragraphs: ["Nivelurile Standard, Gold și Platinum, punctele câștigate, valabilitatea lor și avantajele fiecărui nivel sunt afișate în contul tău, la Program Gold. Condițiile pot fi modificate pentru viitor, cu anunț în cont. Punctele câștigate nu au valoare în numerar și nu se transferă."] },
    { title: "6. Facturare", paragraphs: ["Factura se emite pe datele de facturare introduse de tine la comandă, ca persoană fizică sau ca firmă. Verifică atent datele înainte de plată. Factura se trimite pe email și se poate descărca din cont."] },
    { title: "7. Anulare, rambursare și transfer de loc", paragraphs: ["Regulile de anulare, rambursare și transfer al locului sunt prezentate în Politica de rambursare și transfer de loc, disponibilă pe site. Drepturile tale de consumator, inclusiv dreptul de retragere acolo unde legea îl prevede, rămân neafectate."] },
    { title: "8. Desfășurarea cursurilor", paragraphs: [
      "Ne rezervăm dreptul de a modifica programul, locația sau lectorii dintr-un motiv justificat, anunțându-te cât mai devreme pe email și în cont. Dacă modificarea nu îți convine, poți cere rambursarea integrală.",
      "Dacă anulăm un curs, îți oferim rambursarea integrală sau un loc la o ediție ulterioară, la alegerea ta.",
      "Cursurile fizice se desfășoară în grupuri restrânse. Participarea se confirmă la sosire, prin înregistrarea prezenței.",
    ] },
    { title: "9. Adeverințe de participare", paragraphs: ["După confirmarea prezenței primești o adeverință cu număr unic, disponibilă în cont. Autenticitatea ei poate fi verificată public pe site, pe baza numărului."] },
    { title: "10. Conținut și proprietate intelectuală", paragraphs: ["Materialele cursurilor (prezentări, videoclipuri, protocoale, documente) sunt protejate de drepturile de autor și sunt destinate uzului tău personal. Nu ai voie să le copiezi, să le redistribui, să le înregistrezi sau să le publici fără acordul nostru scris."] },
    { title: "11. Caracterul educațional", paragraphs: ["Cursurile au scop de formare profesională. Nu garantăm un anumit rezultat clinic sau comercial. Ești singurul responsabil/ă pentru modul în care aplici cunoștințele dobândite în activitatea ta medicală."] },
    { title: "12. Conduită", paragraphs: ["Te rugăm să te porți respectuos față de lectori și colegi. Ne rezervăm dreptul de a refuza accesul sau de a exclude de la curs persoanele care perturbă desfășurarea activității sau încalcă acești termeni."] },
    { title: "13. Limitarea răspunderii", paragraphs: ["În limitele permise de lege, răspunderea noastră se limitează la valoarea cursului plătit. Nu răspundem pentru întreruperi ale platformei din motive independente de noi, precum defecțiuni ale furnizorilor de internet sau de plată."] },
    { title: "14. Date personale", paragraphs: ["Prelucrăm datele tale conform Politicii de confidențialitate și Politicii de cookies, disponibile pe site."] },
    { title: "15. Reclamații și soluționarea litigiilor", paragraphs: [`Poți trimite o reclamație la ${contact.email}. Revenim cu un răspuns în cel mult 30 de zile. Ca consumator, poți apela și la Autoritatea Națională pentru Protecția Consumatorilor (ANPC) sau la o entitate de soluționare alternativă a litigiilor (SAL).`] },
    { title: "16. Legea aplicabilă", paragraphs: ["Acești termeni sunt guvernați de legea română. Litigiile se soluționează pe cale amiabilă, iar în caz contrar de instanțele competente conform legii."] },
    { title: "17. Modificări", paragraphs: ["Putem actualiza acești termeni. Versiunea în vigoare este cea publicată pe site, cu data ultimei actualizări afișată sus. Comenzile plasate anterior rămân supuse termenilor de la data comenzii."] },
  ],
};

export const confidentialitate: LegalDoc = {
  updated: "8 octombrie 2026",
  intro: "Această politică explică ce date personale prelucrăm, de ce, cât timp le păstrăm și ce drepturi ai, conform Regulamentului (UE) 2016/679 (GDPR) și legislației române.",
  sections: [
    { title: "1. Operatorul datelor", paragraphs: [`${operator}. Contact pentru date personale: ${contact.email}, ${contact.phone}.`] },
    { title: "2. Ce date prelucrăm", paragraphs: [
      "Date de cont: nume, email, telefon, specializare, oraș, clinică, ani de experiență, parolă (stocată criptat, nu o putem citi).",
      "Date de facturare: nume sau denumirea firmei, CUI, număr de înregistrare, adresă.",
      "Date despre comenzi și participare: cursurile cumpărate, plăți, prezența la curs, adeverințe, progresul în lecții, evaluări și testimoniale, puncte de fidelitate, cereri de transfer.",
      "Date tehnice și de utilizare: pagini de curs vizitate de utilizatorii autentificați (număr de vizite), sesiunea de autentificare, tema aleasă.",
      "Nu stocăm datele cardului tău. Plata cu cardul este procesată de Stripe.",
    ] },
    { title: "3. De ce le folosim și pe ce bază legală", paragraphs: [
      "Executarea contractului: crearea contului, înscrierea la curs, procesarea plății, accesul la materiale, emiterea adeverinței (art. 6 alin. 1 lit. b).",
      "Obligații legale: emiterea și păstrarea facturilor și a documentelor contabile (art. 6 alin. 1 lit. c).",
      "Interes legitim: securitatea platformei, prevenirea fraudei, mesaje legate de comenzile și cursurile tale (reamintiri, programul cursului, evaluare), recomandări de cursuri apropiate de cele urmărite, cu posibilitatea de a te dezabona oricând (art. 6 alin. 1 lit. f).",
      "Consimțământ: publicarea evaluării tale ca testimonial, doar dacă bifezi acordul, retractabil oricând (art. 6 alin. 1 lit. a).",
    ] },
    { title: "4. Cui transmitem datele", paragraphs: [
      "Folosim furnizori care prelucrează datele în numele nostru: Supabase (baza de date și autentificare), Vercel (găzduirea site-ului), Stripe (plăți cu cardul), Resend (trimiterea emailurilor) și SmartBill (emiterea facturilor). Cu fiecare avem obligații de confidențialitate și protecția datelor.",
      "Unii furnizori pot prelucra date în afara Spațiului Economic European. În acest caz, transferul se face pe baza clauzelor contractuale standard ale Comisiei Europene sau a altor garanții prevăzute de GDPR.",
      "Datele pot fi transmise autorităților, când legea ne obligă. Nu vindem datele tale.",
    ] },
    { title: "5. Cât timp păstrăm datele", paragraphs: [
      "Datele contului: cât timp ai cont. La ștergerea contului, datele personale se șterg sau se anonimizează.",
      "Facturile și documentele financiare: perioada impusă de legislația contabilă și fiscală. Rămân păstrate chiar după ștergerea contului, fără a mai fi asociate numelui tău în sistemul nostru.",
      "Adeverințele: numărul rămâne verificabil, dar numele titularului se anonimizează la ștergerea contului.",
      "Emailurile de recomandări: până te dezabonezi.",
    ] },
    { title: "6. Drepturile tale", paragraphs: [
      "Ai dreptul de acces, rectificare, ștergere, restricționare, portabilitate și opoziție, precum și dreptul de a retrage consimțământul.",
      "Din contul tău, la Profil, poți descărca datele tale, le poți corecta și îți poți șterge contul. Pentru orice altă cerere ne poți scrie la adresa de contact. Răspundem în cel mult 30 de zile.",
      "Ai dreptul de a depune plângere la Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal (ANSPDCP), www.dataprotection.ro.",
    ] },
    { title: "7. Emailuri", paragraphs: ["Îți trimitem emailuri despre comenzi, plăți, programul cursului și materiale, necesare serviciului. Emailurile cu recomandări de cursuri conțin un link de dezabonare. Ne poți scrie oricând pentru a opri recomandările."] },
    { title: "8. Securitate", paragraphs: ["Aplicăm măsuri tehnice și organizatorice rezonabile: conexiuni criptate, acces restricționat pe roluri, jurnalizarea acțiunilor administrative și separarea datelor între utilizatori. Niciun sistem nu este însă complet lipsit de risc."] },
    { title: "9. Minori", paragraphs: ["Platforma se adresează profesioniștilor din domeniul medical. Nu colectăm intenționat date despre minori."] },
    { title: "10. Cookies", paragraphs: ["Folosim doar cookie-uri și stocare locală necesare funcționării platformei. Detalii în Politica de cookies."] },
    { title: "11. Modificări", paragraphs: ["Putem actualiza această politică. Versiunea în vigoare este cea publicată pe site, cu data ultimei actualizări afișată sus."] },
  ],
};
