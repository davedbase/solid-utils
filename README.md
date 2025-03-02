# solid-utils

The ultimate companion of all your [solid-js](https://github.com/ryansolid/solid) applications.

[Live demo](https://codesandbox.io/s/solid-utils-wo5w3)

## Table of content

- [solid-utils](#solid-utils)
  - [Table of content](#table-of-content)
  - [Features](#features)
  - [Installation](#installation)
  - [Usage](#usage)
    - [createGlobalState](#createglobalstate)
      - [Basic usage](#basic-usage)
    - [createGlobalSignal](#createglobalsignal)
      - [Basic usage](#basic-usage-1)
    - [createApp](#createapp)
      - [Basic usage](#basic-usage-2)
      - [With providers](#with-providers)
      - [With disposable app](#with-disposable-app)
    - [createStore](#createstore)
      - [Basic usage](#basic-usage-3)
      - [With default props](#with-default-props)
      - [With async default props](#with-async-default-props)
      - [With props](#with-props)

## Features

* [x] Tiny in size
* [x] Tree shakeable
* [x] Typescript ready
* [x] Growing and maturing
* [x] Used in various projects (mostly pet project)
* [x] Integrate 100% of [Skypack package best practices](https://docs.skypack.dev/package-authors/package-checks)
* [x] ES Module, Common JS & source export (solid specific) ready

* [ ] Doesn't entirely support SSR just yet
* [ ] Untested (programmatically) - Mostly because I didn't find a proper solution yet
## Installation

```bash
# npm
$ npm i solid-utils

# pnpm
$ pnpm add solid-utils

# yarn
$ yarn add solid-utils
```

## Usage

You can find examples that outline all the utilities in the [playground](./playground/index.tsx) file.

### createGlobalState

A wrapper around `createState` that allows you to declare it at the global level.
This essentially work by being managed in its own reactive context, removing the needs to be within your application.

Although this can be useful and seem to be the better approach, there's a reason this wasn't part of core.
This should act as an escape hatch for those who migrate from more permissive libraries such as `react`, `vue` or `svelte`.

This accept the exact same parameters than `createState` from `solid-js`.

#### Basic usage

```tsx
import { createGlobalState } from 'solid-utils';

const [state, setState] = createGlobalState({ count: 0 })

const Counter = () => <button onClick={() => setState('count', c => c + 1)}>{state.count}</button>

const App = () => {
  return <>
    <Counter />

    <div>
      The current value of count is: {state.count}
      I can increment <button onClick={() => setState('count', c => c + 1)}>here</button>
      or within my <code>`Counter`</code> component.
    </div>
  </>
}

render(App, document.getElementById('app'))
```

### createGlobalSignal

A wrapper around `createSignal` that allows you to declare it at the global level.
This essentially work by being managed in its own reactive context, removing the needs to be within your application.

Although this can be useful and seem to be the better approach, there's a reason this wasn't part of core.
This should act as an escape hatch for those who migrate from more permissive libraries such as `react`, `vue` or `svelte`.

This accept the exact same parameters than `createSignal` from `solid-js`.

#### Basic usage

```tsx
import { createGlobalSignal } from 'solid-utils';

const [count, setCount] = createGlobalSignal(0)

const Counter = () => <button onClick={() => setCount(count() + 1)}>{count()}</button>

const App = () => {
  return <>
    <Counter />

    <div>
      The current value of count is: {count()}
      I can increment <button onClick={() => setCount(count() + 1)}>here</button>
      or within my <code>`Counter`</code> component.
    </div>
  </>
}

render(App, document.getElementById('app'))
```

### createApp

A Vue 3 inspired app mounting bootstrapper that helps manage large list of global providers

#### Basic usage

```tsx
import { createApp } from 'solid-utils'

const App = () => <h1>Hello world!</h1>

createApp(App).mount('#app')
```

#### With providers

```tsx
const app = createApp(App)

app.use(RouterProvider)
app.use(I18nProvider, { dict })
app.use(GlobalStoreProvider)

app.mount('#app')

// [new in 0.0.4] - Those are also chainable
createApp(App)
  .use(RouterProvider)
  .use(I18nProvider, { dict })
  .use(GlobalStoreProvider)
  .mount('#app')
```

into something like that:

```tsx
render(
  <RouterProvider>
    <I18nProvider dict={dict}>
      <GlobalStoreProvider>
        <App />
      </GlobalStoreProvider>
    </I18nProvider>
  </RouterProvider>,
  document.querySelector('#app')
 )
 ```

 #### With disposable app

 Can be useful in tests or HMR

 ```tsx
const dispose = createApp(App).mount('#app')

if (module.hot) {
    module.hot.accept()
    module.hot.dispose(dispose)
}
 ```

### createStore

A small utility that helps generate Provider & associated hook

#### Basic usage

```tsx
const [Provider, useProvider] = createStore({
  state: () => ({ count: 0, first: 'Alexandre' }),

  actions: (set, get) => ({ 
    increment(by = 1) {
        set('count', count => count + 1)
    },
    dynamicFullName(last) {
        return `${get.first} ${last} ${get.count}`;
    }
  })
})

const Counter = () => {
  const [state, { increment, dynamicFullName }] = useProvider()

  // The count here will be synced between the two <Counter /> because it's global
  return <>
    <button onClick={[increment, 1]}>{state.count}</button>
    <h1>{dynamicFullName('Mouton-Brady')}</h1>
  </>
}

render(
  () => 
    <Provider>
      <Counter />
      <Counter />
    </Provider>,
  document.getElementById('app'),
)
```

#### With default props

```tsx
const [Provider, useProvider] = createStore({
  state: (props) => ({ count: props.count, first: 'Alexandre' }),

  actions: (set, get) => ({ 
    increment(by = 1) {
        set('count', count => count + 1)
    },
    dynamicFullName(last) {
        return `${get.first} ${last} ${get.count}`;
    }
  })

  props: { count: 1 }, // This will auto type the props above and the <Provider> component props
})

const Counter = () => {
  const [state, { increment, dynamicFullName }] = useProvider()

  // The count here will be synced between the two <Counter /> because it's global
  return <>
    <button onClick={[increment, 1]}>{state.count}</button>
    <h1>{dynamicFullName('Mouton-Brady')}</h1>
  </>
}

render(
  () => (
    // This `count` will be auto typed
    <Provider count={2}>
      <Counter />
      <Counter />
    </Provider>, 
    document.getElementById('app'),
  )
)
```

#### With async default props

```tsx
const [Provider, useProvider] = createStore({
  props: { url: 'https://get-counter.com/json' }, // This will auto type the props above and the <Provider> component props

  state: async (props) => {
    const count = await fetch(props.url).then(r => r.json())

    return { count, first: 'Alexandre' },
  },

  actions: (set, get) => ({ 
    increment(by = 1) {
        set('count', count => count + 1)
    },
    dynamicFullName(last) {
        return `${get.first} ${last} ${get.count}`;
    }
  }),
})

const Counter = () => {
  const [state, { increment, dynamicFullName }] = useProvider()

  // The count here will be synced between the two <Counter /> because it's global
  return <>
    <button onClick={[increment, 1]}>{state.count}</button>
    <h1>{dynamicFullName('Mouton-Brady')}</h1>
  </>
}

render(
  () => (
    // This `count` will be auto typed
    <Provider count={2} loader={<p>Loading...</p>}>
      <Counter />
      <Counter />
    </Provider>, 
    document.getElementById('app'),
  )
)
```

#### With props

Not setting the third parameters prevent typescript to infer the proper types for the props interface in the first function and the `<Provider>` component returned by the `createStore`.

If any Typescript ninja come accross this I'd be more than happy to know the right way to do that...

```tsx
const [Provider, useProvider] = createStore<{ count: number }>({
  state: (props) => ({ count: props.count, first: 'Alexandre' }),

  actions: (set, get) => ({ 
    increment(by = 1) {
        set('count', count => count + 1)
    },
    dynamicFullName(last) {
        return `${get.first} ${last} ${get.count}`;
    }
  })
})

const Counter = () => {
  const [state, { increment, dynamicFullName }] = useProvider()

  // The count here will be synced between the two <Counter /> because it's global
  return <>
    <button onClick={[increment, 1]}>{state.count}</button>
    <h1>{dynamicFullName('Mouton-Brady')}</h1>
  </>
}

render(
  () => (
    // This `count` props won't be typed...
    <Provider count={2}>
      <Counter />
      <Counter />
    </Provider>,
    document.getElementById('app')
  ),
)
```
