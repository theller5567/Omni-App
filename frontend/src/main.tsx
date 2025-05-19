import ReactDOM from 'react-dom/client'
import './styles/index.scss'
import App from './App'
// import { Provider } from 'react-redux' // Remove Redux Provider import
// import store from './store/store' // Remove store import

const rootElement = document.getElementById('root')
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    // <Provider store={store}> // Remove Provider wrapper
      <App />
    // </Provider>
  )
}
