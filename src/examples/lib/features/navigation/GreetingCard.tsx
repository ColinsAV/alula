import {
  BorderRadius,
  BoxDecoration,
  Column,
  Container,
  CrossAxisAlignment,
  EdgeInsets,
  FontWeight,
  StatelessWidget,
  Text,
  Theme,
} from "../../../../index";

type GreetingCardProps = {
  name: string;
  message?: string;
};

/** Un StatelessWidget simple : une carte de bienvenue. */
export class GreetingCard extends StatelessWidget<GreetingCardProps> {
  override build() {
    const { name, message = "Bienvenue !" } = this.props;
    const colors = Theme.of().colorScheme;

    return Container({
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration({ color: colors.primary, borderRadius: BorderRadius.circular(12) }),
      child: Column({
        crossAxisAlignment: CrossAxisAlignment.start,
        spacing: 4,
        children: [
          Text(`Bonjour ${name}`, { style: { fontSize: 20, fontWeight: FontWeight.bold, color: colors.onPrimary } }),
          Text(message, { style: { color: colors.onPrimary } }),
        ],
      }),
    });
  }
}
