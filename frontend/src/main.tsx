import ReactDOM from 'react-dom/client'
import './styles/index.scss'
import App from './App'
import { Provider } from 'react-redux'
import store from './store/store'

const rootElement = document.getElementById('root')
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <Provider store={store}>
      <App />
    </Provider>
  )
}
