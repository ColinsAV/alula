import { createElement, type ReactElement, type ReactNode } from 'react';
import { StatefulWidgetComponent } from './StatefulWidgetComponent';

/**
 * StatefulWidget - Pattern Flutter en React
 *
 * Usage:
 * class MyPage extends StatefulWidget<State, Props> {
 *   initState() { this.count = 0 }
 *   build() {
 *     return <button onClick={() => this.setState({ count: this.count + 1 })}>
 *       {this.count}
 *     </button>
 *   }
 *   dispose() { // cleanup optionnel }
 * }
 *
 * Ce module n'appelle pas de hooks : il peut être importé côté serveur
 * (Next lit les `static route` des pages). Le rendu passe par
 * `StatefulWidgetComponent` (./StatefulWidgetComponent).
 */

export abstract class StatefulWidget<State extends object = {}, Props extends object = {}> {
    private _internalState: Record<string, any> = {};
  private _setStateCallback: ((state: any) => void) | null = null;
  private _mounted = true;
  protected props: Props;

  constructor(props: Props = {} as Props) {
    this.props = props;
  }

  // À implémenter par l'utilisateur
  /** Appelé une fois à la création, props disponibles. Facultatif, comme en Flutter. */
  initState(): void {}
  abstract build(): ReactNode;
  dispose?(): void;

  /**
   * Met à jour l'état et reconstruit. Deux formes :
   * - Flutter : `this.setState(() => { this.count++; })`
   * - objet   : `this.setState({ count: 1 })`
   */
   protected setState(updater: Record<string, any> | ((prev: any) => Record<string, any> | void)) {
    if (!this._mounted) return;
    const update = typeof updater === 'function' ? updater(this._internalState) : updater;
    this._internalState = { ...this._internalState, ...(update ?? {}) };
    if (this._setStateCallback) {
      this._setStateCallback(this._internalState);
    }
  }

  /**
   * Construit le widget dans un `build()`, comme le `new` facultatif de Dart :
   * `CounterPage.new({ step: 2 })`.
   */
  static new<P extends object>(
    this: new (props: P) => StatefulWidget<any, P>,
    ...args: {} extends P ? [props?: P] : [props: P]
  ): ReactElement {
    return createElement(StatefulWidgetComponent, { Component: this, props: args[0] });
  }

  _setStateCallback_internal(callback: (state: any) => void) {
    this._setStateCallback = callback;
  }

  _setProps_internal(props: Props) {
    this.props = props;
  }

  _mount_internal() {
    this._mounted = true;
  }

  _dispose_internal() {
    this._mounted = false;
    this.dispose?.();
  }
}
