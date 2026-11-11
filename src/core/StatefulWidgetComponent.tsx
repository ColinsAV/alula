"use client";

import React, { useState, useEffect, useRef, ReactNode } from 'react';
import type { StatefulWidget } from './statefullWidget';

/**
 * Wrapper React pour utiliser StatefulWidget
 */
export function useStatefulWidget<T extends StatefulWidget<any, any>>(
  ComponentClass: new (props: any) => T,
  props: object = {}
): ReactNode {
  const instanceRef = useRef<T | null>(null);
  const [, setRenderTrigger] = useState({});

  // Créer l'instance une seule fois
  if (!instanceRef.current) {
    instanceRef.current = new ComponentClass(props);
    // Appelé après construction complète : les champs de la sous-classe sont déjà initialisés
    instanceRef.current.initState();
  }

  const instance = instanceRef.current;
  // Hot reload (Fast Refresh) : React garde le useRef, mais la classe a été remplacée.
  // On rattache l'instance à la nouvelle classe : le nouveau build() s'applique et
  // l'état (les champs) est conservé, comme le hot reload de Flutter. Les
  // initialiseurs des champs ajoutés ne sont pas rejoués, comme en Flutter.
  if (Object.getPrototypeOf(instance) !== ComponentClass.prototype) {
    Object.setPrototypeOf(instance, ComponentClass.prototype);
  }
  // Nouvelles props à chaque rendu du parent — comme `widget` en Flutter
  instance._setProps_internal(props);

  // Enregistrer le callback setState, cleanup au démontage.
  // _mount_internal : en StrictMode le cleanup est joué puis l'effet relancé.
  useEffect(() => {
    instance._mount_internal();
    instance._setStateCallback_internal(() => {
      setRenderTrigger({});
    });
    return () => {
      instance._dispose_internal();
    };
  }, [instance]);

  return instance.build();
}

/**
 * Composant wrapper React pour StatefulWidget
 */
export function StatefulWidgetComponent<T extends StatefulWidget<any, any>>({
  Component,
  props,
}: {
  Component: new (props: any) => T;
  props?: object;
}): React.ReactElement {
  return <>{useStatefulWidget(Component, props)}</>;
}
