import {
  Column,
  CrossAxisAlignment,
  EdgeInsets,
  Padding,
  StatelessWidget,
  Text,
  TextButton,
  useNavigator,
} from "../../../index";

// Pas de `static route` : page empilée avec nav.push(DetailPage), sans URL.
export class DetailPage extends StatelessWidget {
  override build() {
    const nav = useNavigator();

    return Padding({
      padding: EdgeInsets.all(24),
      child: Column({
        crossAxisAlignment: CrossAxisAlignment.start,
        spacing: 16,
        children: [
          Text("Page poussée sans route : l'URL ne change pas."),
          TextButton({ onPressed: nav.pop, child: "← Retour" }),
        ],
      }),
    });
  }
}
