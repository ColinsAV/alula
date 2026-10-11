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
} from "../../../index";

type GreetingCardProps = {
  name: string;
  message?: string;
};

export class GreetingCard extends StatelessWidget<GreetingCardProps> {
  override build() {
    const { name, message = "Bienvenue !" } = this.props;

    return Container({
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration({ color: "#635cee", borderRadius: BorderRadius.circular(12) }),
      child: Column({
        crossAxisAlignment: CrossAxisAlignment.start,
        spacing: 4,
        children: [
          Text(`Bonjour ${name}`, { style: { fontSize: 20, fontWeight: FontWeight.bold } }),
          Text(message),
        ],
      }),
    });
  }
}
