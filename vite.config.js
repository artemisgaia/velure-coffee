import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import formsHandler from './api/forms.js'
import checkoutHandler from './api/checkout.js'
import rewardsHandler from './api/rewards.js'
import ordersHandler from './api/orders.js'
import stripeConfigHandler from './api/stripe-config.js'
import createPaymentIntentHandler from './api/create-payment-intent.js'

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

    server.middlewares.use('/api/rewards', async (req, res, next) => {
      try {
        await rewardsHandler(req, res)
      } catch (error) {
        next(error)
      }
    })

    server.middlewares.use('/api/orders', async (req, res, next) => {
      try {
        await ordersHandler(req, res)
      } catch (error) {
        next(error)
      }
    })

    server.middlewares.use('/api/stripe-config', async (req, res, next) => {
      try {
        await stripeConfigHandler(req, res)
      } catch (error) {
        next(error)
      }
    })

    server.middlewares.use('/api/create-payment-intent', async (req, res, next) => {
      try {
        await createPaymentIntentHandler(req, res)
      } catch (error) {
        next(error)
      }
    })
  },
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), formsApiPlugin()],
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        checkout: 'checkout.html',
      },
    },
  },
})
