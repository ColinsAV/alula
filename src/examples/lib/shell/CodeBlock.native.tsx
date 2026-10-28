import { ScrollView, Text as RNText, View } from "react-native";
import { StatelessWidget, Text, Theme } from "../../../index";

/** Du code source, en police à chasse fixe, qui défile horizontalement. */
export function CodeBlock(props: { code: string; label?: string }) {
  return CodeBlockView.new(props);
}

class CodeBlockView extends StatelessWidget<{ code: string; label?: string }> {
  override build() {
    const colors = Theme.of().colorScheme;
    return (
      <View style={{ gap: 6 }}>
        {this.props.label && Text(this.props.label, { style: { fontSize: 12, color: colors.onSurfaceVariant } })}
        <ScrollView
          horizontal
          style={{ borderRadius: 8, borderWidth: 1, borderColor: colors.outline, backgroundColor: colors.surfaceContainer }}
          contentContainerStyle={{ padding: 12 }}
        >
          <RNText style={{ fontFamily: "Menlo", fontSize: 12, lineHeight: 18, color: colors.onSurface }}>
            {this.props.code.trim()}
          </RNText>
        </ScrollView>
      </View>
    );
  }
}
