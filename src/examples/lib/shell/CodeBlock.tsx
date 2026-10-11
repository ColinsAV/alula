import { StatelessWidget, Theme } from "../../../index";

/** Du code source, en police à chasse fixe (sans coloration pour l'instant). */
export function CodeBlock(props: { code: string; label?: string }) {
  return CodeBlockView.new(props);
}

class CodeBlockView extends StatelessWidget<{ code: string; label?: string }> {
  override build() {
    const colors = Theme.of().colorScheme;
    return (
      <figure style={{ margin: 0, minWidth: 0 }}>
        {this.props.label && (
          <figcaption style={{ fontSize: 12, color: colors.onSurfaceVariant, marginBottom: 6 }}>{this.props.label}</figcaption>
        )}
        <pre
          style={{
            margin: 0,
            padding: 16,
            overflowX: "auto",
            borderRadius: 8,
            border: `1px solid ${colors.outline}`,
            background: colors.surfaceContainer,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: 13,
            lineHeight: 1.5,
          }}
        >
          <code>{this.props.code.trim()}</code>
        </pre>
      </figure>
    );
  }
}
