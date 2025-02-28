import type { Component, SetStateFunction, State } from 'solid-js';
import {
  createContext,
  useContext,
  splitProps,
  mergeProps,
  createSignal,
  createComputed,
} from 'solid-js';
import { createStore as createState } from 'solid-js/store';
import { Show } from 'solid-js/web';

type BaseObject = Record<string, any>;

type Effect = () => unknown | Promise<unknown>;

type GenerateStore<Store = {}, Actions = {}, Props = {}> = (options: {
  state: (props: Props) => Promise<Store> | Store;
  actions?: (set: SetStateFunction<Store>, get: State<Store>, props: Props) => Actions;
  effects?: (set: SetStateFunction<Store>, get: State<Store>, props: Props) => Effect[];
  props?: Props;
}) => Promise<
  readonly [
    State<Store>,
    Actions & {
      readonly set: SetStateFunction<Store>;
    },
  ]
>;

interface StateFn<Props, StateResult> {
  (props: Props): StateResult | Promise<StateResult>;
}

// https://stackoverflow.com/questions/48011353/how-to-unwrap-type-of-a-promise/49889856
type ThenArg<T> = T extends PromiseLike<infer U> ? U : T;

/**
 * Default Loader when the store is computing the initial state
 */
const DefaultLoader: Component = () => <p>Loading...</p>;

const generateStore: GenerateStore = async ({ state, actions, effects, props }) => {
  const finalStore = await state(props);
  const [get, set] = createState(finalStore);
  const finalActions = actions ? actions(set, get, props) : {};

  if (effects) {
    for (const effect of effects(set, get, props)) {
      createComputed(effect);
    }
  }

  return [get, { ...finalActions, set }] as const;
};

/**
 * @param options - A function An object describing your store
 * @returns [Provider, useProvider] - A tuple Provider/useProvider
 *
 * @example
 * ```tsx
 * const [Provider, useProvider] = createStore({
 *  state: () => ({ count: 0 }),
 *
 *  actions: (set) => ({
 *    increment = (by = 1) => set('count', c => c + by)
 *  })
 * })
 *
 * const App = () => {
 *  const [store, { increment }] = useStore()
 *
 *  return <button onClick={[increment, 1]}>{store.count}</button>
 * }
 *
 * const app = createApp(App)
 * app.use(Provider)
 * app.mount('#app')
 * ```
 */
export function createStore<
  Store extends BaseObject,
  Actions extends BaseObject,
  Props extends BaseObject
>({
  state,
  actions,
  props,
  effects,
}: {
  state: StateFn<Props, Store>;
  actions?: ReturnType<StateFn<Props, Store>> extends Promise<Store>
    ? (
        set: SetStateFunction<ThenArg<StateFn<Props, Store>>>,
        get: State<ThenArg<StateFn<Props, Store>>>,
        props: Props,
      ) => Actions
    : (set: SetStateFunction<Store>, get: State<Store>, props: Props) => Actions;
  props?: Props;
  effects?: ReturnType<StateFn<Props, Store>> extends Promise<Store>
    ? (
        set: SetStateFunction<ThenArg<StateFn<Props, Store>>>,
        get: State<ThenArg<StateFn<Props, Store>>>,
        props: Props,
      ) => Effect[]
    : (set: SetStateFunction<Store>, get: State<Store>, props: Props) => Effect[];
}) {
  type Return = readonly [
    State<Store>,
    Readonly<Actions> & {
      readonly set: SetStateFunction<Store>;
    },
  ];

  const Context = createContext<Return>();

  const Provider: Component<Partial<Props & { loader: any }>> = (providerProps) => {
    const finalProps = mergeProps(props || {}, providerProps);
    const [internal, external] = splitProps(finalProps, ['children']);
    const [value, setValue] = createSignal<Return>();

    generateStore({
      state,
      actions,
      effects,
      props: (external as unknown) as Props,
    }).then(setValue);

    return (
      // FIXME: This <Show> will break async SSR
      <Show when={!!value()} fallback={finalProps.loader || DefaultLoader}>
        <Context.Provider value={value()}>{internal.children}</Context.Provider>
      </Show>
    );
  };

  return [Provider, () => useContext(Context)] as const;
}
