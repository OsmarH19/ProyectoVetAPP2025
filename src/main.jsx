import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import 'toastr/build/toastr.min.css'
import toastr from 'toastr'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

toastr.options = {
  closeButton: true,
  progressBar: true,
  positionClass: "toast-top-right",
  timeOut: 4000,
  hideDuration: 300,
  showDuration: 300,
}

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
)
