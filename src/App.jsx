import './App.css'
import Pages from "@/pages/index.jsx"
import { Toaster } from "@/components/ui/toaster"
import SessionTimeoutManager from "@/components/auth/SessionTimeoutManager"

function App() {
  return (
    <>
      <Pages />
      <SessionTimeoutManager />
      <Toaster />
    </>
  )
}

export default App 
