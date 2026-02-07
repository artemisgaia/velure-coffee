import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import formsHandler from './api/forms.js'
import checkoutHandler from './api/checkout.js'

const formsApiPlugin = () => ({
  name: 'forms-api-dev-middleware',
  configureServer(server) {
    server.middlewares.use('/api/forms', async (req, res, next) => {
      try {
        await formsHandler(req, res)
      } catch (error) {
        next(error)
      }
    })

    server.middlewares.use('/api/checkout', async (req, res, next) => {
      try {
        await checkoutHandler(req, res)
      } catch (error) {
        next(error)
      }
    })
  },
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), formsApiPlugin()],
})
