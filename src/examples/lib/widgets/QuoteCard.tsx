import RefreshIcon from "@mui/icons-material/Refresh";
import {
  AnimatedSwitcher,
  Card,
  CircularProgressIndicator,
  Column,
  CrossAxisAlignment,
  EdgeInsets,
  FutureBuilder,
  Icon,
  IconButton,
  Padding,
  Row,
  SizedBox,
  StatefulWidget,
  Text,
  TextButton,
  Theme,
} from "../../../index";

interface Quote {
  text: string;
  author: string;
}

const QUOTES: Quote[] = [
  { text: "Tout est widget.", author: "Flutter" },
  { text: "Le code le plus rapide est celui qui ne s'exécute pas.", author: "Anonyme" },
  { text: "Rendez-le juste, puis rapide.", author: "Kent Beck" },
];

/** Simule un appel API : 1 s d'attente, et une erreur une fois sur quatre. */
function fetchQuote(): Promise<Quote> {
  return new Promise((resolve, reject) =>
    setTimeout(() => {
      if (Math.random() < 0.25) reject(new Error("Le serveur ne répond pas."));
      else resolve(QUOTES[Math.floor(Math.random() * QUOTES.length)]!);
    }, 1000)
  );
}

/** Une citation chargée « depuis une API », avec FutureBuilder. */
export class QuoteCard extends StatefulWidget {
  private quote: Promise<Quote> | null = null;

  override initState() {
    // Créée ici, pas dans build() : sinon chaque reconstruction relancerait l'appel.
    this.quote = fetchQuote();
  }

  private reload() {
    this.setState(() => { this.quote = fetchQuote(); });
  }

  override build() {
    const colors = Theme.of().colorScheme;

    return Card({
      child: Padding({
        padding: EdgeInsets.all(16),
        child: FutureBuilder({
          future: this.quote,
          builder: (snapshot) => {
            const loading = snapshot.connectionState === "waiting";

            const content = snapshot.hasError
              ? Column({
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(`Erreur : ${(snapshot.error as Error).message}`, { style: { color: colors.error } }),
                    TextButton({ onPressed: () => this.reload(), child: "Réessayer" }),
                  ],
                })
              : snapshot.hasData
                ? Column({
                    crossAxisAlignment: CrossAxisAlignment.start,
                    spacing: 4,
                    children: [
                      Text(`« ${snapshot.data!.text} »`, { style: { fontStyle: "italic" } }),
                      Text(`— ${snapshot.data!.author}`, { style: { color: colors.onSurfaceVariant } }),
                    ],
                  })
                : Text("Chargement…", { style: { color: colors.onSurfaceVariant } });

            return Row({
              spacing: 12,
              children: [
                SizedBox({
                  width: 280,
                  child: AnimatedSwitcher({
                    duration: 250,
                    childKey: snapshot.hasError ? "error" : (snapshot.data?.text ?? "loading"),
                    child: content,
                  }),
                }),
                loading
                  ? SizedBox({ width: 40, child: CircularProgressIndicator({ size: 24 }) })
                  : IconButton({ icon: Icon(RefreshIcon), tooltip: "Autre citation", onPressed: () => this.reload() }),
              ],
            });
          },
        }),
      }),
    });
  }
}
