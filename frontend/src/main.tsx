import React from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.scss'
import App from './App'
import { UserProvider } from './contexts/UserContext'
import { Provider } from 'react-redux'
import store from './store/store'

const rootElement = document.getElementById('root')
if (rootElement) {
  const root = createRoot(rootElement)
  root.render(
    <React.StrictMode>
      <Provider store={store}>
        <UserProvider>
          <App />
        </UserProvider>
      </Provider>
    </React.StrictMode>
  )
}
