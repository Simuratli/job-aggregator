import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { jobsApi } from './server/jobsApi.ts'

export default defineConfig({
  plugins: [react(), tailwindcss(), jobsApi()],
})
